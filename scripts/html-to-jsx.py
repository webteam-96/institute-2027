"""Convert the extracted homepage markup into a real JSX component.

    python scripts/html-to-jsx.py

Reads src/pages/home-extracted.html (the captured <main> contents, with the
inline <style> blocks already pulled out into src/styles/home-extracted.css) and
writes src/pages/HomeMarkup.jsx.

This is a mechanical transform — attribute names, self-closing tags, inline
style objects — so that the homepage becomes ordinary editable JSX rather than a
blob handed to dangerouslySetInnerHTML.
"""

import pathlib
import re
from html.parser import HTMLParser

HERE = pathlib.Path(__file__).resolve().parent
APP = HERE.parent
SRC = APP / "src" / "pages" / "home-extracted.html"
OUT = APP / "src" / "pages" / "HomeMarkup.jsx"

DEAD_ROUTES = {'/service/events.html': '/schedule', '/service/exhibits.html': '/gels-gnls', '/service/congresses.html': '/schedule', '/service/sports.html': '/gels-gnls', '/projects/filter.html': '/hotel-venue'}

# html.parser lower-cases TAG names as well as attributes, and SVG filter
# primitives are camelCase. Left lowercased React renders inert elements and the
# #goo filter silently does nothing.
TAG_RENAME = {
    "fegaussianblur": "feGaussianBlur",
    "fecolormatrix": "feColorMatrix",
    "feblend": "feBlend",
    "femerge": "feMerge",
    "femergenode": "feMergeNode",
    "feoffset": "feOffset",
    "feflood": "feFlood",
    "fecomposite": "feComposite",
    "fedropshadow": "feDropShadow",
    "feturbulence": "feTurbulence",
    "fedisplacementmap": "feDisplacementMap",
    "lineargradient": "linearGradient",
    "radialgradient": "radialGradient",
    "clippath": "clipPath",
    "textpath": "textPath",
    "foreignobject": "foreignObject",
}


def jsx_tag(name):
    return TAG_RENAME.get(name, name)


VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr", "path", "circle", "rect",
    "line", "polygon", "polyline", "ellipse", "stop", "use",
}

# HTML attribute -> JSX property. Anything not listed and not data-/aria- gets
# camelCased on the hyphens.
RENAME = {
    "class": "className",
    "for": "htmlFor",
    "srcset": "srcSet",
    "viewbox": "viewBox",
    "preserveaspectratio": "preserveAspectRatio",
    "crossorigin": "crossOrigin",
    "autoplay": "autoPlay",
    "playsinline": "playsInline",
    "tabindex": "tabIndex",
    "colspan": "colSpan",
    "rowspan": "rowSpan",
    "maxlength": "maxLength",
    "readonly": "readOnly",
    "contenteditable": "contentEditable",
    "spellcheck": "spellCheck",
    "clip-path": "clipPath",
    "fill-rule": "fillRule",
    "clip-rule": "clipRule",
    "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "gradientunits": "gradientUnits",
    "patternunits": "patternUnits",
    "fetchpriority": "fetchPriority",
    "imagesrcset": "imageSrcSet",
    "imagesizes": "imageSizes",
    # HTMLParser lower-cases attribute names, so every camelCase SVG attribute
    # has to be restored by hand or React rejects it.
    "stddeviation": "stdDeviation",
    "floodcolor": "floodColor",
    "floodopacity": "floodOpacity",
    "colorinterpolationfilters": "colorInterpolationFilters",
    "gradienttransform": "gradientTransform",
    "patterncontentunits": "patternContentUnits",
    "markerwidth": "markerWidth",
    "markerheight": "markerHeight",
    "refx": "refX",
    "refy": "refY",
    "spreadmethod": "spreadMethod",
    "textlength": "textLength",
    "lengthadjust": "lengthAdjust",
    "baseprofile": "baseProfile",
    "primitiveunits": "primitiveUnits",
    "filterunits": "filterUnits",
    "maskunits": "maskUnits",
    "maskcontentunits": "maskContentUnits",
    "clippathunits": "clipPathUnits",
}

# Attributes React does not accept and that carry no meaning once the markup is
# rendered by React itself.
DROP = {"data-reactroot"}

BOOLEAN = {
    "muted", "loop", "controls", "autoplay", "playsinline", "disabled",
    "checked", "selected", "readonly", "required", "hidden", "inert", "open",
}


