# Homepage Animation Spec — Rotary Institute 2027 Goa

Reverse-engineered from the compiled Next.js build in
`E:/Kalpesh/project/Rotary-institute-2027-Goa/website/_next/static/chunks/*.js` and
`.../static/css/*.css`, plus the SSR DOM in `E:/Kalpesh/project/Rotary-institute-2027-Goa/website/index.html`.

Every duration / ease / value below is quoted verbatim from the minified chunks. Where a
number looks odd (`0.44999999999999996`, `0.5499999999999999`) that is the literal float in
the bundle — it comes from arithmetic like `0.6 * 0.75`, keep it or round, it makes no
visible difference.

---

## 0. Libraries, versions, wiring

| Thing | Value | Where found |
|---|---|---|
| GSAP core | `version="3.13.0"` | `vendors-a066095a-*.js` (webpack module `25231`) |
| ScrollTrigger | `3.13.0` | `vendors-e1bed6ae-*.js` (module `30276`) |
| SplitText | `3.13.0` | `vendors-e1bed6ae-*.js` (module `66808`) |
| `useGSAP` (`@gsap/react`) | bundled with gsap core chunk | module `85616`, used everywhere as `(0,r.L)(...)` |
| Lenis | `window.lenisVersion="1.3.7"` | `vendors-b9fa02b6-*.js` |
| `lenis/react` (`ReactLenis`, `useLenis`) | same chunk | module `47789` |
| three.js + @react-three/fiber + drei | `three-*.js` chunks | only for the hero video reel |
| zustand | module `91116` | menu open/close store |
| @preact/signals-react | module `40368` (`Ul`=signal, `HO`=computed, `R0`=effect) | all "reactive" glue |

### GSAP plugins actually registered by app code

Only two: `ScrollTrigger` and `SplitText`.

```js
gsap.registerPlugin(ScrollTrigger)   // module 30276
gsap.registerPlugin(SplitText)       // module 66808
```

`Observer` and `Flip` are present in the vendor chunk only because ScrollTrigger imports
Observer internally. **No Observer, no ScrollSmoother, no ScrollToPlugin, no Draggable, no
CustomEase.** All scroll-position tweening is either `ScrollTrigger` or a per-frame
`useLenis(cb)` callback with `gsap.quickSetter`.

Note for the port: since GSAP 3.13 the whole plugin set (SplitText included) ships in the
public `gsap` npm package, so `import { SplitText } from "gsap/SplitText"` works with the
`gsap@^3.13.0` already in `package.json`. No Club token needed.

### Lenis construction — exact options

`app/layout-447f6180ce0765e8.js`, module `49996`:

```jsx
<ReactLenis root ref={ref} options={{ autoRaf: false }}>
  {children}
</ReactLenis>
```

That is the **entire** options object. Everything else is Lenis 1.3.7 defaults:

```
wrapper: window, content: document.documentElement, eventsTarget: window,
smoothWheel: true, syncTouch: false, syncTouchLerp: 0.075, touchInertiaExponent: 1.7,
duration: undefined, easing: undefined, lerp: 0.1,
infinite: false, orientation: "vertical", gestureOrientation: "vertical",
touchMultiplier: 1, wheelMultiplier: 1, autoResize: true,
overscroll: true, autoRaf: false, anchors: false, autoToggle: false,
allowNestedScroll: false
```

`autoRaf: false` because the RAF is driven off the GSAP ticker so the two clocks never drift:

```js
useLayoutEffect(() => {
  function raf(time) { ref.current?.lenis?.raf(time * 1000) }
  gsap.ticker.add(raf)
  return () => { gsap.ticker.remove(raf) }
}, [])
```

Lifecycle hooks on the same component:
- on page **enter**: `lenis.start()` and `window.lenis = lenis` (the WebGL reel reads the
  global to call `lenis.scrollTo`).
- on page **prefetch** (leave animation starts): `lenis.stop()`
- on **assets loaded**: `lenis.start()`
- on page **leave**: `window.scrollTo(0,0)` then `lenis.scrollTo(0, { immediate: true, force: true })`

There is **no** `lenis.on('scroll', ScrollTrigger.update)` and no `scrollerProxy`. Lenis 1.x
drives the real window scroll, so ScrollTrigger picks it up from native scroll events.
`ScrollTrigger.refresh()` is called on a 100 ms timeout after page enter
(`ZE(100)` in module `79281`) and debounced 150 ms on any `ResizeObserver` hit on `document.body`.

### Page lifecycle state machine

Module `860` / `37881`. Nearly every animation is gated on this, so it must be ported first.

```
PREFETCH = -3, REPLACE = -2, LEAVE = -1, IDLE = 0, PLAY = 1, ENTER = 2
```

Hooks (module `43718`) used as the trigger for most one-shots:

| export | fires when | used for |
|---|---|---|
| `nV` — onPagePlay | status > IDLE | header drop-in, hero goo shape, WebGL reel scale-in |
| `v6` — onPageEnter | status > PLAY | ScrollTrigger refreshes, lenis start, mobile text reveals |
| `bT` — onPagePrefetch | prefetch fires while not idle | page-transition **out** wipe |
| `wo` — onAssetsLoaded | assets loaded while not idle | page-transition **in** wipe |
| `Ob` — onPageLeave | | reset clip-paths/menus |
| `$R` — watch(status===ENTER) | | video play/pause, contact overlay |

`document.body` gets `is-ready` added on `pagePlay()` and removed on `pageLeave()`.
CSS: `body:not(.is-ready), body:not(.is-ready) * { cursor: wait !important }`.

### Global easing tokens (CSS, for the pure-CSS behaviours)

```css
--easeOutQuart:   cubic-bezier(0.165, 0.84, 0.44, 1)
--easeInOutQuart: cubic-bezier(0.76, 0, 0.24, 1)
--easeInQuart:    cubic-bezier(0.895, 0.03, 0.685, 0.22)
--easeOutQuad:    cubic-bezier(0.5, 1, 0.89, 1)
--easeInOutQuad:  cubic-bezier(0.45, 0, 0.55, 1)
--easeOutCubic:   cubic-bezier(0.33, 1, 0.68, 1)
--easeInOutCubic: cubic-bezier(0.65, 0, 0.35, 1)
```

### Root font-size (affects every rem value below)

```css
html { font-size: 2.6666666667vw }                       /* < 768px  */
@media (min-width:768px)  { html { font-size: 1.3020833333vw } }
@media (min-width:1200px) { html { font-size: 0.5208333333vw } }
```
Breakpoints in JS: mobile `< 768`, tablet `768–1199`, desktop `>= 1200` (module `52815`:
`tI = 768`, `Lg = 1200`, `p9 = 300` ms, `fd = 100` ms).

---

## 1. Page loader curtain

**Name:** `pageLoader`
**Target:** `.PageLoader_pageLoader___1cgC` (module `74522` / `49717`)
**CSS:** `position:fixed; inset 0; 100vw × 100svh; z-index:9999999; background:#f3efe9; will-change:opacity`
**Trigger:** page load. Driven by an asset counter (`AssetsProvider`, module `21573`):
`registerAssets()` / `unRegisterAssets()`, progress = `round(loaded / total * 100)` clamped to 100.
On mount it registers twice, unregisters once after `100 ms` (`p9`… actually `fd = 100`), and
once more when `document.fonts.ready` resolves (+10 ms).

**Tween 1 — the counter (one-shot, retargeting):**
```js
gsap.quickTo(counterObj, "value", {
  ease: "power3",
  duration: 0.15,
  onUpdate: () => { /* textContent = "PO: " + round(value) + "%" */ }
})
```
**Tween 2 — the curtain fade (one-shot):** fires the first frame the counter reaches ≥ 100.
```js
gsap.to(loaderEl, {
  opacity: 0,          // from 1
  duration: 0.15,
  ease: "power3.inOut",
  pointerEvents: "none",
  onComplete: pageEnter
})
```
`pagePlay()` is called immediately before this tween starts, which is what releases the
header drop-in / hero shape / reel scale-in below.

There is also a CSS fallback class `.PageLoader_isHide__G3cPU { pointer-events:none; opacity:0 }`.

> The DOM node is a bare `<div>` — no counter text is rendered in this build even though the
> code writes `"PO: NN%"` into a (never-attached) ref. Reproduce as a plain colour curtain.

---

## 2. Page-transition clip-path wipe

**Name:** `pageTransition`
**Targets:** outer `.PageEffect_transition___7lnX.PageEffect_maskClip__mlGl_`, inner
`.PageEffect_transition__inner__ybluL` (module `45736`, css map `53650`)

