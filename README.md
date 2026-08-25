# Rotary Institute 2027 — Goa · React app

Vite + React + React Router. Every route is a React component.

```
npm install
npm run dev        # http://localhost:5200
npm run build      # -> dist/
npm run preview
```

| Route | Component |
|---|---|
| `/` | `src/pages/Home.jsx` |
| `/about` | `src/pages/About.jsx` |
| `/schedule` | `src/pages/Schedule.jsx` |
| `/gels-gnls` | `src/pages/GelsGnls.jsx` |
| `/committee` | `src/pages/Committee.jsx` |
| `/hotel-venue` | `src/pages/HotelVenue.jsx` |

Content lives in `src/data/site.js` — the event details, the navigation and the
whole schedule. Change a string there and every page follows.

## The homepage is a port, not a rewrite

`website/index.html` is a captured *compiled* Next.js page: there is no source
for it, only minified chunks. So the homepage came across in three pieces:

- **Markup** — `scripts/extract-home.py` pulls the `<main>` contents out of the
  capture, `scripts/html-to-jsx.py` converts it attribute-for-attribute into
  `src/pages/HomeMarkup.jsx`. Both are re-runnable; edit the scripts, not the
  generated file.
- **Design** — `src/styles/home-extracted.css` is the inline CSS the capture had
  scattered through its DOM, plus `src/styles/legacy/*.css`, the build's own
  stylesheets, copied verbatim. The design is therefore identical, not
  reconstructed.
- **Motion** — `src/motion/useHomeMotion.js`. This is the one part that is a
  rebuild: the original's animation was compiled away, so the behaviours are
  re-authored on the same two libraries it used, GSAP with ScrollTrigger and
  Lenis. Timings are matched by eye.

Stylesheet order is fixed explicitly in `src/main.jsx` rather than left to the
module graph: the build's own sheets, then the extracted inline CSS, then
`chrome.css` and `quote.css`, then `rotary.css` which redefines the palette
on top of all of them, then `pages.css`. `chrome.css` exists for the same reason
`home-lazy.css` does: `extract-home.py` only reads `<main>`, so the header's
Emotion rules were never picked up and had to be lifted from the hydrated page.

`<body>` carries `is-ready __variable_6d1f58 __variable_f5db82`. Those are not
decoration — the compiled CSS declares the font custom properties on the two
`__variable_` classes and gates the cursor on `is-ready`.

## What is identical and what is not

Identical: all five sub-pages (their markup and CSS were written here), the
homepage's markup, its stylesheets, its type scale, its fluid rem root, the
palette, and every asset.

Not identical: the homepage's motion. Re-authored, so the scroll reveals, the
parallax and the beam read the same but are not the original tweens. The beam
keeps the exact clip-path geometry the capture shipped and only its position is
animated — rewriting the polygon would be redesigning it.

The beam keeps the capture's `#9c93e8`. The extracted CSS says `var(--purple)`,
which the Rotary palette override turns gold — the static build at `:8082`
hard-codes the lilac and so never picked the override up. `rotary.css` restores
it inside the beam only, so the two builds match. Delete that block to have the
beam follow the palette instead.

The homepage runs hero, venue panel and slider, programme cards, then the
quote / contact block and the footer. Three further sections were built earlier
and then cut on request — the achievement counters, the Goa place-name marquee
with its globe, and the news block. Their markup, CSS and motion have been
removed rather than left dead; re-deriving them means extracting from the
hydrated page again, the same way the header and quote block were done.

## From the animation spec

`docs/animation-spec.md` is a line-by-line reading of the original's motion,
recovered from the compiled chunks. Worth knowing before extending this:

- GSAP 3.13 with ScrollTrigger and **SplitText** — the text reveals split lines
  after `document.fonts.ready` with `mask: 'lines'`, a 3.13-only feature. Do not
  downgrade GSAP.
- Roughly a third of what looks like animation is plain CSS transitions on the
  `--easeOutQuart` / `--easeInOutQuart` tokens, already carried over in the CSS.
