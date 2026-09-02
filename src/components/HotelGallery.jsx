import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/** How long each photograph holds before the strip moves on. */
const HOLD = 5000

/**
 * The five transitions, in the order they are used. Each advance takes the
 * next one, so a hotel shows all five over a full turn and a half rather than
 * repeating one.
 */
const EFFECTS = ['slices', 'bricks', 'spin', 'rows', 'morph']

/** Columns x rows for the three that cut the picture up. */
const GRID = { slices: [9, 1], bricks: [5, 3], rows: [1, 5] }

/**
 * Rebuild one photograph out of `cols x rows` tiles.
 *
 * Each tile carries the whole image as a background scaled to the full grid
 * and offset to its own cell, which is what lets the pieces be moved and
 * rotated independently and still read as one picture when they land. The
 * tiles are decoration - the real <img> underneath keeps the alt text, and
 * this layer is aria-hidden.
 */
function cutUp(host, src, cols, rows) {
  host.textContent = ''
  const out = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const d = document.createElement('div')
      d.className = 'hotel__tile'
      d.style.width = `${100 / cols}%`
      d.style.height = `${100 / rows}%`
      d.style.left = `${(c * 100) / cols}%`
      d.style.top = `${(r * 100) / rows}%`
      d.style.backgroundImage = `url("${src}")`
      d.style.backgroundSize = `${cols * 100}% ${rows * 100}%`
      d.style.backgroundPosition = `${cols === 1 ? 50 : (c / (cols - 1)) * 100}% ${
        rows === 1 ? 50 : (r / (rows - 1)) * 100
      }%`
      host.appendChild(d)
      out.push(d)
    }
  }
  return out
}

/**
 * One hotel's four photographs, advancing on their own.
 *
 * This was a scroll-snap strip, which gave the swipe and the momentum away for
 * free. A picture cannot be cut into slices while it is the content of a native
 * scroller, so the slides are a stack now and the swipe is handled here - forty
 * lines to buy five transitions that scroll-snap cannot do at all.
 *
 * Each slider starts at a different point in the effect list and on a
 * different beat, so the three on the page are never doing the same thing at
 * the same moment.
 *
 * The transition layer is generated per advance and thrown away after, so at
 * most fifteen tiles exist at once and only for the second they are moving. The
 * four <img> elements are always in the DOM underneath with their alt text: a
 * screen reader never meets a tile.
 *
 * It holds still whenever moving it would be rude or pointless - pointer over
 * it, keyboard focus inside it, off screen, tab in the background - and for a
 * reader who has asked for reduced motion it neither advances by itself nor
 * uses any of the five effects.
 *
 * The explicit pause button was removed on request. Stopping it is still
 * possible - hovering holds it, and tabbing to any of the dots holds it too,
 * since focus anywhere inside the frame counts - but there is no longer a
 * visible control that says so, which is the part WCAG 2.2.2 asks for.
 */