```css
.PageEffect_transition___7lnX { position:fixed; z-index:99999999; 100vw × 100vh; left:0; top:0;
  pointer-events:none; opacity:0; will-change:opacity }
.PageEffect_transition__inner__ybluL { width:100%; height:100%; background: var(--primary-yellow) }
.PageEffect_maskClip__mlGl_ { --size:0px; --y:0px; --x:100vw; left:0 }
@media (min-width:1440px) { .PageEffect_maskClip__mlGl_ { --x:0vw } }
.PageEffect_maskClip__mlGl_.PageEffect_isMasking__jp6mb {
  mask-image: url(/test-mask.svg);         /* a 100×100 svg containing one black circle r=50 */
  mask-origin: content-box;
  mask-position: calc(var(--x) - var(--size)/2) calc(var(--y) - var(--size)/2), center;
  mask-repeat: no-repeat;
  mask-size: var(--size), contain;
}
```

### 2a. LEAVE (`onPagePrefetch`) — timeline, one-shot

Reads the live `clip-path` off `document.querySelector('.js-header-menus')` (normal pages) or
`.js-section-contact`, converts `px`→`%`, and derives a "fully open" target polygon.

Branch A — menu is open, or we are not on a "normal" placement:
```js
tl.fromTo(outer, { opacity: 0, pointerEvents: "auto" },
                 { opacity: 1, duration: 0.3, ease: "power3.inOut" })
```
Branch B — normal:
```js
// from-polygon is chosen by breakpoint:
desktop (>=1200): "polygon(0% 0%, 10% 0%, 100% 20%, 100% 100%, 70% 100%, 0% 6%)"
mobile  (<768):   "polygon(80% 0%, 100% 0%, 100% 8%, 65% 100%, 0% 100%, 0% 50%)"
tablet:           "polygon(90% 0%, 100% 0%, 100% 8%, 40% 100%, 0% 100%, 0% 40%)"

tl.fromTo(outer, { "--size": "0px", opacity: 1, pointerEvents: "auto" }, {
  onStart:    () => outer.classList.add("PageEffect_isMasking__jp6mb"),
  "--size":   (2.6 * Math.max(window.innerHeight, window.innerWidth)) + "px",
  duration:   0.8,
  ease:       "power3.inOut",
  onComplete: () => outer.classList.remove("PageEffect_isMasking__jp6mb")
})
```
Then in both branches:
```js
tl.fromTo(inner, { clipPath: fromPolygon }, {
  clipPath: toPolygon,      // e.g. "polygon(90% 0%, 100% 0%, 100% 10%, 100% 100%, 0% 100%, 0% 0%)"
  duration: 1,
  ease: "power3.inOut",
  onComplete: routerPush
})
```
The `toPolygon` derivation (`b()` in source): if the polygon's first point starts with `0`,
every percentage between 20 % and 70 % is snapped to `0%`; otherwise the literal
replacements `40% 100% → 100% 100%`, `65% 100% → 100% 100%`, `0% 40% → 0% 0%`,
`0% 50% → 0% 0%` are applied.

### 2b. ENTER (`onAssetsLoaded`) — one-shot

```js
// desktop
from = "polygon(100% 0%, 100% 100%, -0% -0%, 100% 100%, 0% 100%, -0% -0%)"
to   = "polygon(100% 0%, 100% 0%,   -0% -0%, 0% 100%,   0% 100%, -0% -0%)"
// non-desktop
from = "polygon(0% 100%, 100% -0%, 0% 100%,   100% 100%, 100% -0%, 0% 0%)"
to   = "polygon(0% 0%,   100% -0%, 100% 100%, 100% 100%, 100% -0%, 0% 0%)"

gsap.fromTo(inner, { clipPath: from }, {
  clipPath: to,
  duration: 1.2,
  ease: "power3.inOut",
  clearProps: "clipPath",
  onStart:    () => setTimeout(pagePlay, 150),
  onComplete: () => { gsap.set(outer, { pointerEvents:"none", opacity:0 }); pageEnter() }
})
```

**Port note:** GSAP interpolates `polygon()` point-by-point, so every from/to pair must keep
the **same point count** (they all have 6). Keep the `-0%` literals; they matter only in that
they must survive as valid numbers.

---

## 3. Menu open / close sweep

Module `73800`, css maps `56806`/`64881`/`66941`. State lives in a zustand store
(`isMenuOpen`, `openMenu`, `closeMenu`, `toggleMenu`).

### 3a. Header drop-in (one-shot on `pagePlay`)

**Target:** `header.styles_header__vbDbd`
```js
gsap.set(header, { yPercent: -100 })            // in useGSAP init
// onPagePlay:
gsap.to(header, {
  yPercent: 0,
  duration: 1.3,
  delay: isHadShapeHero ? 0.8 : 0,   // isHadShapeHero === true on "/", "/about", "/service/*"
  ease: "power3.out"
})
```

### 3b. Hamburger line sweep (`k()` — a paused timeline, replayed on demand)

**Targets:** the two `<span>` fills inside `.styles_hamburger_line__Dwrd7`
(`#141414`, `position:absolute; inset 0; will-change:transform`).

```js
const tl = gsap.timeline({ paused:true, defaults:{ duration: D, ease:"power3.out" },
  onStart:    () => { if (manageState) isAnimating = true },
  onComplete: () => { if (manageState) isAnimating = false } })

gsap.set(line1, { xPercent: initialXPercent })   // initialXPercent default 0
gsap.set(line2, { xPercent: initialXPercent })

tl.to(line1, { xPercent: 100 })
tl.to(line2, { xPercent: 100, onComplete: () => {
     // optional: toggle `styles_toggled_burger__vo7Lk` on the button wrapper and
     //           gsap.set(both, { borderRadius: "9999px" })  (or "0" on remove)
     gsap.set(line1, { xPercent: slideBackFromPercent })
     gsap.set(line2, { xPercent: slideBackFromPercent })
   }}, "-=" + (D - 0.1))
tl.to(line1, { xPercent: 0 })
tl.to(line2, { xPercent: 0 }, "-=" + (D - 0.1))
tl.play()
```

Call sites:

| event | D | slideBackFromPercent | toggles burger class |
|---|---|---|---|
| **hover** the menu button | `0.44999999999999996` | `-200` | no |
| **open** menu | `0.6` | `-100` | yes, `"add"` |
| **close** menu | `0.6` | `-100` | yes, `"remove"` |

Alongside the hover sweep, the button label rolls:
```js
labelRoller.animateFrom({ yPercent: 0 }, { yPercent: -100,
  duration: 0.5499999999999999, ease: "power3.out" })
```

On **open**:
```js
gsap.killTweensOf([labelOpen, labelClose])
gsap.to(labelOpen,  { yPercent: -100, duration: 0.7, ease: "power3.out", delay: isDesktop ? 0 : 0.7 })
gsap.to(labelClose, { yPercent: -100, duration: 0.7, ease: "power3.out", delay: isDesktop ? 0 : 0.7 })
```
On **close**:
```js
if (isDesktop) { gsap.to(labelOpen,{yPercent:0,duration:.7,ease:"power3.out"});
                 gsap.to(labelClose,{yPercent:0,duration:.7,ease:"power3.out"}) }
else           { gsap.to(labelClose,{yPercent:100,duration:.7,ease:"power3.out"}) }
```

The `toggled_burger` class is pure CSS and turns the two bars into an X:
```css
.styles_toggled_burger__vo7Lk .styles_hamburger_line__Dwrd7 { width:1.25rem; position:absolute; top:50%; left:50% }
.styles_toggled_burger__vo7Lk .styles_hamburger_line__Dwrd7:first-child { transform: translate(-50%,-50%) rotate(-45deg) }
.styles_toggled_burger__vo7Lk .styles_hamburger_line__Dwrd7:last-child  { transform: translate(-50%,-50%) rotate(45deg) }
```

### 3c. Menu panel circular mask reveal (one-shot per toggle)

**Targets:** `.styles_menus__Fobad.styles_maskClip__Rk0Jm` (the fixed overlay) and the inner
`.styles_menus_inner__9X7sY.js-header-menus`.

```js
const size = 2.8 * Math.max(window.innerHeight, window.innerWidth)

// OPEN
gsap.fromTo(menuOverlay, { "--size": "0px", opacity: 1 }, {
  pointerEvents: "auto",
  onStart: () => { inner.classList.add("styles_on_show__wWWIr");
                   menuOverlay.classList.add("styles_isMasking__67XHX") },
  "--size": size + "px",
  duration: 1.2,
  ease: "power3.inOut",
  onComplete: () => { isMenuAnimating = false;
                      menuOverlay.classList.remove("styles_isMasking__67XHX") }
})

// CLOSE
gsap.fromTo(menuOverlay, { "--size": size + "px" }, {
  pointerEvents: "none",
  "--size": "0px",
  duration: 0.8,
  ease: "power3.inOut",
  onStart:    () => menuOverlay.classList.add("styles_isMasking__67XHX"),
  onComplete: () => { gsap.set(menuOverlay, { opacity: 0 });
                      isMenuAnimating = false;
                      inner.classList.remove("styles_on_show__wWWIr");
                      menuOverlay.classList.remove("styles_isMasking__67XHX") }
})
```
The mask geometry is the same `--size/--x/--y` recipe as §2, using `/test-mask.svg` (a black
circle). Because `--size` is a plain custom property, GSAP tweens it as a unit-suffixed
number — no `CSS.registerProperty` is used, so **the mask position/size must be read by CSS
`calc()` and not by the compositor**; this is why the class is only added for the duration of
the tween (masking a full-screen layer is expensive).