def jsx_attr_name(name):
    if name in RENAME:
        return RENAME[name]
    if name.startswith("data-") or name.startswith("aria-"):
        return name
    if "-" in name:
        head, *rest = name.split("-")
        return head + "".join(p[:1].upper() + p[1:] for p in rest)
    return name


def style_object(value):
    """`color:red;font-size:2px` -> `{{ color: 'red', fontSize: '2px' }}`"""
    parts = []
    for decl in value.split(";"):
        decl = decl.strip()
        if not decl or ":" not in decl:
            continue
        prop, _, val = decl.partition(":")
        prop = prop.strip()
        val = val.strip().replace("'", "\\'")
        if prop.startswith("--"):
            key = "'%s'" % prop
        else:
            head, *rest = prop.split("-")
            key = head + "".join(p[:1].upper() + p[1:] for p in rest)
            if key.startswith("webkit"):
                key = "Webkit" + key[6:]
        parts.append("%s: '%s'" % (key, val))
    return "{{ %s }}" % ", ".join(parts)


def escape_text(text):
    # JSX reads braces as expressions; everything else in a text node is literal.
    return text.replace("{", "{'{'}").replace("}", "{'}'}")


class ToJSX(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.out = []
        self.depth = 0
        self.open_stack = []

    def pad(self):
        return "  " * (self.depth + 2)

    def handle_starttag(self, tag, attrs):
        self.emit_tag(tag, attrs, self_close=tag in VOID)

    def handle_startendtag(self, tag, attrs):
        self.emit_tag(tag, attrs, self_close=True)

    def emit_tag(self, tag, attrs, self_close):
        bits = []
        for name, value in attrs:
            if name in DROP:
                continue
            if value is None:
                bits.append(jsx_attr_name(name))
                continue
            if name == "style":
                bits.append("style=%s" % style_object(value))
                continue
            if name in BOOLEAN and value in ("", name, "true"):
                bits.append(jsx_attr_name(name))
                continue
            safe = value.replace('"', "&quot;")
            bits.append('%s="%s"' % (jsx_attr_name(name), safe))
        attr_text = (" " + " ".join(bits)) if bits else ""
        if self_close:
            self.out.append("%s<%s%s />" % (self.pad(), jsx_tag(tag), attr_text))
        else:
            self.out.append("%s<%s%s>" % (self.pad(), jsx_tag(tag), attr_text))
            self.depth += 1
            self.open_stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.open_stack or self.open_stack[-1] != tag:
            # The capture contains a few unbalanced tags from streaming markers;
            # ignore a close that does not match what is actually open.
            if tag not in self.open_stack:
                return
            while self.open_stack and self.open_stack[-1] != tag:
                self.depth -= 1
                closing = self.open_stack.pop()
                self.out.append("%s</%s>" % (self.pad(), jsx_tag(closing)))
        self.depth -= 1
        self.open_stack.pop()
        self.out.append("%s</%s>" % (self.pad(), jsx_tag(tag)))

    def handle_data(self, data):
        if not data.strip():
            return
        self.out.append("%s%s" % (self.pad(), escape_text(data.strip())))

    def handle_entityref(self, name):
        self.out.append("%s&%s;" % (self.pad(), name))

    def handle_charref(self, name):
        self.out.append("%s&#%s;" % (self.pad(), name))

    def handle_comment(self, data):
        # React streaming markers (<!--$-->, <!--/$-->) mean nothing here.
        return


def main():
    if not SRC.exists():
        raise SystemExit("missing %s — run scripts/extract-home.py first" % SRC)
    html = SRC.read_text(encoding="utf-8")

    parser = ToJSX()
    parser.feed(html)
    while parser.open_stack:
        parser.depth -= 1
        tag = parser.open_stack.pop()
        parser.out.append("%s</%s>" % (parser.pad(), jsx_tag(tag)))

    body = "\n".join(parser.out)
    out = (
        "/* GENERATED by scripts/html-to-jsx.py from the captured homepage.\n"
        " * Re-run that script rather than editing this file by hand.\n"
        " *\n"
        " * This is the homepage's own markup, converted attribute for attribute:\n"
        " * the design is carried by src/styles/home-extracted.css, which holds the\n"
        " * inline styles the capture had scattered through the DOM. */\n\n"
        "export default function HomeMarkup() {\n"
        "  return (\n"
        "    <>\n"
        "%s\n"
        "    </>\n"
        "  )\n"
        "}\n" % body
    )
    OUT.write_text(out, encoding="utf-8")
    print("wrote %s (%d bytes, %d lines)" % (OUT.name, len(out), out.count("\n")))


if __name__ == "__main__":
    main()