export default function HotelGallery({ hotel, order = 0 }) {
  const frame = useRef(null)
  const stack = useRef(null)
  const fx = useRef(null)
  const [at, setAt] = useState(0)

  // Refs, not state: the tick reads these, and re-rendering on every hover
  // would restart the interval and make the hold time jump about.
  const held = useRef(false)
  const onScreen = useRef(false)
  const busy = useRef(false)
  // Where this slider starts in the effect list. Three sliders stepping through
  // five effects from 0, 2 and 4 are never on the same one as each other: they
  // all advance by one, so the gaps hold for good.
  const turn = useRef(order * 2)
  const index = useRef(0)

  const reduced = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const play = useCallback(
    (to) => {
      const from = index.current
      if (busy.current || to === from) return
      const layers = stack.current && [...stack.current.children]
      const host = fx.current
      if (!layers || !host) return

      busy.current = true
      index.current = to
      setAt(to)

      const settle = () => {
        gsap.set(layers, { clearProps: 'all' })
        layers.forEach((l, i) => {
          l.style.opacity = i === to ? '1' : '0'
        })
        host.textContent = ''
        host.style.visibility = 'hidden'
        busy.current = false
      }

      // No effects at all for a reader who has asked for less motion.
      if (reduced()) {
        settle()
        return
      }

      const effect = EFFECTS[turn.current % EFFECTS.length]
      turn.current += 1

      if (effect === 'spin') {
        gsap.set(layers[to], { opacity: 1, rotationX: 92, transformOrigin: '50% 50% -220px' })
        gsap
          .timeline({ onComplete: settle })
          .to(layers[from], { rotationX: -92, duration: 0.95, ease: 'power3.inOut' }, 0)
          .to(layers[to], { rotationX: 0, duration: 0.95, ease: 'power3.inOut' }, 0)
        return
      }

      if (effect === 'morph') {
        gsap.set(layers[to], { opacity: 0, scale: 1.16, filter: 'blur(16px)' })
        gsap
          .timeline({ onComplete: settle })
          .to(
            layers[from],
            { opacity: 0, scale: 0.95, filter: 'blur(12px)', duration: 0.85, ease: 'power2.inOut' },
            0
          )
          .to(
            layers[to],
            { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' },
            0
          )
        return
      }

      // The three that cut the picture up need the incoming photograph decoded
      // already - a tile is a background-image, and an undecoded one paints as
      // a hole. If it is not ready yet, morph instead of showing nothing.
      const img = layers[to].querySelector('img')
      if (!img || !img.complete || !img.naturalWidth) {
        gsap.set(layers[to], { opacity: 0 })
        gsap
          .timeline({ onComplete: settle })
          .to(layers[from], { opacity: 0, duration: 0.5 }, 0)
          .to(layers[to], { opacity: 1, duration: 0.5 }, 0)
        return
      }

      const [cols, rows] = GRID[effect]
      host.style.visibility = 'visible'
      const tiles = cutUp(host, hotel.photos[to].src, cols, rows)

      const tl = gsap.timeline({ onComplete: settle })
      if (effect === 'slices') {
        tl.fromTo(
          tiles,
          { yPercent: (i) => (i % 2 ? -104 : 104), opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.85, ease: 'power3.out', stagger: 0.055 }
        )
      } else if (effect === 'rows') {
        tl.fromTo(
          tiles,
          { rotationX: -94, opacity: 0, transformOrigin: '50% 0%' },
          { rotationX: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.085 }
        )
      } else {
        tl.fromTo(
          tiles,
          { rotationY: 94, opacity: 0, z: -160, transformOrigin: '0% 50%' },
          {
            rotationY: 0,
            opacity: 1,
            z: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: { grid: [rows, cols], from: 'center', amount: 0.55 },
          }
        )
      }
      // The outgoing picture only has to be gone by the time the tiles have
      // landed on top of it; fading it early shows the tinted ground through
      // the gaps between them.
      tl.to(layers[from], { opacity: 0, duration: 0.4 }, 0.45)
    },
    [hotel.photos]
  )

  const step = useCallback(() => {
    play((index.current + 1) % hotel.photos.length)
  }, [play, hotel.photos.length])

  // Only animate what somebody can actually see.
  useEffect(() => {
    const el = frame.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      onScreen.current = true
      return undefined
    }
    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting }, {
      threshold: 0.35,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Staggered as well as offset. Without the delay all three fire on the same
  // tick - three transitions starting together read as one flicker across the
  // page, and it is three lots of tile work in the same frame.
  useEffect(() => {
    if (reduced()) return undefined
    let id = null
    const tick = () => {
      if (held.current || busy.current || !onScreen.current || document.hidden) return
      step()
    }
    const kick = setTimeout(() => {
      id = setInterval(tick, HOLD)
    }, order * 1700)
    return () => {
      clearTimeout(kick)
      if (id) clearInterval(id)
    }
  }, [step, order])

  // A swipe, since the native scroller that used to provide one is gone.
  const down = useRef(null)
  const onPointerDown = (e) => {
    down.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e) => {
    const s = down.current
    down.current = null
    if (!s) return
    const dx = e.clientX - s.x
    // Horizontal only: a vertical drag is the page being scrolled, not a swipe.
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(e.clientY - s.y)) return
    const n = hotel.photos.length
    play(((index.current + (dx < 0 ? 1 : -1)) % n + n) % n)
  }

  const hold = () => { held.current = true }
  const release = () => { held.current = false }

  return (
    <figure
      className="hotel__photo"
      ref={frame}
      onPointerEnter={hold}
      onPointerLeave={release}
      onFocusCapture={hold}
      onBlurCapture={release}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <ul className="hotel__stack" ref={stack}>
        {hotel.photos.map((p, n) => (
          <li key={p.src} style={{ opacity: n === 0 ? 1 : 0 }}>
            <img
              src={p.src}
              alt={p.alt}
              /* The first is the one on screen; the rest stay lazy. They sit in
                 a frame that is itself in view, so the browser fetches them
                 well inside the five seconds before the timer reaches them -
                 measured, not assumed. */
              loading={n === 0 ? 'eager' : 'lazy'}
              decoding="async"
              width="1400"
              height="933"
            />
          </li>
        ))}
      </ul>

      {/* Where the slices, bricks and rows live for the second they exist. */}
      <div className="hotel__fx" ref={fx} aria-hidden="true" />

      <div className="hotel__dots" role="tablist" aria-label={`${hotel.name} photographs`}>
        {hotel.photos.map((p, n) => (
          <button
            key={p.src}
            type="button"
            role="tab"
            className={n === at ? 'is-on' : undefined}
            aria-selected={n === at}
            aria-label={`Photograph ${n + 1} of ${hotel.photos.length}`}
            onClick={() => play(n)}
          />
        ))}
      </div>
    </figure>
  )
}