`.styles_menus_inner__9X7sY.styles_on_show__wWWIr` sets a static clip-path per breakpoint
(this is the yellow diagonal panel shape, **pure CSS, no transition**):
```css
< 768px : polygon(80% 0, 100% 0, 100% 8%, 65% 100%, 0 100%, 0 50%)
>= 768px: polygon(90% 0, 100% 0, 100% 8%, 40% 100%, 0 100%, 0 40%)
>=1200px: polygon(0 0, 10% 0, 100% 20%, 100% 100%, 70% 100%, 0 6%)
```

Menu items are **pure CSS**:
```css
.styles_menus__items_item__eOxOq { transition: opacity .6s var(--easeOutQuart); will-change: opacity }
.styles_menus__items__hZxYX:has(.styles_menus__items_item__eOxOq:hover)
  .styles_menus__items_item__eOxOq:not(:hover) { opacity:.5 }
```
Backdrop, also pure CSS:
```css
.styles_overlay__SxW5X { background: rgba(0,0,0,.32); opacity:0;
  transition: opacity .8s var(--easeInOutQuart); transition-delay:.2s; pointer-events:none }
.styles_overlay__SxW5X.styles_toggled__4yeBE { opacity:1; transition-delay:0s; pointer-events:auto }
```

Opening the menu also calls `lenis.stop()`; closing calls `lenis.start()`.

---

## 4. Hero entrance

Module `26823` (`HomeHero`), rendered inside a 200 svh sticky wrapper (`47793` / lazily
`42823` on desktop).

### 4a. Line-mask text reveal (the workhorse — used across the whole site)

Shared hook, module `5730` (`useLinesMaskMotion`) and wrapper component module `83516`
(`<Lines>`), reveal trigger module `85665`.

**Split:**
```js
gsap.registerPlugin(SplitText)
await document.fonts.ready
el.classList.add("Lines_lines__3d___6rMc")     // only for the 3d variant
el.classList.add("will-change-transform")
split = new SplitText(isBlock ? el.children : el, {
  type: "lines",
  mask: "lines",                                // SplitText 3.13 native line masking
  linesClass: "line " + (fixClip ? "fix-clip" : ""),
  aria: "none",
  onSplit: s => s.lines.forEach((l,i) => {
     if (l.textContent === "") l.innerHTML = "&nbsp;"
     l.style.setProperty("--line-index", String(i))
  })
})
gsap.set(split.lines, { yPercent: 150 })
```

**Defaults:** `{ duration: 1.2, stagger: 0.1, ease: "power3.out" }`

**motionIn (one-shot):**
```js
gsap.fromTo(split.lines, { opacity: 1, yPercent: 150 },
                         { yPercent: 0, duration: 1.2, stagger: 0.1, ease: "power3.out", ...overrides })
```
**motionOut (one-shot):**
```js
gsap.to(split.lines, { yPercent: -150, duration: 1.2, stagger: 0.1, ease: "power3.out", ...overrides })
```

Two sibling variants exist in `<Lines type=…>`:

- `lines_fade` — defaults `{ duration: 1.4, ease: "power3.out" }`, from `{yPercent:100, opacity:0}` to `{yPercent:0, opacity:1}`; out to `{yPercent:100}`.
- `lines_3d` — defaults `{ duration: 1.6, stagger: 0.1, ease: "power3.out" }`,
  from `{ yPercent:100, rotationX:-90, rotationY:-30 }` to `{ yPercent:0, rotationX:0, rotationY:0 }`;
  out is `{ yPercent:100, duration: 0.8, stagger: -0.065 }`.
  Needs `.Lines_lines__3d___6rMc, .Lines_lines__3d___6rMc .line { perspective:1000px }`.

Supporting CSS (needed or the descenders get clipped):
```css
.fix-clip, .fix-mask-clip-mask { overflow:clip; padding-bottom:.115em; margin-bottom:-.115em;
  clip-path: inset(.1em 0 0 0) !important; padding-right:.015em; margin-right:-.015em }
@media (min-width:1200px) { .fix-clip, .fix-mask-clip-mask { padding-bottom:.125em;
  margin-bottom:-.125em; clip-path: inset(.0925em 0 0 0) !important;
  padding-right:.02em; margin-right:-.02em } }
```

**Hero specifics:**
- `h1` label → `<Lines fixClip isBlock motion={{ delayEnter: 1.2 }}>`
- `h2` description → `<Lines fixClip isBlock motion={{ delayEnter: 1.6 }}>`
- hero wordmark image `/upload/home-hero-text.svg`, `.styles_content_image__bvRpE`,
  `mix-blend-mode: overlay` — **no** tween, it just sits there.

### 4b. Generic scroll-reveal trigger (module `85665`)

Every `<Lines>` (and image/icon reveal) is wrapped in this. It is what makes section reveals
happen — **one-shot, `once:true`**.

```js
gsap.registerPlugin(ScrollTrigger)
if (!isOnShow) gsap.set(el, { visibility: "hidden" })   // hidden until revealed

// on pagePlay:
if (el.getBoundingClientRect().top < window.innerHeight) {
  animate(vars)                                          // already on screen → fire now
} else {
  ScrollTrigger.create({
    trigger: el,
    start: motion.start ?? `top+=${threshold}% bottom`,
    once: true,
    onEnter: () => animate(vars),
    onLeave: kill
  })
}
```
`vars` is:
```js
{
  onStart: () => gsap.set(el, { visibility: "visible" }),
  delay: computedDelay
}
```

**`threshold`** (module `79281`, `PI`): if no explicit threshold and the element starts below
the fold, `threshold = clamp(mapRange(height/vh, 0, 100, 30, 0), 0, 30)` — for a normal-height
element this lands at ≈ `29.7`, i.e. `start: "top+=29.7% bottom"`. Effectively "when the
element's top has travelled ~30 % of its own height past the viewport bottom".

**`delay`** (module `79281`, `uf`): if the element is already inside the viewport
(`0 <= rect.top <= vh`) **and** the page is at the very top (`|scrollY| < 10`), the delay is
`(motion.delayEnter ?? 0) + 300/1000` — i.e. the `delayEnter` values above plus a flat
**0.3 s**. Otherwise the delay is `motion.delayTrigger ?? 0`.

So the real hero timings are `1.2 + 0.3 = 1.5 s` and `1.6 + 0.3 = 1.9 s` after `pagePlay`.

### 4c. Gooey purple beam ("spotlight") — hero

**Targets:** `.styles_clipPath__jYDI7 > .styles_clipPath_wrapper__2EjOL > figure.styles_clipPath_wrapper_figure__thifo`
containing a `filter: url(#goo)` box with two clip-path'd `#9C93E8` squares.

```css
.styles_clipPath__jYDI7 { position:absolute; top:0; left:0; width:100%; height:100%;
  overflow:hidden; pointer-events:none; background:#eae3dc }
.styles_clipPath_wrapper__2EjOL { position:absolute; width:100%; height:100% }
.styles_clipPath_wrapper_figure__thifo { width:100%; height:100%; aspect-ratio:1/1;
  position:relative; will-change:transform }
```

The animated box: `position:absolute; top:50%; left:50%; w=h= max(110vw,110vh);
transform: translate(-50%,-50%); filter: url(#goo); --poLeft:75%; --poRight:25%`.
Its two children:
```
top shard:    bottom: max(50vw,50vh); clip-path: polygon(25% 0, 75% 0, 51% 100%, 49% 100%)
bottom shard: top:    max(50vw,50vh); clip-path: polygon(49% 0, 51% 0, var(--poLeft) 100%, var(--poRight) 100%)
```
The `#goo` SVG filter (desktop only, and skipped entirely on Safari — `eB()` UA sniff):
```xml
<filter id="goo">
  <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="name"/>
  <feColorMatrix in="name" mode="matrix"
     values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15" result="aab"/>
  <feBlend in="SourceGraphic" in2="aab"/>
</filter>
```

**Init:** `gsap.set(rotorGroup, { rotate: -145 })`, `gsap.set(box, { scale: 0 })`.
**On `pagePlay`** (hero passes `delay = 0.5`), three parallel one-shots:
```js
gsap.to(box,        { scale: 1,                        duration: 1.2, ease: "power3.inOut", delay: 0.5 })
gsap.to(box,        { "--poLeft": "180%",
                      "--poRight": "-100%",            duration: 1.2, ease: "power3.inOut", delay: 0.8 })
gsap.to(rotorGroup, { rotate: 40,                      duration: 1.2, ease: "power3.inOut", delay: 1.5 })
```
(i.e. `delay`, `delay+0.3`, `delay+1`.)

