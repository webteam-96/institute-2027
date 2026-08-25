import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const { clamp, mapRange, toArray } = gsap.utils

/**
 * The homepage's motion, ported from the capture.
 *
 * The captured build shipped its animation as minified chunks, so this is not
 * that code — it is the same behaviours rebuilt on the same libraries the
 * original used (GSAP with ScrollTrigger and SplitText, Lenis for the scroller),
 * following docs/animation-spec.md, which was recovered from those chunks. The
 * markup and the CSS come across unchanged.
 *
 * Section numbers in the comments refer to that spec.
 *
 * Everything is scoped to the returned ref and reverted on unmount, so moving
 * between routes cannot leave a tween running on a detached node.
 */
export default function useHomeMotion() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    // --- the scroller (spec 0) --------------------------------------------
    // The original constructs Lenis with exactly one option — everything else
    // is library default (lerp 0.1, smoothWheel true, wheelMultiplier 1) — and
    // drives its RAF off the GSAP ticker rather than its own, so scroll and
    // tweens share one clock. It does not subscribe ScrollTrigger to lenis
    // scroll events; ScrollTrigger picks the movement up from the window.
    let lenis = null
    let raf = null
    if (!reduced()) {
      lenis = new Lenis({ autoRaf: false })
      window.lenis = lenis
      raf = (time) => lenis.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }

    const cleanups = []
    const splits = []
    let cancelled = false

    const ctx = gsap.context(() => {
      if (reduced()) return

      // --- the loader curtain (spec 1) ------------------------------------
      // A plain colour curtain: the build writes "PO: NN%" into a ref that is
      // never attached, so no counter is rendered. It fades the moment the
      // asset counter reaches 100, and `pagePlay()` — everything with a delay
      // below — is released on the same frame.
      const curtain = document.createElement('div')
      curtain.className = 'PageLoader_pageLoader___1cgC'
      document.body.appendChild(curtain)
      cleanups.push(() => curtain.remove())

      // --- the stage light (spec 4c) --------------------------------------
      // Two clip-path shards under the #goo blur filter. The group starts at
      // -145deg and swings to 40deg while the box scales up and its two custom
      // properties open the lower shard right out past the edge of the frame.
      //
      // Three nested elements, three different jobs, and they are easy to mix
      // up: the <figure> carries the pointer drift, the box inside it carries
      // the scale and the two shard variables, and the rotation belongs to the
      // box's own child. Rotating the figure instead — which is what this did
      // at first — writes an inline transform over the drift and kills it.
      const figure = el.querySelector('[class*="styles_clipPath_wrapper_figure"]')
      const box = figure && figure.firstElementChild
      const rotor = box && box.firstElementChild
      if (figure && box && rotor) {
        gsap.set(rotor, { rotate: -145 })
        gsap.set(box, { scale: 0 })

        // The pointer is smoothed before it reaches anything (spec 5a) — that
        // easing is where the lag in the original comes from. `Math.PI` is used
        // as a degree value; that is what the original does, and copying the
        // behaviour is the point of a port.
        const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        const px = gsap.quickTo(pointer, 'x', { duration: 0.5, ease: 'power3' })
        const py = gsap.quickTo(pointer, 'y', { duration: 0.5, ease: 'power3' })
        const onMove = (e) => {
          px(e.clientX)
          py(e.clientY)
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        cleanups.push(() => window.removeEventListener('pointermove', onMove))

        // Written straight to the style attribute, per frame, and only while
        // the hero is on screen.
        let heroVisible = true
        const drift = () => {
          if (!heroVisible) return
          const cx = window.innerWidth / 2
          const cy = window.innerHeight / 2
          const dx = pointer.x - cx
          figure.style.transform = `translate(${0.02 * dx}px, ${
            0.02 * (pointer.y - cy)
          }px) rotate(${(dx / cx) * Math.PI}deg)`
        }
        gsap.ticker.add(drift)
        cleanups.push(() => gsap.ticker.remove(drift))
        const heroIo = new IntersectionObserver(([entry]) => {
          heroVisible = entry.isIntersecting
        })
        heroIo.observe(figure)
        cleanups.push(() => heroIo.disconnect())
      }

      // --- the hero reel (spec 10a) ---------------------------------------
      // The original draws this as a WebGL plane, but its distortion uniform is
      // 0 in production, so a plain <video> reproduces what is actually on
      // screen. Only the *canvas* is a fixed layer — the layout comes from a
      // 200svh section with a sticky, 100svh child, and the control bar sits
      // inside that child. So the stand-in belongs in the sticky child too:
      // parented anywhere else it either scrolls away with the wordmark or
      // hangs over the sections below.
      // The reel does its own easing off the raw pointer rather than the
      // smoothed one the beam reads (spec 10b), so it gets its own tracker.
      const raw = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const onRaw = (e) => {
        raw.x = e.clientX
        raw.y = e.clientY
      }
      window.addEventListener('pointermove', onRaw, { passive: true })
      cleanups.push(() => window.removeEventListener('pointermove', onRaw))

      const reelLabel = toArray(el.querySelectorAll('p')).find((p) =>
        /venue film/i.test(p.textContent)
      )
      let sticky = reelLabel ? reelLabel.parentElement : null
      while (sticky && sticky !== el && getComputedStyle(sticky).position !== 'sticky') {
        sticky = sticky.parentElement
      }
      const reelSection = sticky && sticky !== el ? sticky.parentElement : null

      // The bar holding the label and the mute control is the absolutely
      // positioned block between the two.
      let reelBar = reelLabel ? reelLabel.parentElement : null
      while (reelBar && reelBar !== sticky && getComputedStyle(reelBar).position !== 'absolute') {
        reelBar = reelBar.parentElement
      }
      if (reelBar === sticky) reelBar = null

      let reel = null
      if (sticky && reelSection && !document.querySelector('.reel-card')) {
        const card = document.createElement('div')
        card.className = 'reel-card'
        const video = document.createElement('video')
        video.src = '/media/venue-film.mp4'
        video.poster = '/media/venue-film-poster.jpg'
        video.muted = true
        video.loop = true
        video.playsInline = true
        video.preload = 'metadata'
        card.appendChild(video)
        sticky.insertBefore(card, sticky.firstChild)
        cleanups.push(() => card.remove())

        const k = Math.max(window.innerWidth / 1920, 0.42)
        // Centring lives in the tween, not the stylesheet: GSAP writes its own
        // transform and would otherwise wipe a CSS translate.
        gsap.set(card, {
          width: 569 * k,
          height: 381 * k,
          xPercent: -50,
          yPercent: -50,
          rotate: -1.2,
          scale: 0,
        })
        // No need to hide the bar — the stylesheet already ships it hidden.
        reel = { card, video, section: reelSection, bar: reelBar, w0: 569 * k, h0: 381 * k, progress: 0 }

        // --- the plane looks at the pointer (spec 10b) --------------------
        // In the capture this is a WebGL mesh whose rotation eases toward the
        // cursor and flattens as the reel grows. Same shape here on a DOM card:
        // a perspective matching the r3f camera (fov 40 at z 9), the same 0.35
        // clamp and the same 0.1-per-frame lerp.
        //
        // The amplitude is not the spec's 0.3 but 0.63, measured off the live
        // site: with 0.3 the card's top edge swings 21px between opposite
        // corners of the screen where iventions.com swings 36px. The resting
        // shape already matched (keystone 1.028/1.069 against 1.027/1.080) —
        // it was only the travel that was short.
        const look = { x: 0, y: 0 }
        const LOOK = 0.63
        const DEG = 180 / Math.PI
        gsap.set(card, { transformPerspective: window.innerHeight / (2 * Math.tan((40 * Math.PI) / 360)) })
        const lookAt = () => {
          const ndcX = (raw.x / window.innerWidth) * 2 - 1
          const ndcY = -((raw.y / window.innerHeight) * 2 - 1)
          look.x += (-clamp(-0.35, 0.35, ndcY) * LOOK - look.x) * 0.1
          look.y += (clamp(-0.35, 0.35, ndcX) * LOOK - look.y) * 0.1
          const flat = 1 - reel.progress
          gsap.set(card, {
            // Negated: three.js is right-handed and a positive rotation.x tips
            // the top toward the camera, where a positive CSS rotateX tips it
            // away. Without the flip the card keystones the wrong way — top
            // edge wider than the bottom, where the original is the reverse.
            rotationX: -(look.x - mapRange(0, 1, 0.3, 0, reel.progress)) * flat * DEG,
            rotationY: (look.y - mapRange(0, 1, 0.1, 0, reel.progress)) * flat * DEG,
          })
        }
        gsap.ticker.add(lookAt)
        cleanups.push(() => gsap.ticker.remove(lookAt))
      } else {
        // Below 75rem there is no WebGL reel in the capture at all — it drops a
        // plain looping clip into the slot the hero markup already reserves,
        // `.css-1kqiocr`, which the stylesheet hides again at 1200px. The walk
        // above only finds a sticky ancestor on desktop, so without this the
        // slot stayed empty and the hero showed a bare band of beam where the
        // film belongs. Sized entirely by the existing rule (16:9, clipped
        // corners) — nothing here moves the layout.
        const slot = el.querySelector('.css-1kqiocr')
        if (slot && !slot.firstElementChild) {
          const video = document.createElement('video')
          video.className = 'hero-film'
          video.src = '/media/venue-film.mp4'
          video.poster = '/media/venue-film-poster.jpg'
          video.muted = true
          video.loop = true
          video.playsInline = true
          video.preload = 'metadata'
          slot.appendChild(video)
          cleanups.push(() => video.remove())
        }
      }

      // --- line-mask text reveal (spec 4a) --------------------------------
      // The workhorse of the whole page: `<Lines>` splits a text element into
      // lines and masks them. Its wrapper is sometimes an unclassed div and
      // sometimes a classed one, so the wrapper is no use as a marker — but the
      // thing it splits always is. In the capture the targets are the *deepest*
      // text elements: an <h1> whose text sits in child spans contributes the
      // spans, not itself.
      //
      // The roll-up label component (spec 7.2) is a different mechanism that
      // renders .text / .text__clone pairs; the capture never line-splits those,
      // so they are excluded rather than double-animated.
      const TEXT = 'h1,h2,h3,h4,h5,h6,p,span,div'
      // "Deepest" alone is not the rule: an element that mixes its own text
      // with a child element — <h3><span>The venue</span>ATI ONGC: …</h3> — is
      // one target in the capture, and skipping it left that copy unanimated.
      // So a candidate is any element carrying text of its own, and the
      // outermost candidate wins so the two never nest.
      const ownText = (node) =>
        toArray(node.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim())
      const candidates = toArray(el.querySelectorAll(TEXT)).filter(
        (node) =>
          node.textContent.trim() &&
          (ownText(node) || !node.querySelector(TEXT)) &&
          !node.closest('.text') &&
          !node.closest('.text__clone') &&
          !node.closest('[class*="VideoControl"]') &&
          // The venue headline is not revealed, it is knocked out of a yellow
          // panel (spec 11a). Its DOM copy is a measuring aid, split below for
          // its line strings — splitting it twice would nest the wrappers.
          !node.closest('.css-130dp97') &&
          // Slides the stylesheet keeps hidden (the venue slider shows one at a
          // time) must stay hidden. Revealing them stacks every caption in the
          // same spot.
          getComputedStyle(node).visibility !== 'hidden' &&
          // The capture ships a mobile and a desktop copy of several blocks and
          // lets a media query drop one. Splitting the dropped copy would
          // animate text nobody can see — and would double the line count.
          node.getClientRects().length > 0
      )
      const lineTargets = candidates.filter(
        (node) => !candidates.some((other) => other !== node && other.contains(node))
      )
      // Hide up front: the reveal cannot run until the fonts have settled, and
      // unhidden text would flash in place first. Nothing here may touch the
      // class attribute — `will-change` goes on at split time instead.
      lineTargets.forEach((node) => gsap.set(node, { visibility: 'hidden' }))

      // --- pinned service cards (spec 8) ----------------------------------
      // Desktop only. Each card pins at centre, then a mapped slice of its own
      // progress drives a CSS variable; the shrink, the rotate and the corner
      // radius are all done in the stylesheet off that one number.
      if (window.matchMedia('(min-width:1200px)').matches) {
        // Custom properties inherit, so "has --is-odd" is true of every node
        // inside a card, the images included. The card is the one node whose
        // value differs from its parent's — i.e. the node that declares it.
        const declares = (n) =>
          n.parentElement &&
          getComputedStyle(n).getPropertyValue('--is-odd').trim() !==
            getComputedStyle(n.parentElement).getPropertyValue('--is-odd').trim()

        const cards = []
        el.querySelectorAll('.js-service-image').forEach((img) => {
          let n = img
          while (n && n !== el && !declares(n)) n = n.parentElement
          if (n && n !== el && !cards.includes(n)) cards.push(n)
        })

        cards.forEach((card, i) => {
          const isLast = i === cards.length - 1
          const img = card.querySelector('.js-service-image')

          // Measured, not assumed: the radius the card rounds to is twice the
          // image's own, read back off the stylesheet on load and on resize.
          const setRadius = () => {
            const r = img ? parseFloat(getComputedStyle(img).borderRadius) || 0 : 0
            card.style.setProperty('--image-border-radius', 2 * r + 'px')
          }
          setRadius()
          window.addEventListener('resize', setRadius)
          cleanups.push(() => window.removeEventListener('resize', setRadius))

          ScrollTrigger.create({
            trigger: card,
            start: 'center center',
            end: isLast ? 'bottom bottom' : 'bottom top-=50%',
            pin: true,
            pinSpacing: false,
            onUpdate: (self) => {
              // The last card never shrinks — it is the one left on screen.
              if (isLast) return
              // The first quarter of the pin does nothing; the rest drives 0->1.
              card.style.setProperty(
                '--progress',
                String(clamp(0, 1, mapRange(0.25, 1, 0, 1, self.progress)))
              )
            },
          })

          if (img) {
            gsap.fromTo(
              img,
              { scale: 1.4 },
              {
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: card,
                  start: 'top bottom',
                  end: 'top top',
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              }
            )
          }
        })
      }

      // --- venue panel + slider (spec 11a, 11b, 11d) ------------------------
      // A 200vh section holding a sticky 100vh grid cell with two children in
      // the same cell: the yellow panel on top (z-index 5) and the venue slider
      // under it. Scrolling slides the panel straight up off the screen while
      // the slider rises into place behind it.
      //
      // Under 75rem the stylesheet does all of this on its own — the sticky
      // becomes a plain 200vh block, the panel a solid yellow card and the
      // headline is painted with background-clip:text — so none of it runs
      // there, and the guards below put things back if the window crosses over.
      const panel = el.querySelector('.css-edj2ce')
      const panelSection = panel && panel.closest('.css-wyoub9')
      const knockoutSrc = panel && panel.querySelector('.css-dru4ek')
      const sliderContent = panelSection && panelSection.querySelector('.styles_content__T0TRn')
      const sliderRail = panelSection && panelSection.querySelector('.css-16jj2xp')
      const wide = () => window.matchMedia('(min-width:75rem)').matches

      // The slide's own copy does not reveal on scroll like the rest of the
      // page. In the capture the slider only starts playing once the panel is
      // half gone, so until then its text is still waiting to be played in —
      // which is why nothing shows through the knockout but the photograph.
      const sliderReveals = []
      let sliderRevealed = false
      const revealSlider = () => {
        if (sliderRevealed) return
        sliderRevealed = true
        sliderReveals.forEach((fn) => fn())
      }

      // The panel is one yellow rectangle masked by the headline, so what shows
      // through the letters is the slider itself. The mask has to break its
      // lines exactly where the DOM copy does, which is why that copy stays in
      // the markup at opacity 0: it is split here for its line strings and its
      // measured metrics rather than either being hard-coded.
      let knockoutSplit = null
      let railShown = false
      let cursorMode = null
      // Filled in once the slider below is wired up; the panel drives them.
      let startSlider = () => {}
      let stopSlider = () => {}
      const raiseCursor = (type) =>
        window.dispatchEvent(new CustomEvent('rotary:cursor', { detail: type }))
      const lowerCursor = () => raiseCursor('default')
      cleanups.push(lowerCursor)
      const buildKnockout = () => {
        if (!panel || !knockoutSrc) return
        panel.querySelectorAll('.knockout-svg').forEach((n) => n.remove())
        if (knockoutSplit) {
          knockoutSplit.revert()
          knockoutSplit = null
        }
        railShown = false
        if (sliderRail) {
          gsap.set(
            sliderRail,
            wide()
              ? { yPercent: -50, scaleX: 0, transformOrigin: 'left center' }
              : { clearProps: 'all' }
          )
        }
        if (!wide()) return

        knockoutSplit = new SplitText(knockoutSrc, { type: 'lines', aria: 'none' })
        const cs = getComputedStyle(knockoutSrc)
        const size = parseFloat(cs.fontSize)
        const step = parseFloat(cs.lineHeight) || size
        const w = window.innerWidth
        const h = window.innerHeight
        const lines = knockoutSplit.lines.map((l) =>
          l.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        )
        // Centred as a block, then laid out downwards from there.
        const first = h / 2 - ((lines.length - 1) / 2) * step
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('class', 'knockout-svg')
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
        svg.innerHTML =
          '<defs><mask id="knockout-text-mask" x="0" y="0" width="100%" height="100%">' +
          '<rect width="100%" height="100%" fill="white"></rect>' +
          '<text>' +
          lines.map((t, i) => `<tspan x="50%" y="${first + i * step}">${t}</tspan>`).join('') +
          '</text></mask></defs>' +
          '<rect width="100%" height="100%" fill="var(--primary-yellow)" mask="url(#knockout-text-mask)"></rect>'
        // Set through the DOM, not a style attribute: the font stack carries
        // quotes of its own and would close the attribute early.
        const text = svg.querySelector('text')
        text.style.fontFamily = cs.fontFamily
        text.style.fontSize = size + 'px'
        text.style.fontWeight = cs.fontWeight
        text.style.letterSpacing = cs.letterSpacing
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('dominant-baseline', 'middle')
        panel.insertBefore(svg, panel.firstChild)
      }

      if (panel && panelSection && knockoutSrc) {
        // Both the viewBox and the line breaks are width-dependent.
        const onResize = () => {
          buildKnockout()
          ScrollTrigger.refresh()
        }
        window.addEventListener('resize', onResize)
        cleanups.push(() => {
          window.removeEventListener('resize', onResize)
          panel.querySelectorAll('.knockout-svg').forEach((n) => n.remove())
          if (knockoutSplit) knockoutSplit.revert()
        })

        // 11a — the panel is gone by 85% of the section.
        const setPanelY = gsap.quickSetter(panel, 'y', '%')
        ScrollTrigger.create({
          trigger: panelSection,
          start: 'top top',
          end: 'bottom-=15% bottom',
          onUpdate: (self) => {
            if (!wide()) {
              setPanelY(0)
              return
            }
            setPanelY(-100 * self.progress)
            if (self.progress > 0.5) revealSlider()

            // Raised here rather than below the rail's guard: that guard flips
            // once at 0.5 and never fires again, so the call could never see
            // progress 1 and the yellow Next/Previous disc was unreachable.
            // Latched so a scroll does not dispatch an event every frame.
            const wantCursor = self.progress >= 1 ? 'slide-control' : 'default'
            if (wantCursor !== cursorMode) {
              cursorMode = wantCursor
              raiseCursor(wantCursor)
            }

            // 11d — the slider's progress rail wipes in from the left once the
            // panel is half gone, and back out to the right on the way up.
            if (!sliderRail || self.progress > 0.5 === railShown) return
            railShown = self.progress > 0.5
            // The slider only runs while it is the thing on screen.
            railShown ? startSlider() : stopSlider()
            gsap.set(sliderRail, {
              transformOrigin: railShown ? 'left center' : 'right center',
              ...(railShown ? { scaleX: 0 } : null),
            })
            gsap.to(sliderRail, { scaleX: railShown ? 1 : 0, duration: 1, ease: 'power3.out' })
          },
        })

        // The panel trigger stops updating at 85% of the section, but the
        // slider stays on screen until the section has fully left — so the
        // cursor is lowered on its own, wider window.
        ScrollTrigger.create({
          trigger: panelSection,
          start: 'top top',
          end: 'bottom top',
          onLeave: lowerCursor,
          onLeaveBack: lowerCursor,
        })

        // --- the slider itself (spec 11c, 11d) ------------------------------
        // Five slides stacked in one cell, one visible at a time. A change is a
        // clip-path wipe across eight points on the incoming slide, and the one
        // being left behind is not hidden until that wipe has covered it.
        const slidesWrap = panelSection.querySelector('.css-v905pd')
        const slides = slidesWrap ? toArray(slidesWrap.children) : []
        const railFill = sliderRail && sliderRail.firstElementChild

        if (slides.length > 1) {
          const REST =
            'polygon(100% 50%, 100% 50%, -10% 50%, -10% 50%, -10% 50%, -10% 50%, 100% 50%, 100% 50%)'
          const REST_BACK =
            'polygon(110% 50%, 110% 50%, 0% 50%, 0% 50%, 0% 50%, 0% 50%, 110% 50%, 110% 50%)'
          const FORWARD = [
            'polygon(100% 0%, 100% 0%, -10% 50%, -10% 50%, -10% 50%, -10% 50%, 100% 100%, 100% 100%)',
            'polygon(100% 0%, -10% 0%, -10% 50%, -10% 50%, -10% 50%, -10% 50%, -10% 100%, 100% 100%)',
          ]
          const BACKWARD = [
            'polygon(110% 50%, 110% 50%, 0% 0%, 0% 0%, 0% 100%, 0% 100%, 110% 50%, 110% 50%)',
            'polygon(110% 50%, 110% 50%, 110% 0%, 0% 0%, 0% 100%, 110% 100%, 110% 50%, 110% 50%)',
          ]
          const dimmerOf = (slide) => slide.querySelector('.css-k8vowv')
          // The caption block — the eyebrow, the headline, the note and the CTA.
          // It is the slide's own child, so the wipe's clip-path cuts straight
          // through it: the polygon opens from a hairline at 50% height and the
          // headline sits at roughly 52-64% of the slide, which is why it comes
          // in sliced across the middle for about half a second on every change.
          const captionOf = (slide) => slide.querySelector('.css-1ot8zsz')

          let current = 0
          let layer = 1
          let lastChange = -Infinity

          const go = (next) => {
            const count = slides.length
            const target = ((next % count) + count) % count
            if (target === current) return
            const back = target < current
            const from = slides[current]
            const to = slides[target]

            // Out: the old slide holds its place until the wipe has covered it,
            // and its dimmer deepens on the way. Its caption leaves first, so no
            // two headlines are ever legible at once.
            const fromCap = captionOf(from)
            if (fromCap) gsap.to(fromCap, { opacity: 0, duration: 0.35, ease: 'power2.out' })
            gsap.set(from, { visibility: 'hidden', delay: 1.6, clearProps: 'clipPath' })
            const fromDim = dimmerOf(from)
            if (fromDim) gsap.to(fromDim, { opacity: 0.7, duration: 2.4, ease: 'power3.out' })

            // In.
            const seq = back ? BACKWARD : FORWARD
            gsap.killTweensOf([to, dimmerOf(to)])
            gsap.set(to, {
              visibility: 'visible',
              clipPath: back ? REST_BACK : REST,
              zIndex: ++layer,
            })
            const toDim = dimmerOf(to)
            if (toDim) gsap.set(toDim, { opacity: 0.32 })
            // The picture keeps the theme's wipe; the caption sits it out and
            // fades up once the clip has finished opening, so it is never shown
            // bisected. Killed first, or a fast double-change leaves it at a
            // half-finished opacity.
            const toCap = captionOf(to)
            if (toCap) {
              gsap.killTweensOf(toCap)
              gsap.set(toCap, { opacity: 0 })
            }
            const tl = gsap.timeline({ defaults: { ease: 'none', duration: 0.8 } })
            seq.forEach((poly, i) =>
              tl.to(to, { clipPath: poly, ease: i === seq.length - 1 ? 'power3.out' : 'power3.in' })
            )
            if (toCap) tl.to(toCap, { opacity: 1, duration: 0.5, ease: 'power2.out' })
            current = target
          }

          // 11d — a ten-second cycle, which also fills the progress rail: each
          // slide owns one segment of it.
          const autoplay = gsap.to(
            {},
            {
              duration: 10,
              repeat: -1,
              ease: 'none',
              paused: true,
              onRepeat: () => go(current + 1),
              onUpdate: function fill() {
                if (!railFill) return
                gsap.set(railFill, {
                  scaleX: (current + this.progress()) / slides.length,
                  transformOrigin: 'left center',
                })
              },
            }
          )
          if (railFill) gsap.set(railFill, { scaleX: 0, transformOrigin: 'left center' })
          startSlider = () => autoplay.play()
          stopSlider = () => autoplay.pause()
          cleanups.push(() => autoplay.kill())

          // Clicking the slide steps forward or back depending on which half of
          // the screen the click lands in, throttled so a double click cannot
          // skip two.
          const onClick = (e) => {
            if (e.timeStamp - lastChange < 500) return
            lastChange = e.timeStamp
            // Both arrows sit in the same corner, so the half-screen rule sent
            // them both forward and the back arrow did the opposite of what it
            // depicts. When the click lands on an arrow, the arrow decides.
            const arrow = e.target.closest('[class*="ProjectSliderActions_icon"]')
            const back = arrow
              ? !!arrow.querySelector('img[src*="arrow-left"]')
              : e.clientX < window.innerWidth / 2
            go(current + (back ? -1 : 1))
            autoplay.restart(true)
          }
          if (sliderContent) {
            sliderContent.addEventListener('click', onClick)
            cleanups.push(() => sliderContent.removeEventListener('click', onClick))
          }
        }

        // 11b — the slider climbs one viewport height, arriving exactly as the
        // section reaches the top of the screen and the panel starts to leave.
        if (sliderContent) {
          const setContentY = gsap.quickSetter(sliderContent, 'y', 'px')
          ScrollTrigger.create({
            trigger: panelSection,
            start: 'top bottom',
            end: 'top top',
            onUpdate: (self) =>
              setContentY(wide() ? -window.innerHeight * (1 - self.progress) : 0),
          })
        }
      }

      // --- video ------------------------------------------------------------
      // Only decode while the clip is actually on screen.
      el.querySelectorAll('video').forEach((video) => {
        video.muted = true
        video.playsInline = true
        const io = new IntersectionObserver(
          ([entry]) => {
            // Only decode while it is on screen — but never override a pause
            // the reader asked for: scrolling past and back used to restart a
            // film they had deliberately stopped.
            if (!entry.isIntersecting) video.pause()
            else if (!video.dataset.userPaused) video.play().catch(() => {})
          },
          { threshold: 0.2 }
        )
        io.observe(video)
        video.__io = io
      })

      // --- pagePlay (spec 0, 1) --------------------------------------------
      // Everything with a delay is timed from this instant, because in the
      // original `pagePlay()` is called on the frame the curtain starts to
      // fade. Splitting has to wait for the webfonts too, or the lines get
      // measured against the fallback face and re-wrap when it swaps in.
      let played = false
      const play = () => {
        if (played || cancelled) return
        played = true

        gsap.to(curtain, {
          opacity: 0,
          duration: 0.15,
          ease: 'power3.inOut',
          pointerEvents: 'none',
          onComplete: () => curtain.remove(),
        })

        lineTargets.forEach((node) => {
          node.classList.add('will-change-transform')
          cleanups.push(() => node.classList.remove('will-change-transform'))
          const split = new SplitText(node, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'line fix-clip',
            aria: 'none',
            onSplit: (s) =>
              s.lines.forEach((line, i) => {
                if (line.textContent === '') line.innerHTML = '&nbsp;'
                line.style.setProperty('--line-index', String(i))
              }),
          })
          splits.push(split)
          gsap.set(split.lines, { yPercent: 150 })

          const reveal = (delay) =>
            gsap.to(split.lines, {
              yPercent: 0,
              duration: 1.2,
              stagger: 0.1,
              ease: 'power3.out',
              delay,
              // clearProps, not visibility:'visible' — an inline value would
              // outrank the stylesheet and un-hide inactive slides. Removing the
              // inline hide hands the decision back to the cascade.
              onStart: () => gsap.set(node, { clearProps: 'visibility' }),
            })

          const rect = node.getBoundingClientRect()
          if (sliderContent && wide() && sliderContent.contains(node)) {
            // Held back for the panel (spec 11a/11d) rather than revealed on
            // its own trigger.
            if (sliderRevealed) reveal(0)
            else sliderReveals.push(() => reveal(0))
          } else if (rect.top < window.innerHeight) {
            // On screen at load: the hero pair carry their own entrance delays,
            // and the trigger adds a flat 0.3 s on top of them.
            const enter = node.closest('h1') ? 1.2 : node.closest('h2') ? 1.6 : 0
            const atTop = Math.abs(window.scrollY) < 10 && rect.top >= 0
            reveal(atTop ? enter + 0.3 : 0)
          } else {
            // Below the fold: one-shot, once the element's top has travelled
            // ~30% of its own height past the viewport bottom.
            const threshold = clamp(
              0,
              30,
              mapRange(0, 100, 30, 0, rect.height / window.innerHeight)
            )
            ScrollTrigger.create({
              trigger: node,
              start: `top+=${threshold}% bottom`,
              once: true,
              onEnter: () => reveal(0),
            })
          }
        })

        // --- call-to-action buttons (spec 7) --------------------------------
        // The stylesheet ships these at opacity 0 and the capture holds them at
        // translate(0%, 50%) until their section arrives, then drops them in.
        // Nothing else un-hides them, so without this they never appear at all.
        toArray(el.querySelectorAll('a,button'))
          .filter((btn) => getComputedStyle(btn).opacity === '0')
          .forEach((btn) => {
            gsap.set(btn, { yPercent: 50 })
            const show = () =>
              gsap.to(btn, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'power3.out' })
            if (sliderContent && wide() && sliderContent.contains(btn)) {
              if (sliderRevealed) show()
              else sliderReveals.push(show)
            } else {
              ScrollTrigger.create({ trigger: btn, start: 'top bottom', once: true, onEnter: show })
            }
          })

        // --- icon buttons (spec 7.4) ----------------------------------------
        // The round arrow buttons ship at scale 0 and pop in with their
        // section. The mute glyph inside the reel's control is pure CSS off a
        // class naming which state to show.
        toArray(el.querySelectorAll('[class*="iconWrapper"],[class*="_icon__"]'))
          .filter((n) => {
            // Some are held down by the `scale` property and some by a zeroed
            // `transform`; either way they never come back on their own.
            if (/VideoControl_icon__/.test(n.getAttribute('class') || '')) return false
            const c = getComputedStyle(n)
            return parseFloat(c.scale) === 0 || /matrix\(0,\s*0,\s*0,\s*0/.test(c.transform)
          })
          .forEach((icon) => {
            // Setting it through GSAP first hands the scale to `transform`,
            // where the tween can actually beat the stylesheet.
            gsap.set(icon, { scale: 0 })
            ScrollTrigger.create({
              trigger: icon,
              start: 'top bottom',
              once: true,
              onEnter: () => gsap.to(icon, { scale: 1, duration: 1.2, ease: 'power3.out' }),
            })
          })
        el.querySelectorAll('[class*="VideoControl_iconWrapper"]').forEach((wrap) => {
          const showState = () => {
            const muted = !reel || reel.video.muted
            wrap.classList.toggle('VideoControl_show__mute__tM5Lg', muted)
            wrap.classList.toggle('VideoControl_show__unmute__3HDfF', !muted)
          }
          showState()
          const button = wrap.querySelector('button') || wrap
          const onMute = (e) => {
            e.stopPropagation()
            if (!reel) return
            reel.video.muted = !reel.video.muted
            if (!reel.video.muted) reel.video.play().catch(() => {})
            showState()
          }
          button.addEventListener('click', onMute)
          cleanups.push(() => button.removeEventListener('click', onMute))
        })

        // The film raises the play/pause cursor while the pointer is over it,
        // and clicking it does what the cursor says (spec 5d, module 18992).
        if (reel) {
          const say = (type) =>
            window.dispatchEvent(new CustomEvent('rotary:cursor', { detail: type }))
          const state = () => (reel.video.paused ? 'play' : 'pause')
          const onEnter = () => say(state())
          const onLeave = () => say('default')
          const onToggle = () => {
            if (reel.video.paused) {
              delete reel.video.dataset.userPaused
              reel.video.play().catch(() => {})
            } else {
              reel.video.dataset.userPaused = '1'
              reel.video.pause()
            }
            say(state())
          }
          reel.card.addEventListener('pointerenter', onEnter)
          reel.card.addEventListener('pointerleave', onLeave)
          reel.card.addEventListener('click', onToggle)
          cleanups.push(() => {
            reel.card.removeEventListener('pointerenter', onEnter)
            reel.card.removeEventListener('pointerleave', onLeave)
            reel.card.removeEventListener('click', onToggle)
            say('default')
          })
        }

        if (rotor && box) {
          gsap.to(box, { scale: 1, duration: 1.2, ease: 'power3.inOut', delay: 0.5 })
          gsap.to(box, {
            '--poLeft': '180%',
            '--poRight': '-100%',
            duration: 1.2,
            ease: 'power3.inOut',
            delay: 0.8,
          })
          gsap.to(rotor, { rotate: 40, duration: 1.2, ease: 'power3.inOut', delay: 1.5 })
        }

        if (reel) {
          gsap.to(reel.card, {
            scale: 1,
            duration: 1,
            delay: 1.5,
            ease: 'power3.inOut',
            onComplete: () => reel.video.play().catch(() => {}),
          })
          // A single scrubbed progress over the 200svh section is the whole
          // reel: it grows the plane from a small card to fullscreen, flattens
          // the tilt and takes the corners off, then brings the control bar in
          // at the end. Nothing fades it out — the sticky child simply stops
          // sticking at the end of the section.
          //
          // The capture draws the plane in perspective, and the plane also
          // walks towards the camera as it grows, so it reads as full-bleed at
          // about 81% of the scrub rather than at the end of it. Measured off
          // :8082 — a flat DOM card has no perspective to do that for it, so
          // the size is remapped to land on the same scroll position.
          const bar = reel.bar
          const fade =
            bar &&
            (toArray(bar.querySelectorAll('*')).find(
              (n) => getComputedStyle(n).opacity === '0'
            ) ||
              bar)
          const track = bar && bar.querySelector('[class*="progress"], [class*="Progress"]')
          // "Venue film" and "MUTE" ship held a line below their masks by
          // home-extracted.css (translateY(100%)) and nothing rolled them back,
          // so the bar arrived with its icon and no words. They belong to the
          // bar, so they ride its own toggle.
          const barLabels = bar ? toArray(bar.querySelectorAll('.css-18rs6sd, .css-1oav9hz')) : []
          // Restated through GSAP before anything tweens it. Left as the
          // stylesheet writes it, the computed transform reads back as 30px of
          // `y` with `yPercent` at 0, so a tween to yPercent 0 has nowhere to
          // travel and the labels never move.
          if (barLabels.length) gsap.set(barLabels, { y: 0, yPercent: 100 })
          if (track) gsap.set(track, { scaleX: 0, transformOrigin: 'left center' })
          let barShown = false

          ScrollTrigger.create({
            trigger: reel.section,
            start: 'top top',
            end: 'bottom-=10% bottom',
            onUpdate: (self) => {
              reel.progress = self.progress
              const g = clamp(0, 1, self.progress / 0.81)
              gsap.set(reel.card, {
                width: reel.w0 + (window.innerWidth - reel.w0) * g,
                height: reel.h0 + (window.innerHeight - reel.h0) * g,
                rotate: -1.2 * (1 - g),
                borderRadius: 24 * (1 - g),
              })
              // The bar arrives only once the plane has finished growing, and
              // leaves again on the way back up.
              if (!fade || self.progress >= 1 === barShown) return
              barShown = self.progress >= 1
              gsap.to(fade, { opacity: barShown ? 1 : 0, duration: 1, ease: 'power3.out' })
              if (track) gsap.to(track, { scaleX: barShown ? 1 : 0, duration: 1, ease: 'power3.out' })
              if (barLabels.length) {
                gsap.to(barLabels, { yPercent: barShown ? 0 : 100, duration: 1, ease: 'power3.out' })
              }
            },
          })
        }

        // Built here rather than above because the mask's line breaks are
        // measured off the DOM copy, and that copy only wraps correctly once
        // the webfont is in.
        buildKnockout()

        ScrollTrigger.refresh()
      }

      // The asset counter unregisters once 100 ms in and once more when the
      // fonts resolve; the curtain lifts on the later of the two.
      Promise.all([document.fonts.ready, new Promise((res) => setTimeout(res, 100))]).then(() =>
        ctx.add(play)
      )

      // A font that never resolves must not leave the page hidden behind the
      // curtain forever.
      const bail = setTimeout(() => ctx.add(play), 4000)
      cleanups.push(() => clearTimeout(bail))
    }, root)

    return () => {
      cancelled = true
      cleanups.forEach((fn) => fn())
      splits.forEach((s) => s.revert())
      ctx.revert()
      el.querySelectorAll('video').forEach((v) => v.__io && v.__io.disconnect())
      if (raf) gsap.ticker.remove(raf)
      if (lenis) {
        lenis.destroy()
        if (window.lenis === lenis) delete window.lenis
      }
    }
  }, [])

  return root
}
