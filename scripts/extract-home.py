#!/usr/bin/env python3
"""Split the captured Next.js homepage into markup + stylesheet, losslessly.

Reads  ../../website/index.html
Writes ../src/styles/home-extracted.css   (every inline <style> body, doc order, deduped by rule)
       ../src/pages/home-extracted.html   (inner HTML of <main class="styles_home__sDEX3">, <style> stripped)

Also prints the inventory report the JSX-conversion step needs.
"""
import re
import sys
import collections
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE.parent
SRC_HTML = APP.parent / "website" / "index.html"
OUT_CSS = APP / "src" / "styles" / "home-extracted.css"
OUT_HTML = APP / "src" / "pages" / "home-extracted.html"

MAIN_OPEN = '<main class="styles_home__sDEX3">'
STYLE_RE = re.compile(r"<style\b[^>]*>(.*?)</style>", re.S)

# HTML void elements - these need explicit self-closing in JSX.
VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


def split_rules(css):
    """Split a CSS blob into top-level statements, byte-losslessly.

    Depth-0 `}` closes a block; depth-0 `;` closes a bare at-rule.
    Quote-aware so `content:"}"` cannot desync the depth counter.
    """
    out, depth, quote, start = [], 0, None, 0
    i = 0
    while i < len(css):
        c = css[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "\"'":
            quote = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth <= 0:
                depth = 0
                out.append(css[start:i + 1])
                start = i + 1
        elif c == ";" and depth == 0:
            out.append(css[start:i + 1])
            start = i + 1
        i += 1
    if css[start:]:
        out.append(css[start:])
    assert "".join(out) == css, "rule splitter lost bytes"
    return out


# Case-preserving tag scanner. html.parser lowercases attribute names, which
# would hide srcSet / stdDeviation / viewBox - exactly the names JSX cares about.
TAG_RE = re.compile(r"<([A-Za-z][-\w:]*)")
ATTR_RE = re.compile(
    r"""([^\s=/<>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?"""
)
URL_ATTRS = {"src", "href", "poster", "data-src", "xlink:href"}
SRCSET_ATTRS = {"srcset", "srcSet", "imagesrcset", "imageSrcSet"}


def scan_tags(markup):
    """Yield (tagname, self_closing, [(attr, value_or_None)]) with case intact."""
    for m in TAG_RE.finditer(markup):
        i, depth_quote = m.end(), None
        while i < len(markup):
            c = markup[i]
            if depth_quote:
                if c == depth_quote:
                    depth_quote = None
            elif c in "\"'":
                depth_quote = c
            elif c == ">":
                break
            i += 1
        body = markup[m.end():i]
        selfclosing = body.rstrip().endswith("/")
        if selfclosing:
            body = body.rstrip()[:-1]
        attrs = []
        for a in ATTR_RE.finditer(body):
            name = a.group(1)
            val = next((g for g in a.groups()[1:] if g is not None), None)
            attrs.append((name, val))
        yield m.group(1), selfclosing, attrs


class Inventory:
    def __init__(self, markup):
        self.tags = collections.Counter()
        self.attrs = collections.Counter()
        self.attr_owner = collections.defaultdict(set)
        self.bool_attrs = collections.Counter()
        self.selfclosed = collections.Counter()
        self.void_used = collections.Counter()
        self.inline_styles = 0
        self.urls = []
        for tag, selfclosing, attrs in scan_tags(markup):
            self.tags[tag] += 1
            if tag.lower() in VOID:
                self.void_used[tag] += 1
            if selfclosing:
                self.selfclosed[tag] += 1
            for name, value in attrs:
                self.attrs[name] += 1
                self.attr_owner[name].add(tag)
                if value is None:
                    self.bool_attrs[name] += 1
                elif name == "style":
                    self.inline_styles += 1
                    self.urls += re.findall(r"url\(\s*['\"]?([^'\")]+)", value)
                elif name in SRCSET_ATTRS:
                    self.urls += [p.strip().split()[0]
                                  for p in value.split(",") if p.strip()]
                elif name in URL_ATTRS:
                    self.urls.append(value)


def prefix_of(url):
    if url.startswith(("http://", "https://", "//")):
        return "EXTERNAL " + url.split("/")[2]
    if url.startswith("data:"):
        return "data: URI"
    if url.startswith("#"):
        return "(fragment)"
    if url.startswith("/_next"):
        return "BROKEN /_next/..."
    m = re.match(r"^(/[^/]+)/", url)
    if m:
        return "ROOT-ABS " + m.group(1)
    m = re.match(r"^([\w-]+)/", url)
    return "RELATIVE " + m.group(1) if m else "RELATIVE (bare)"


def main():
    raw = SRC_HTML.read_text(encoding="utf-8")

    # ---- A) stylesheet -------------------------------------------------
    blocks = STYLE_RE.findall(raw)
    seen, rules = set(), []
    for body in blocks:
        for rule in split_rules(body):
            if rule.strip() and rule not in seen:
                seen.add(rule)
                rules.append(rule)
    OUT_CSS.parent.mkdir(parents=True, exist_ok=True)
    OUT_CSS.write_text("\n".join(rules) + "\n", encoding="utf-8")

    # ---- B) markup -----------------------------------------------------
    a = raw.index(MAIN_OPEN)
    inner_start = a + len(MAIN_OPEN)
    inner_end = raw.index("</main>", inner_start)
    markup_src = raw[inner_start:inner_end]
    markup = STYLE_RE.sub("", markup_src)
    # nothing but the <style> elements may have been removed
    assert len(markup_src) - len(markup) == sum(
        len(m.group(0)) for m in STYLE_RE.finditer(markup_src))
    assert "<style" not in markup and "<script" not in markup
    OUT_HTML.parent.mkdir(parents=True, exist_ok=True)
    OUT_HTML.write_text(markup, encoding="utf-8")

    # ---- report --------------------------------------------------------
    inv = Inventory(markup)

    # cross-check the case-preserving scanner against stdlib's parser
    class _Count(HTMLParser):
        n = 0

        def handle_starttag(self, *a):
            self.n += 1
        handle_startendtag = handle_starttag
    c = _Count()
    c.feed(markup)
    assert c.n == sum(inv.tags.values()), (c.n, sum(inv.tags.values()))

    p = print
    p("=" * 72)
    p("OUTPUTS")
    p(f"  {OUT_CSS}\n    {OUT_CSS.stat().st_size:,} bytes")
    p(f"  {OUT_HTML}\n    {OUT_HTML.stat().st_size:,} bytes")

    p("\nSTYLE BLOCKS")
    p(f"  <style> blocks in document : {len(blocks)}")
    p(f"  in-<main> blocks stripped  : {len(STYLE_RE.findall(markup_src))}")
    p(f"  total top-level rules      : {sum(len(split_rules(b)) for b in blocks)}")
    p(f"  unique rules kept          : {len(rules)}")
    p(f"  raw css bytes              : {sum(len(b) for b in blocks):,}")

    p("\nELEMENTS")
    p(f"  total elements : {sum(inv.tags.values())}")
    p(f"  distinct tags  : {len(inv.tags)}")
    for tag, n in sorted(inv.tags.items(), key=lambda kv: (-kv[1], kv[0])):
        p(f"    {tag:<12} {n}")

    p("\nATTRIBUTES")
    p(f"  distinct attribute names : {len(inv.attrs)}")
    for name, n in sorted(inv.attrs.items(), key=lambda kv: (-kv[1], kv[0])):
        owners = ",".join(sorted(inv.attr_owner[name]))
        p(f"    {name:<22} {n:>5}   on: {owners}")

    p("\nBOOLEAN / VALUELESS ATTRIBUTES")
    p(f"  {dict(inv.bool_attrs) or 'none'}")

    p("\nINLINE style=\"\" ATTRIBUTES")
    p(f"  {inv.inline_styles}  (each must become a JSX style object)")

    p("\nVOID / SELF-CLOSING ELEMENTS (need <x /> in JSX)")
    p(f"  void tags present   : {dict(inv.void_used) or 'none'}")
    p(f"  written self-closed : {dict(inv.selfclosed) or 'none'}")
    p(f"  literal '/>' count  : {markup.count('/>')}")

    p("\nASSET URLS BY PREFIX")
    groups = collections.defaultdict(collections.Counter)
    for u in inv.urls:
        groups[prefix_of(u)][u] += 1
    for pre in sorted(groups):
        uniq = groups[pre]
        p(f"  {pre}   ({len(uniq)} distinct, {sum(uniq.values())} refs)")
        for u in sorted(uniq):
            p(f"      {u}")
    p("=" * 72)


if __name__ == "__main__":
    sys.exit(main())