**Mouse follow (continuous, not GSAP — a raw signal effect writing `style.transform`):**
```js
const cx = window.innerWidth / 2, cy = window.innerHeight / 2
const dx = smoothedClientX - cx
figure.style.transform =
  `translate(${0.02*dx}px, ${0.02*(smoothedClientY - cy)}px) rotate(${dx/cx * Math.PI}deg)`
```
Note `Math.PI` is used as a **degree** value (≈ 3.14159deg at the screen edge) — that is not a
bug in the transcription, it is what the bundle does. Guarded by an IntersectionObserver so it
only runs while the hero is visible.

`smoothedClientX/Y` come from the cursor context (§5) — they are already eased with
`quickTo(duration:0.5, ease:"power3")`, which is where the lag comes from.

---

## 5. Custom cursor

Module `39986` (`CursorProvider`) + module `41757` (the two cursor components).

### 5a. Pointer smoothing (global, always on)

```js
mx = gsap.quickTo(clientXSignal, "value", { duration: 0.5, ease: "power3" })
my = gsap.quickTo(clientYSignal, "value", { duration: 0.5, ease: "power3" })
mx(window.innerWidth / 2); my(window.innerHeight / 2)     // initial

window.addEventListener("mousemove", e => { mx(e.clientX); my(e.clientY)
   relX = e.clientX; relY = e.clientY; isInLeftZone = e.clientX < window.innerWidth/2 })
window.addEventListener("touchmove", e => { /* same with e.touches[0] */ })
```
`relX/relY` are the **raw** values, `clientX/clientY` are the smoothed ones. Both are consumed
elsewhere (hero beam, footer light, contact clip-path).

### 5b. Cursor shell positioning

**Target:** `.CsCursor_cursor__xtq78`
```css
.CsCursor_cursor__xtq78 { position:fixed; left:0; top:0; pointer-events:none; z-index:9999;
  will-change:transform; transform:translateZ(0); backface-visibility:hidden }
```
Per signal update (so effectively per frame while the mouse moves):
```js
qx = gsap.quickSetter(el, "x", "px"); qy = gsap.quickSetter(el, "y", "px"); qz = gsap.quickSetter(el, "z", "px")
const { width, height } = el.getBoundingClientRect()
qx(clientX - width/2); qy(clientY - height/2); qz(0)
```
The native cursor is **not** hidden (`cursor:none` never appears in the CSS). Cursor types
(module `10453`): `default | slide-control | play | pause | loading`.

### 5c. "Next / Previous" slide-control cursor (GSAP)

Yellow circle `18rem × 18rem`, `border-radius:50%`, `bg: var(--primary-yellow)`, uppercase
12px Soehne, containing `Next` and (absolutely positioned at `top:100%`) `Previous`.

```js
gsap.set(circle, { scale: 0 })                 // init

// show/hide — driven by cursorType
gsap.to(circle, { scale: cursorType === "slide-control" ? 1 : 0,
                  duration: 0.8, ease: "power3.out", overwrite: "auto" })

// Next <-> Previous swap, driven by isInLeftZone
gsap.to(textStack, { yPercent: isInLeftZone ? -100 : 0,
                     duration: 0.8, ease: "power3.out", overwrite: "auto" })
```
Only mounted on `/` and `/about`.

### 5d. Play / Pause cursor — **pure CSS**

**Target:** `.Play_cursor__f_Ajo` plus classes `Play_show__s52Nf`, `Play_show__play__I5ZPK`,
`Play_show__pause__5XO2_`, toggled from JS. Position is the shared GSAP shell; every state
change is a CSS transition:

```css
.Play_cursor__f_Ajo .Play_iconWrapper__ulVDt { transform:scale(0);
  transition: transform .6s var(--easeOutQuart) }
.Play_cursor__f_Ajo .Play_icon__5Z81R { transform:scale(0); opacity:0;
  transition: transform .6s var(--easeOutQuart), opacity .6s var(--easeOutQuart) }
.Play_cursor__f_Ajo .Play_text__F4reF    { transform:translateY(0);
  transition: transform .6s var(--easeOutQuart) }
.Play_cursor__f_Ajo .Play_content__9tv28 { transform:translateY(150%);
  transition: transform .6s var(--easeOutQuart) }

.Play_show__s52Nf .Play_content__9tv28 { transform:translateY(0) }
.Play_show__s52Nf .Play_iconWrapper__ulVDt { transform:scale(1) }
.Play_show__play__I5ZPK  .Play_icon__play__cHJJ1  { transform:scale(1); opacity:1 }
.Play_show__play__I5ZPK  .Play_text__F4reF { transform:translateY(0) }
.Play_show__pause__5XO2_ .Play_icon__pause__Ir4Id { transform:scale(1); opacity:1 }
.Play_show__pause__5XO2_ .Play_text__F4reF { transform:translateY(-100%) }
```

---

## 6. Scroll-linked parallax on images (`ParallaxBox`)

Module `91524`. **Not** ScrollTrigger — a `useLenis(cb)` per-frame callback + `quickSetter`.
Desktop only (`isDesktop`), and only after `isPageEnter`.

**Targets:** `.styles_parallaxBox__19SzL` (outer, measured) → `.styles_parallaxBox_inner__yVlq6`
(inner, translated). Modifiers `styles_isClip__0Mxib { overflow:clip }`,
`styles_isBackground__IYJam { overflow:hidden; height:100% (100svh ≥1200px) }`,
`styles_isFade__Stdxv { will-change: opacity, transform }`.

**Props / defaults:** `offset = 0.5`, `start = 0.5`, `speed = 1`, `isFadeEffect = false`,
plus optional `min` and `max` clamps.

```js
setY  = gsap.quickSetter(inner,   "y", "px")
setOp = gsap.quickSetter(fadeEl, "opacity")

useLenis(() => {
  if (!isPageEnter || !isDesktop) return
  const vh = viewportHeight
  const { top, height, bottom } = outer.getBoundingClientRect()
  const elAnchor  = offset < 0 ? height - height*Math.abs(offset) : height*offset   // default height/2
  const vpAnchor  = start  < 0 ? vh     - vh    *Math.abs(start)  : vh    *start    // default vh/2
  if (!(bottom > 0 && top < vh)) return                                             // off-screen: skip

  // mapRange(top+elAnchor, vpAnchor, vpAnchor - vh/2, 0, vh/2)  ==  (vpAnchor - (top+elAnchor))
  let y = (vpAnchor - (top + elAnchor)) * speed
  if (min !== undefined) y = Math.min(y, min)     // NOTE: `min` prop is the UPPER clamp
  if (max !== undefined) y = Math.max(y, max)     //       `max` prop is the LOWER clamp
  setY(y)

  if (isFadeEffect) {
    let o = 0
    if (top < 0)                    o = 0.8 * (0.35*vh - bottom) / (0.35*vh)   // leaving upward
    else if (bottom > vh && max!==0) o = 0.8 * (top - vh)/(0.35*vh) + 0.8      // entering from below
    setOp(Math.min(Math.max(o, 0), 1))
  }
})
```
The fade element is an absolutely-positioned black `100%×100%` box with `opacity:0;
will-change:opacity; pointer-events:none` layered over the content — it darkens to 0.8 at the
edges of the viewport.

`.styles_parallaxBox_inner__yVlq6 { will-change: transform }` is mandatory.

---

## 7. Section reveals

Two mechanisms, both already described:

1. **Text** — `<Lines>` + module `85665` trigger (§4a / §4b). Every heading, paragraph and
   label on the page uses it. Selector to look for in the SSR DOM: nested
   `<span class="will-change-transform">` pairs plus `.text` / `.text__clone`.
2. **Roll-up text component** (module `51301`) — used for header labels, service card titles,
   footer links. It renders `.text` and an absolutely-positioned `.text__clone`, both inside
   `overflow:hidden` (`fix-mask-clip-mask` when `fixClip`).

```js
gsap.set(inner, { yPercent: 110 })            // when withInit

onHover:    gsap.fromTo(inner, { yPercent: 0 },   { yPercent: -100, ease:"power3.out", duration: 1.2, ...o })
motionIn:   gsap.fromTo(outer, { yPercent: 110 }, { yPercent: 0,    ease:"power3.out", duration: 1.2, ...o })
            gsap.set(inner, { yPercent: 0 })
motionOut:  gsap.to(outer,     { yPercent: 100,     ease:"power3.out", duration: 1.2, ...o })
            gsap.set(inner, { yPercent: -100 })
animateTo:  gsap.to(inner,     { ease:"power3.out", duration: 1.2, ...o })
animateFrom:gsap.fromTo(inner, from, { ease:"power3.out", duration: 1.2, ...to })
```