- The hero reel is the real WebGL (three.js + r3f, two custom shaders), but its
  `initialDistort` uniform is **0** in production, so the shader is doing almost
  nothing a CSS-transformed `<video>` cannot. That is why this port uses a plain
  video element: near-identical output, ~600KB less payload.
- Two things in the original look like bugs and are: `Math.PI` used as a degrees
  value in the beam rotation, and `ParallaxBox`'s min/max props inverted. Copy
  the behaviour, not the intent.
- Ported and measured against `:8082`: the line-mask reveals, the pinned service
  cards, the loader curtain, the beam and its pointer drift, the reel scrub with
  its control bar and mute toggle, the yellow knockout panel and the slider under
  it with its ten-second cycle and clip-path slide change, the pinned achievement
  counters, the place-name marquee, the CTA and icon-button reveals, and the
  header — hamburger sweep, menu wedge and contact panel (`SiteChrome.jsx`).
- Not ported: the page-status state machine that sequences the loader and the
  reveals.
- The custom cursor (`CustomCursor.jsx`, spec 5) is the one piece that had to
  come from the live site rather than the mirror. It mounts lazily on
  iventions.com, behind the same idle callback as the WebGL reel, and HTTrack
  never captured that chunk — which is why `:8082` has the CSS for it but no
  element, and why an early read of this port wrongly concluded there was
  nothing to port. Both discs are here: PLAY / PAUSE over the film and the 18rem
  Next / Previous over the venue slider.
- The capture has **no play/pause cursor in its DOM** — driving both `:8082` and
  the untouched mirror with Playwright finds no `CsCursor`/`Play_cursor` element,
  only the CSS for one. What the film actually offers there is the mute control
  in its bar; here clicking the film also plays and pauses it.
- The footer IS the capture's `Footer_footer__OGBct`, lifted by
  `scripts/extract-footer.py` into `src/components/SiteFooter.jsx` and
  `src/styles/footer.css`. Two things do not survive verbatim. The capture links
  a dozen `.html` pages this app has no route for: `about`, `schedule`,
  `gels-gnls`, `committee` and `hotel-venue` are remapped, Registration,
  Sponsorship and Contact go to the same mailto the header's Register uses, and
  Travel & Visa, Goa, FAQ and the three policy links are dropped rather than
  shipped as 404s — which leaves `styles_bottom_privacy__QFgGC` deliberately
  empty. And the big wordmark band (`css-1blqm19`) is empty in the mirror
  because the original mounts it on the client, so `Wordmark` fills it; the slot
  is 26.6rem and the mark's viewBox is 266 units, so it lands at its own size.
  The RI compliance line is not in the markup — `rotary.css` attaches it to the
  copyright row's `::before`, which is why adding it to the JSX renders it twice.
- The reel plays `media/venue-film.mp4` — 1280x714, 30fps, no audio track. The
  mute control in its bar is therefore decorative; the capture ships it and it
  toggles its own icon, but there is nothing to unmute. Clicking the film itself
  plays and pauses it, and that pause survives scrolling away and back.
- Where the mirror is incomplete, check the live site before concluding a thing
  does not exist: `website/` is an HTTrack capture and its lazily-mounted chunks
  did not all survive.
- `PageEffect.jsx` is the transition wipe (spec 2). It runs on route changes
  only: measured on `:8082`, the layer stays at opacity 0 through a cold load and
  only the loader curtain moves. Navigation is intercepted in the capture phase
  so the wipe finishes before the route changes.
- `QuoteContact.jsx` is the spotlight section the capture puts between every page
  and the footer (spec 14). It replaced the hand-written `.cta` block, which was
  standing in for it.

## Still open

Committee names, fee slabs, and the contact address
(`hello@rotaryinstitute2027goa.org` is a placeholder). "GELS/GNLS" is the
client's spelling; Rotary's own are GETS and GNTS.