3. **Images** — `ImagePlaceholder` (module `45979`) is a **pure CSS** two-image crossfade:
```css
.ImagePlaceholder_imagePlaceholder__original__CpPiD { opacity:0; will-change:opacity;
  transition: opacity .4s var(--easeInOutQuart); position:absolute; inset:0 }
.ImagePlaceholder_imagePlaceholder__original__CpPiD.ImagePlaceholder_isLoaded__A0g_D { opacity:1 }
```
A 32×32 quality-10 thumbnail loads eagerly underneath; the full image gets `isLoaded` in its
`onLoad`.

4. **Icon buttons** (`.Service_icon__GNT_0`, `.ProjectSliderActions_icon__5M3_9`,
   `.VideoControl_iconInner__wCHTN`, all containing `.main-icon`) — module `68672`:
```js
// init
const w = doubleIcon.parentElement.offsetWidth
gsap.set(doubleIcon, { gap: (w/4)+"px", xPercent: reverse ? 125 : -225 })

// hover-enter: the double-arrow slides through
gsap.fromTo(doubleIcon, { xPercent: reverse ? 0 : -125, overwrite:"auto" },
                        { xPercent: reverse ? -125 : 0, duration: 1.2,
                          ease: "power3.out", overwrite: "auto" })

// reveal-in (when animateIn)
gsap.to(wrapper,    { scale: 1,                        duration: 1.2, ease: "power3.out" })
gsap.to(doubleIcon, { xPercent: reverse ? 0 : -125,    duration: 1,   ease: "power3.out", delay: 0.2 })
```
plus a magnetic 3D tilt on the white inner plate (module `46781`):
```js
useMagneticHover({ maxRotation: 10, duration: 0.7, ease: "power3.out", defaultRotateY: 0 })
// four parallel quickTo's on "--rX", "--rY", "rotationX", "rotationY"
// rotX = clamp(-(clamp(dy/(h/2),-1,1)) * maxRotation * 1.5, -15, 15)
// rotY = clamp( (clamp(dx/(w/2),-1,1)) * maxRotation * 1.5, -15, 15)
// mouseleave -> all four back to 0
```
Wrapper needs `perspective: 10rem; transform-style: preserve-3d`, and the inner plate is
pre-transformed `translateZ(-2.5rem) scale(1.25)` (`x8(10, -2.5)`).

---

## 8. Pinned / sticky service cards ("programme")

Module `49776`. Desktop only (`useMediaQuery("(min-width:1200px)")`).

**Target:** each card root (a `Box` with `bg: card background`, `h: 100vh` on desktop) and its
inner `.js-service-image`.

### 8a. The pin + the shrink/rotate (scrubbed via a CSS variable)

```js
gsap.registerPlugin(ScrollTrigger)
st = ScrollTrigger.create({
  trigger: card,
  start: "center center",
  end: isLast ? "bottom bottom" : "bottom top-=50%",
  pin: true,
  pinSpacing: false,
  onUpdate: self => {
    if (isLast) return
    const p = Math.min(Math.max(mapRange(self.progress, 0.25, 1, 0, 1), 0), 1)
    card.style.setProperty("--progress", String(p))
  }
})
```
`mapRange(v,a,b,c,d) = (v-a)*(d-c)/(b-a)+c` — so `progress` 0→0.25 does nothing, then 0.25→1
drives `--progress` 0→1.

The card's own style consumes it (no GSAP involved past the variable):
```css
--progress: 0;
--image-border-radius: 0;                 /* set from JS, see below */
--is-odd: 1 for even index, -1 for odd;
border-radius: calc(var(--progress) * var(--image-border-radius));
transform: scale(calc(1 - var(--progress) * 0.4))
           rotate(calc(var(--is-odd) * -10deg * var(--progress))) !important;
will-change: transform;
```
`--image-border-radius` is measured once (and on every resize) as
`2 * parseFloat(getComputedStyle('.js-service-image').borderRadius) + "px"`.
On non-desktop the trigger is killed and `--progress` forced to `"0"`.

### 8b. Card image scale (scrubbed, true GSAP scrub)

```js
gsap.to(imgEl, {
  scale: 1,                                  // from inline style scale: 1.4
  duration: 1,
  ease: "none",
  scrollTrigger: {
    trigger: cardContainer,
    start: "top bottom",
    end: "top top",
    scrub: true,
    invalidateOnRefresh: true
  }
})
```
The `<img>` carries `style={{ willChange:"transform", objectFit:"cover", scale: noInit ? 1 : 1.4 }}`.

### 8c. Card text
`<Lines isSkipRevert fixClip isBlock>` on the title, plus a roll-up label — §7.

---

## 9. Vertical marquee of place names ("Where we worked" / venue partners)

Module `10883` in `3930-*.js`. DOM: `.styles_worked__ZRqpe` → `.styles_worked_main__rjWnX`,
containing 19 × `<p class="styles_label__NPZVh js-worked-brand">`.

```css
.styles_worked__ZRqpe { width:100dvw; background: var(--primary-black); overflow:clip; padding:8rem 0 }
@media (min-width:1200px) { .styles_worked__ZRqpe { padding:32rem 0 } }
.styles_label__NPZVh { color: var(--white); transition: color .6s var(--easeOutQuart) }
.styles_label__NPZVh.styles_active__QpCRt { color: var(--primary-yellow) !important }
```
The left caption and right logo both sit in
`position:sticky; top: calc(50vh - var(--height)/2); height: var(--height)`, where
`--height` is set from JS to the measured height of one `.js-worked-brand` row.

### 9a. The slide (scrubbed)

```js
const setY = gsap.quickSetter(grid, "y", "px")
// offsetTop of the inner list relative to the section:
S = innerList.getBoundingClientRect().top - section.getBoundingClientRect().top

st = ScrollTrigger.create({
  trigger: section,
  start: "top bottom",
  end: "bottom top",
  scrub: true,
  onToggle: () => recomputeS(),
  onUpdate: self => {
    scrollProgress.value = self.progress
    setY( Math.min( Math.min(3.5 * self.progress, 1) * S - S, 0 ) )
  }
})
```
So the whole list starts translated up by `-S` and settles to `0` over the first
`1/3.5 ≈ 28.6 %` of the section's scroll range, then holds. Desktop only; on non-desktop the
trigger is killed and `setY(0)`.

### 9b. Which name is "active"

Two paths, both one-shot class toggles (the colour change itself is the CSS transition above):

*Desktop* — on every `scrollProgress` change:
```js
const r = row.getBoundingClientRect(), vh = viewportHeight
const active = (isFirst && r.bottom > vh/2)
            || (r.top < vh/2 && r.bottom > vh/2)
            || (isLast  && r.top < vh/2)
if (active) activeIndex.value = index
row.classList.toggle("styles_active__QpCRt", active)
```
*Non-desktop* — a per-row ScrollTrigger:
```js
ScrollTrigger.create({ trigger: row, start: "top center", end: "bottom center", scrub: true,
  onEnter:     () => activeIndex.value = index,
  onEnterBack: () => activeIndex.value = index })
```

### 9c. The paired logo cross-fade

Each partner logo (`.EventSliderEventLogo_imageOuter__AKaW6`) registers a tween pair:
```js
gsap.set(logo, { opacity: 0 })                            // all but index 0
playIn:  gsap.to(logo, { opacity: 1, duration: 0.8, delay, ease: "power3.out" })
playOut: gsap.to(logo, { opacity: 0, duration: 0.8, delay, ease: "power3.out" })
```

---

## 10. Hero video reel (WebGL) and the sticky prominent block

### 10a. The reel container scrub

Module `47793` (non-desktop) / `42823` (desktop). Section is `h: 100svh` mobile,
`200svh` desktop, `overflow: clip`, with a `position:sticky; top:0; h:100svh` child.

```js
ScrollTrigger.create({
  trigger: section,
  start: "top top",
  end: "bottom-=10% bottom",
  scrub: true,
  onUpdate: self => updateScrollProgress(self.progress)     // signal, 0..1
})
```
`scrollProgress` is the single driver for the whole reel: it makes the plane grow from a small
card to fullscreen, flattens its rotation, removes its rounded corners, and fades in the
control bar.

### 10b. The r3f scene

Module `23099` in chunk `3099`, loaded via `next/dynamic({ ssr:false })` behind a
`requestIdleCallback(..., { timeout: 2000 })` (fallback `setTimeout(800)`).

Config constants:
```js
{ initialDistort: 0, maxDistort: 5, velocityFactor: 20, uSpeed: 0.5,
  initialRadius: 0.08, lookAtAmplitude: 0.3, lookAtLerpSpeed: 0.1 }
```
Camera: `<PerspectiveCamera makeDefault position={[0,0,9]} fov={40} />`, one `ambientLight
intensity={3.5}`. Mesh: `planeGeometry [1,1,10,10]` with a custom `ShaderMaterial`
(`transparent:true`).

Initial card size: `569 × 381` design px scaled by `window.innerWidth/1920`, converted to
world units by `2 * tan(fov/2) * |camera.z|`.

**Scale-in (one-shot, on `pagePlay`):**
```js
gsap.to(group.scale, { x:1, y:1, z:1, duration: 1, delay: 1.5, ease: "power3.inOut",
                       onComplete: () => setScaleAnimationComplete(true) })
```
(`<group scale={0}>` initially.)

**Per-frame (`useFrame`, gated on in-viewport + isPageEnter):**
```js
const p = scrollProgress          // 0..1 from the ScrollTrigger above
material.uniforms.uTime.value   = clock.getElapsedTime()
material.uniforms.uRadius.value = initialRadius * (1 - p)          // 0.08 -> 0 corner radius

// mouse look, lerped
targetX = -clamp(mouseNdcY, -0.35, 0.35) * lookAtAmplitude
targetY =  clamp(mouseNdcX, -0.35, 0.35) * lookAtAmplitude
cur.x  += (targetX - cur.x) * 0.1
cur.y  += (targetY - cur.y) * 0.1
mesh.rotation.x = (cur.x - mapRange(p, 0, 1, 0.3, 0)) * (1 - p)
mesh.rotation.y = (cur.y - mapRange(p, 0, 1, 0.1, 0)) * (1 - p)

// size + position lerp to fullscreen
mesh.scale.set( initialW + (viewportW - initialW) * p,
                initialH + (viewportH - initialH) * p, 1 )
mesh.position.lerp-by-hand toward (0,0,0) with factor p

// "cover" fit: uTextureRepeat / uTextureOffset recomputed from video aspect vs mesh aspect
```
Shaders: vertex applies simplex-3D-noise z displacement (`noiseFreq 2.0`, amplitude
`uDistort`, phase `uTime * uSpeed`); fragment is a rounded-box SDF that `discard`s outside the
rounded rect and samples the video texture. Both are quoted in full in
`chunks/320.127f79f47e8ad8bc.js` modules `90785` (vertex) and `65919` (fragment).

**Pointer behaviour (module `18992`):**
- Enter/move on the plane sets cursor type `play`/`pause`; a `setTimeout(3000)` auto-hides it.
- Click: unmute (`video.muted=false; volume=1`), `video.play()`, set cursor `pause`, and if
  `scrollProgress < 1`:
  ```js
  window.lenis.scrollTo(document.getElementById("home-hero-scroll-target").offsetTop, {
    duration: 1, onStart: …, onComplete: … })
  ```
  A second click while `scrollProgress === 1` pauses.
- `IntersectionObserver` (threshold 0) pauses/plays on visibility; `isMuted` signal
  mutes/unmutes.

### 10c. Video control bar (module `45292`)

Shared animate helper: `gsap.to(el, { duration: 1, ease: "power3.out", ...vars })`.

| element | trigger | tween |
|---|---|---|
| bar wrapper (`opacity:0`) | `scrollProgress >= 1` | `opacity: 0 → 1` |
| label stack | `scrollProgress >= 1` | `yPercent: 0 → -100` |
| progress track (`scaleX(0)`, origin left) | `scrollProgress >= 1` | `scaleX: 0 → 1` |
| progress fill (`scaleX(0)`, origin left) | `videoProgress` signal | `gsap.to(fill, { scaleX: videoProgress, ease:"none", duration: 0 })` |

Mute button icons are **pure CSS**:
```css
.VideoControl_iconWrapper__hJQGE .VideoControl_icon__uOYML { transform:scale(0);
  will-change:transform; transition: transform .3s var(--easeInOutQuart) }
.VideoControl_iconWrapper__hJQGE.VideoControl_show__mute__tM5Lg  .VideoControl_icon__mute__9AGnd   { transform:scale(1) }
.VideoControl_iconWrapper__hJQGE.VideoControl_show__unmute__3HDfF .VideoControl_icon__unmute__fkfIM { transform:scale(1) }
```

### 10d. Mobile reel card (module `26823`)

```js
gsap.set(cardWrapper, { scale: 0 })
gsap.set(videoWrapper, { scale: 2 })
// on reveal (via the §4b trigger, motion.delayEnter = 1.4):
gsap.to([cardWrapper, videoWrapper], { scale: 1, duration: 1.2, ease: "power3.out" })
```

---

## 11. The sticky "prominent block" + venue slider

Module `4940` (home page default export).

### 11a. Yellow knockout panel slide-off (scrubbed)

Outer is `h: 200vh`; inner is `position:sticky; top:0; h:100vh` on desktop.
```js
ScrollTrigger.create({
  trigger: section,
  start: "top top",
  end: "bottom-=15% bottom",
  onUpdate: self => {
    // panel translate, quickSetter(el, "y", "%")
    panelRef.scrollAnimation(-(100 * self.progress))        // 0% -> -100%
    // side effects:
    if (self.progress > 0.5 && !faded)  { startAutoSlide(); fadeIn()  }
    if (self.progress <= 0.5 && faded)  { stopAutoSlide();  fadeOut() }
    if (self.progress >= 1) enableCursor("slide-control"); else disableCursor("slide-control")
  }
})
```
The panel itself is an SVG knockout (module `19078`, lazy, `ssr:false`): a full-viewport
`<svg>` with `<mask id="text-mask">` = white rect minus `<text>` lines (fed from a SplitText
line split of the same copy), and a `<rect fill="var(--primary-yellow)" mask="url(#text-mask)"/>`.
Font metrics: `16rem / lineHeight 0.9 / letterSpacing -0.48rem / weight 500`, `textAnchor
middle`, vertically centred with `y = vh/2 - (lines-1)/2 * fontSize * lineHeight + i*fontSize*lineHeight`.

### 11b. Slider container reveal (scrubbed)

```js
setY = gsap.quickSetter(contentEl, "y", "px")
ScrollTrigger.create({
  trigger: section,
  start: "top bottom",
  end: "bottom bottom",
  onUpdate: self => setY(-viewportHeight * (1 - self.progress))    // -vh -> 0
})
```

### 11c. Slide transition (clip-path polygon morph, one-shot per change)

Eight-point polygons built by `Z(points)`:
```js
REST       = polygon(100% 50%, 100% 50%, -10% 50%, -10% 50%, -10% 50%, -10% 50%, 100% 50%, 100% 50%)
FORWARD[0] = polygon(100% 0%,  100% 0%,  -10% 50%, -10% 50%, -10% 50%, -10% 50%, 100% 100%, 100% 100%)
FORWARD[1] = polygon(100% 0%,  -10% 0%,  -10% 50%, -10% 50%, -10% 50%, -10% 50%, -10% 100%, 100% 100%)
REST_BACK  = polygon(110% 50%, 110% 50%, 0% 50%,  0% 50%,  0% 50%,  0% 50%,  110% 50%, 110% 50%)
BACKWARD[0]= polygon(110% 50%, 110% 50%, 0% 0%,   0% 0%,   0% 100%, 0% 100%, 110% 50%, 110% 50%)
BACKWARD[1]= polygon(110% 50%, 110% 50%, 110% 0%, 0% 0%,   0% 100%, 110% 100%, 110% 50%, 110% 50%)
```
```js
playIn(vars) {
  const seq = goingBackwards ? BACKWARD : FORWARD
  gsap.killTweensOf([slide, dimmer])
  const tl = gsap.timeline({ defaults: { delay, ease: "none", duration: 0.8 },
                             onComplete: vars.onComplete })
  gsap.set(slide,  { visibility: "visible", clipPath: prevIndex > index ? REST_BACK : REST,
                     zIndex: counter++ })
  gsap.set(dimmer, { opacity: 0.32 })
  seq.forEach((poly, i) => {
    const ease = i === seq.length - 1 ? "power3.out" : (i === 0 ? "power3.in" : "none")
    tl.to(slide, { clipPath: poly, ease })
  })
  tl.play()
}
playOut() {
  gsap.set(slide,  { visibility: "hidden", delay: 0.8 * 2, clearProps: "clipPath" })
  gsap.to(dimmer,  { opacity: 0.7, duration: 0.8 * 3, ease: "power3.out" })
}
```
(`$.length === 2`, so `delay: 1.6` and `duration: 2.4`.) `dimmer` is a full-bleed
`bg:black; opacity:.32; will-change:opacity; pointer-events:none` layer.

Per-slide metadata (`project-type`, `project-location`, `project-description`) uses the
roll-up component with `delayIn: 0.75` / `0.85`.

### 11d. Autoplay + progress bar

Module `54552` (`SliderProvider`): `autoSlideInterval = 1e4` (10 s), `autoSlideAfterSlide: true`.
Driven by `gsap.ticker`:
```js
timeline = gsap.timeline({ repeat: -1, onRepeat: () => { next(); restartCountdown() } })
timeline.to({}, { duration: interval/1000 })
countdown = 100 - 100 * clamp((Date.now() - t0)/interval, 0, 1)   // ticker callback, rounded
```
Line indicator (module `4940`, `el`):
```js
scaleXSetter = gsap.quickTo(bar, "scaleX", { duration: 0.8, ease: "linear" })

// fade in / out of the whole rail (driven by the `faded` signal from §11a)
faded ? (gsap.set(rail, { transformOrigin:"left", scaleX:0 }),
         gsap.to(rail, { scaleX:1, duration:1, ease:"power3.out" }))
      : (gsap.set(rail, { transformOrigin:"right" }),
         gsap.to(rail, { scaleX:0, duration:1, ease:"power3.out" }))

// per-tick fill: scaleX = mapRange(countdown, 100, 0, i/n, (i+1)/n)
```
Slider prev/next arrow buttons are throttled to one action per `800 ms`; clicking the slide
area itself is throttled to `500 ms` and picks prev/next from `isInLeftZone`.

---

## 12. Pinned achievement counters

Module `97166`. Present on the homepage via the `achivementBlock` RSC data.

```js
ScrollTrigger.create({
  trigger: sectionRoot,
  start: () => `top+=${firstItem.getBoundingClientRect().height / 2}px center`,
  end:   () => `bottom-=${lastItem.getBoundingClientRect().height / 2}px center`,
  pin: pinnedLabelGrid,
  pinSpacing: false,
  onUpdate: self => { scrollProgress.value = self.progress }
})
```
Each numeral column and each caption slides:
```js
gsap.set(el, { yPercent: index === 0 ? 0 : (index > activeIndex ? 100 : -100) })
// becomes active:
gsap.to(el, { yPercent: 0, duration: 0.5, ease: "power3" })
// leaves:
gsap.to(el, { yPercent: index > activeIndex ? 100 : -100, duration: 0.5, ease: "power3" })
```

---

## 13. News / insights hover expansion

Module `95256` (`styles_item__OXawi`, `styles_circle__jNQ6k`, `styles_circle_inner__m5zHN`,
`styles_content__LLh8c`, `styles_overlay__KQ1_J`, `styles_line__Ausrd`).

Constants:
```js
{ CIRCLE_SIZE: { initial: "6.4rem", expanded: "72.3rem" },
  DURATIONS: { main: 0.4, textMotion: 0.8, leaveDelay: 0.2 },
  EASE: "power3.inOut",
  PARALLAX_FACTOR: 0.02, PARALLAX_DURATION: 0.5,
  GAP_X: 32 * window.innerWidth / 1920 }
```

**The circle growth is pure CSS**, driven by `:hover`:
```css
.styles_item__OXawi .styles_circle__jNQ6k { top:0; left:0;
  transform: translate(calc(var(--gap-x) * -1 - 100%)); pointer-events:none;
  transition: transform .4s var(--easeInOutQuart), top .8s var(--easeOutQuart), left .8s var(--easeOutQuart) }
@media (min-width:1200px) {
  .styles_item__OXawi .styles_circle_inner__m5zHN { width:6.4rem; height:6.4rem;
    transition: width .4s var(--easeInOutQuart), height .4s var(--easeInOutQuart) }
  .styles_item__OXawi:hover .styles_circle__jNQ6k { pointer-events:auto;
    top: var(--real-center-y); left:50%;
    transform: translate(calc(-50% - var(--gap-x)), -50%) }
  .styles_item__OXawi:hover .styles_circle_inner__m5zHN { width:72.3rem; height:72.3rem }
}
.styles_bottom__ivX84 .styles_overlay__KQ1_J { opacity:0; will-change:opacity;
  transition: opacity .8s var(--easeOutQuart); pointer-events:none }
.styles_bottom__ivX84:has(.styles_item__OXawi:hover) .styles_overlay__KQ1_J { opacity:.6; pointer-events:auto }
.styles_item__OXawi .styles_button__8WP4f { transition: transform .8s var(--easeOutQuart),
  top .8s var(--easeInOutQuart), left .8s var(--easeInOutQuart) }
.styles_item__OXawi .styles_circle_inner__m5zHN { transition: background-color .8s var(--easeOutQuart) }
.styles_line__Ausrd:before { transform: scaleX(0); transform-origin:right;
  transition: transform .4s var(--easeOutQuart) }
.styles_active__i4A4h .styles_line__Ausrd:before { transform: scaleX(1); transform-origin:left;
  transition: transform .4s var(--easeInQuart) var(--delay) }
```
`--real-center-x/--real-center-y` are computed in JS and set with `gsap.set`; `--delay` is
`0.1s * lineIndex`, set from a SplitText `onSplit`.

**GSAP parts:**
```js
// circle parallax while hovering (per signal frame)
setX = gsap.quickSetter(circleInner, "x", "px"); setY = gsap.quickSetter(circleInner, "y", "px")
setX((clientX - circleCenterX) * 0.02); setY((clientY - circleCenterY) * 0.02)

// hover in
tl = gsap.timeline({ defaults: { ease: "power3.inOut", duration: 0.4 } })
labelEl.classList.add("styles_active__i4A4h")
tl.add(linesMotionIn({ duration: 0.8, ease: "power3.out" }), "<")

// hover out
tl = gsap.timeline({ defaults: { ease: "power3.inOut", duration: 0.4 } })
labelEl.classList.remove("styles_active__i4A4h")
tl.add(linesMotionOut({ yPercent: 100, delay: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" }), "-=.25")
```

---

## 14. Quote / Contact "spotlight" section

Module `88806` in `app/(withQuoteContact)/layout-*.js`. Renders below every page, wrapped in a
`ParallaxBox` with `isClip`. Two halves, `quote` and `contact`.

```js
const W = { ease: "power3.out", duration: 0.8 }
const CLOSED = "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)"
const OPEN   = "polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)"
```

**Yellow panel wipe (one-shot on hover):**
```js
gsap.killTweensOf([panel, tween])
if (hovered) {
  gsap.set(wrapper, { pointerEvents: "auto", visibility: "visible" })
  gsap.to(panel, { clipPath: OPEN, ease: "power3.out", duration: 0.8 })
} else {
  gsap.set(wrapper, { pointerEvents: "none" })
  gsap.to(panel, { clipPath: CLOSED, ease: "power3.out", duration: 0.8,
    onComplete: () => gsap.set(wrapper, { visibility: "hidden", clearProps: "clipPath" }) })
}
```
**Background banner cross-fade (one-shot on hover):**
```js
gsap.set(imgBox, { zIndex: hovered ? 1 : 0 })
gsap.to(imgBox, { opacity: hovered ? 1 : 0, ease: "power3.out", duration: 0.8 })
```
**Section dim overlay — pure CSS:** `transition: opacity 0.8s var(--easeOutQuart)`,
`.active { opacity: .6 }` on a full-bleed black box (`zIndex: 6`).

Hit-testing is done in JS against the raw `relX/relY` mouse signals and each label's
`getBoundingClientRect()`, not by CSS `:hover` (the labels have `pointer-events:none` on
desktop).

Related, on the standalone contact overlay (`ContactMenu`, module `73800`), the panel's
clip-path corner tracks the mouse:
```js
const t = clamp(mapRange(clientX, 0.1*vw, 0.9*vw, 15, 85), 20, 85)
el.style.setProperty("clip-path",
  `polygon(90% 0%, 100% 0%, 100% 10%, ${t}% 100%, 0% 100%, 0% ${t}%)`)
```
with the same `--size` circular mask in/out (`1.2 s` / `0.8 s`, `power3.inOut`) and an
`opacity 0→1 duration 0.6 delay 0.2 ease power3.inOut` on the content.

---

## 15. Footer wordmark light

Module `33467`. DOM: `.Footer_footer__OGBct` → `.Footer_footer_wrapper__s1xpb` →
`/upload/home-hero-text.svg` with `.Footer_footer_text__01STx`.

```css
.Footer_footer__OGBct { width:100dvw; background: var(--primary-black); overflow:hidden }
@media (min-width:1200px) { .Footer_footer__OGBct { height:100svh } }
.Footer_footer_text__01STx { object-fit:contain; height:100%; fill: var(--primary-yellow) }
.Footer_footer_text__01STx path { fill: var(--primary-yellow) }
.Footer_footer_text__01STx g { mix-blend-mode: unset !important }
```

The "light" is a very large radial-gradient disc **on top** of the yellow wordmark, opaque
everywhere except a soft hole in the middle:

```jsx
<Box pointerEvents="none" position="absolute" top="50%" left="50%"
     transform="translate(-50%,-50%) scale(1.01)"
     w={{base:"55.82rem", sm:"100%"}} h={{base:"8rem", sm:"10.319rem", md:"26.6rem"}}
     overflow="hidden">
  <Box ref={spot} position="absolute" top="50%" left="50%" zIndex={1} pointerEvents="none"
       w={{base:"475%", sm:"450%", md:"500%"}} h="auto" aspectRatio="1" borderRadius="50%"
       bg="radial-gradient(circle at 50% 50%, transparent 3%, rgba(30, 30, 30, 1) 10%)" />
</Box>
```

```js
gsap.set(spot, { x: "-50%", y: "-50%" })                        // init

// per smoothed-cursor update:
if (!isDesktop) {
  gsap.to(spot, { x: "-50%", y: "-50%", duration: 1.2, ease: "power2.out" })   // park it centred
} else {
  gsap.set(spot, { x: clientX - viewportWidth/2 - spot.offsetWidth/2, y: "-50%" })
}
```
The `gsap.set` looks instantaneous but the input `clientX` is the smoothed signal
(`quickTo duration 0.5, ease "power3"`), so the disc lags the pointer by ~0.5 s of `power3`
easing. **Do not** replace this with a raw `mousemove` — the lag is the effect.

On mobile the footer wordmark is horizontally scrollable and is programmatically scrolled to
`(558.2/5.75) * window.innerWidth/375` px on mount and on image load.

---

## 16. Pure-CSS-only behaviours (do NOT rebuild these in GSAP)

| Behaviour | Selector | Declaration |
|---|---|---|
| Play/pause cursor content | `.Play_*` | `transition: transform/opacity .6s var(--easeOutQuart)` |
| Menu backdrop | `.styles_overlay__SxW5X` | `opacity .8s var(--easeInOutQuart)`, `transition-delay .2s` / `0s` |
| Menu item dimming | `.styles_menus__items_item__eOxOq` | `opacity .6s var(--easeOutQuart)` + `:has()` sibling rule |
| Burger → X | `.styles_toggled_burger__vo7Lk …` | static rotate(±45deg) + repositioning |
| Menu panel shape | `.styles_menus_inner__9X7sY.styles_on_show__wWWIr` | static `clip-path` per breakpoint |
| Image load fade | `.ImagePlaceholder_imagePlaceholder__original__CpPiD` | `opacity .4s var(--easeInOutQuart)` |
| Marquee active colour | `.styles_label__NPZVh` | `color .6s var(--easeOutQuart)` |
| Insight circle growth / underline | `.styles_item__OXawi`, `.styles_line__Ausrd` | `.4s/.8s var(--easeInOutQuart)/var(--easeOutQuart)` |
| Spotlight section dim | inline `&.active` | `opacity 0.8s var(--easeOutQuart)` |
| Mute icon swap | `.VideoControl_icon__uOYML` | `transform .3s var(--easeInOutQuart)` |
| Contact menu link underline | `.ContactMenu_contactMenuItem__fp__K .line:after` | `transform 1.2s var(--easeOutQuart)`, `transition-delay: calc(var(--line-index) * .1s)` |
| Pinned service card shrink/rotate | inline `--progress` | `transform`/`border-radius` read `--progress`; only the variable is scrubbed |
| Three-dot "wave" loader | `.styles_waveDot__SGzcN` | `@keyframes styles_wave__0LOc1 1.5s ease-in-out infinite`, `.1s`/`.2s` stagger |
| Rich-text link underline | `.description_layout a:hover:after` | `@keyframes link-underline-hover 1s linear` |
| Accordion (produced locations) | inline | `transition: all 0.6s var(--easeOutQuart)`, plus `background/opacity/transform 1.2s var(--easeOutQuart)` on the dot |

---

## 17. What will be hard, expensive, or impossible to reproduce faithfully

Ranked by risk. Be straight with the client about these.

### 17.1 The WebGL hero reel — **the big one**

Reproducing it faithfully means shipping three.js + @react-three/fiber + @react-three/drei
(~600 KB gzip of the original's ~1.2 MB of `three-*.js` chunks), the two custom shaders, the
video-texture aspect-fit maths, the per-frame lerped mouse-look, and the pointer state machine
(play/pause/unmute/auto-hide/`lenis.scrollTo`). That is genuinely a multi-day job on its own
and it roughly doubles the JS payload of the new site.

Honest options:
- **Port it** — everything needed is quoted above; the shaders are verbatim in
  `chunks/320.127f79f47e8ad8bc.js`. Nothing is secret, it is just a lot of surface area.
- **Approximate it with DOM + CSS** — a `<video>` in a wrapper whose `width/height/border-radius/
  rotateX/rotateY` are scrubbed by the same ScrollTrigger. You lose: the simplex-noise vertex
  wobble (`uDistort`, and note `initialDistort: 0` so it is *already off* in this build), and the
  precise SDF corner rounding. Visually this lands at maybe 90 % — genuinely close, because the
  distortion uniform is zero in production.
- I would recommend the DOM approximation and would tell the client that, because
  `initialDistort` is `0`, the shader is doing almost nothing a CSS-transformed video cannot do.

### 17.2 `mask-image` + tweened `--size` custom property (page transition, menu, contact)

The circular reveal animates a CSS custom property that a `mask-position`/`mask-size` `calc()`
reads. This is **not** compositable — every frame re-rasterises a full-viewport mask. It is
janky on mid-range Windows laptops and on Safari, which is exactly why the original adds
`isMasking` only for the duration of the tween. Reproducible, but expect to spend time on
performance, and expect it to look worse than in the reference video on weaker hardware.
`CSS.registerProperty` for `--size` (type `<length>`) would help and is a safe improvement.

### 17.3 SplitText line re-splitting

Every text reveal depends on `SplitText(..., { type:"lines", mask:"lines" })` **after**
`document.fonts.ready`. If a font swaps late, or a container reflows, the lines are wrong and
the reveal breaks visibly. The original guards this with `await document.fonts.ready`, an
explicit `.revert()` on every dependency change, and a `ResizeObserver` → debounced
`ScrollTrigger.refresh()`. Replicate all three or you will get intermittent broken reveals that
are very hard to reproduce on demand. Also note `mask:"lines"` is a 3.13-only feature — do not
downgrade GSAP.

### 17.4 The page-transition polygon derivation

The leave wipe reads the **computed** `clip-path` off a live DOM node (`.js-header-menus` or
`.js-section-contact`), string-replaces percentages, and tweens between two polygons that must
have identical point counts. This is fragile by construction. In the Vite/React-Router port
there is no Next.js router interception, so you also have to build the "hold navigation until
the wipe finishes, then push" plumbing yourself (the original calls `routerPush` from the
tween's `onComplete`). Budget real time for this; it is the piece most likely to produce
half-navigated states.

### 17.5 The `pagePlay / pageEnter / pageLeave` state machine

Not hard, but *everything* keys off it. If you don't port `EffectProvider` + the six lifecycle
hooks first, the reveals will fire at the wrong time (or twice) and the loader will never
release. Port this before any individual animation.

### 17.6 Preact signals

The original uses `@preact/signals-react` (`useSignal`/`useComputed`/`useSignalEffect`) as the
glue for cursor position, scroll progress, and slider state, and relies on the fact that a
signal effect runs *outside* React's render cycle. Replacing these with React state will
re-render on every mouse move and destroy the frame rate. Either add
`@preact/signals-react` to `package.json`, or replace them with plain mutable refs + a
`gsap.ticker` callback. Do **not** use `useState`.

### 17.7 Chakra UI responsive props

The entire original is authored in Chakra (`fontSize={{base, sm, md}}`, `Box`, `Flex`, `Grid`),
which is why the SSR DOM is full of `css-xxxxx` emotion classes. Those breakpoint objects are
not animation, but they are a large silent chunk of the port. Either bring Chakra along, or
budget for translating a few hundred responsive prop objects into CSS. The `html { font-size:
Xvw }` trick means every `rem` is already fluid, which helps.

### 17.8 Small honest caveats

- The gooey hero filter is **disabled on Safari** in the original (`eB()` UA test) — Safari
  users see two hard-edged purple shards. Match that or Safari will look wrong differently.
- `Math.PI` used as a degrees value in the hero beam rotation (§4c) is almost certainly a bug
  in the original (someone meant radians→degrees). Reproducing it exactly means the beam barely
  rotates with the mouse. Copy the bug; "fixing" it changes the design.
- The `min`/`max` props on `ParallaxBox` are inverted (`min` clamps the maximum). Copy the
  behaviour, not the names.
- The loader text (`"PO: NN%"`) is written to a ref that is never attached in this build. There
  is no visible counter. Don't add one unless the client asks.
- `pinSpacing: false` on both pinned sections means the surrounding layout heights
  (`200vh` spacers, `mt: -100svh`) are load-bearing. Get the heights right first, then pin.

---

## 18. Suggested port order

1. `EffectProvider` + lifecycle hooks + `AssetsProvider` (§0).
2. Lenis wired to `gsap.ticker`, `ScrollTrigger.refresh()` on resize (§0).
3. Page loader (§1) — proves the state machine works.
4. `<Lines>` + the `85665` reveal trigger (§4a/§4b) — unlocks ~70 % of the page.
5. `ParallaxBox` (§6), `ImagePlaceholder` (§7.3), roll-up text (§7.2), icon buttons (§7.4).
6. Header + menu (§3).
7. Hero: text, goo beam (§4c), then reel — DOM approximation first (§10).
8. Sticky prominent block + slider (§11), pinned service cards (§8), marquee (§9),
   achievements (§12).
9. Insights (§13), quote/contact spotlight (§14), footer light (§15).
10. Page transition (§2) last — it needs every other page to exist.
