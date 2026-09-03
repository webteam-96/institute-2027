import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The slideshow itself, with no opinion about how big it is or where it sits.
 *
 * Both the thumbnail in the hotel row and the lightbox over the page use this,
 * which is the whole reason it is a hook: the five transitions are one piece of
 * code running in two places, so they cannot drift apart.
 *
 * `start` seeds the index so opening the lightbox lands on the photograph you
 * were already looking at rather than snapping back to the first.
 */
function useSlideshow(photos, { start = 0, effectOffset = 0 } = {}) {
  const stack = useRef(null)
  const fx = useRef(null)
  const [at, setAt] = useState(start)
  const busy = useRef(false)
  const turn = useRef(effectOffset * 2)
  const index = useRef(start)
  const timeline = useRef(null)

  /** Put the stack straight on `target`, with nothing left mid-flight. */
  const settleAt = useCallback((target) => {
    const layers = stack.current && [...stack.current.children]
    const host = fx.current
    if (!layers || !host) return
    gsap.set(layers, { clearProps: 'all' })
    layers.forEach((l, i) => {
      l.style.opacity = i === target ? '1' : '0'
    })
    host.textContent = ''
    host.style.visibility = 'hidden'
    busy.current = false
  }, [])

  const play = useCallback(
    (to) => {
      const layers = stack.current && [...stack.current.children]
      const host = fx.current
      if (!layers || !host) return

      // A press landing mid-transition used to be dropped by a `busy` guard,
      // which is exactly what made the arrows feel stuck: four quick clicks
      // moved one slide, because three of them arrived inside the second the
      // previous transition was still running. Snap whatever is in flight to
      // its end and start the new one from there, so every press counts.
      if (timeline.current) {
        timeline.current.kill()
        timeline.current = null
        settleAt(index.current)
      }

      const from = index.current
      if (to === from) return

      busy.current = true
      index.current = to
      setAt(to)

      const settle = () => {
        timeline.current = null
        settleAt(to)
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
        timeline.current = gsap
          .timeline({ onComplete: settle })
          .to(layers[from], { rotationX: -92, duration: 0.95, ease: 'power3.inOut' }, 0)
          .to(layers[to], { rotationX: 0, duration: 0.95, ease: 'power3.inOut' }, 0)
        return
      }

      if (effect === 'morph') {
        gsap.set(layers[to], { opacity: 0, scale: 1.16, filter: 'blur(16px)' })
        timeline.current = gsap
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
      // a hole. If it is not ready yet, cross-fade instead of showing nothing.
      const img = layers[to].querySelector('img')
      if (!img || !img.complete || !img.naturalWidth) {
        gsap.set(layers[to], { opacity: 0 })
        timeline.current = gsap
          .timeline({ onComplete: settle })
          .to(layers[from], { opacity: 0, duration: 0.5 }, 0)
          .to(layers[to], { opacity: 1, duration: 0.5 }, 0)
        return
      }

      const [cols, rows] = GRID[effect]
      host.style.visibility = 'visible'
      const tiles = cutUp(host, photos[to].src, cols, rows)

      const tl = gsap.timeline({ onComplete: settle })
      timeline.current = tl
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
    [photos, settleAt]
  )

  const go = useCallback(
    (delta) => {
      const n = photos.length
      play((((index.current + delta) % n) + n) % n)
    },
    [play, photos.length]
  )

  return { stack, fx, at, index, busy, play, go }
}

/** The stack of photographs and the layer the tiles live in. */
function Frame({ photos, stackRef, fxRef, start, eager }) {
  return (
    <>
      <ul className="hotel__stack" ref={stackRef}>
        {photos.map((p, n) => (
          <li key={p.src} style={{ opacity: n === start ? 1 : 0 }}>
            <img
              src={p.src}
              alt={p.alt}
              /* The one on screen is eager; the rest sit in a frame that is
                 itself in view, so the browser fetches them well inside the
                 five seconds before the timer reaches them. */
              loading={eager || n === start ? 'eager' : 'lazy'}
              decoding="async"
              width="1400"
              height="933"
            />
          </li>
        ))}
      </ul>
      <div className="hotel__fx" ref={fxRef} aria-hidden="true" />
    </>
  )
}

/** The dots, shared by the thumbnail and the lightbox. */
function Dots({ photos, at, onPick, label, className }) {
  return (
    <div className={className} role="tablist" aria-label={label}>
      {photos.map((p, n) => (
        <button
          key={p.src}
          type="button"
          role="tab"
          className={n === at ? 'is-on' : undefined}
          aria-selected={n === at}
          aria-label={`Photograph ${n + 1} of ${photos.length}`}
          onClick={() => onPick(n)}
        />
      ))}
    </div>
  )
}

/**
 * The same four photographs, full size, over the page.
 *
 * It does not advance on its own. The thumbnail cycles because it is
 * decoration in a row a delegate is scanning; this is opened deliberately to
 * look at one picture, and moving it under them would be the opposite of what
 * they asked for. Every transition is still one of the five - what changes is
 * who triggers it.
 */
function Lightbox({ hotel, start, onClose }) {
  const { stack, fx, at, play, go } = useSlideshow(hotel.photos, { start })
  const panel = useRef(null)
  const closer = useRef(null)
  const returnTo = useRef(null)

  useEffect(() => {
    returnTo.current = document.activeElement
    if (closer.current) closer.current.focus()
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    // Without this the page jumps sideways by the scrollbar's width as it goes.
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Tab') {
        // A dialog that lets focus wander back to the page behind it is not a
        // dialog. Two ends, so the cycle is just a wrap.
        const f = panel.current.querySelectorAll('button')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPad
      if (returnTo.current && returnTo.current.focus) returnTo.current.focus()
    }
  }, [go, onClose])

  const drag = useRef(null)

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${hotel.name} photographs`}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) drag.current = 'backdrop'
      }}
      onPointerUp={(e) => {
        if (drag.current === 'backdrop' && e.target === e.currentTarget) onClose()
        drag.current = null
      }}
    >
      <div className="lightbox__panel" ref={panel}>
        <button ref={closer} type="button" className="lightbox__close" onClick={onClose}>
          <span className="u-visually-hidden">Close</span>
          <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
            <path d="M2 2 12 12M12 2 2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <figure
          className="lightbox__frame"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY }
          }}
          onPointerUp={(e) => {
            const s = drag.current
            drag.current = null
            if (!s || s === 'backdrop') return
            const dx = e.clientX - s.x
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(e.clientY - s.y)) return
            go(dx < 0 ? 1 : -1)
          }}
        >
          <Frame photos={hotel.photos} stackRef={stack} fxRef={fx} start={start} eager />
        </figure>

        <div className="lightbox__bar">
          <button type="button" className="lightbox__step" aria-label="Previous photograph" onClick={() => go(-1)}>
            <svg viewBox="0 0 16 12" aria-hidden="true" focusable="false">
              <path d="M15 6H2M6.5 1.5 2 6l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <Dots
            photos={hotel.photos}
            at={at}
            onPick={play}
            label={`${hotel.name} photographs`}
            className="lightbox__dots"
          />
          <button type="button" className="lightbox__step" aria-label="Next photograph" onClick={() => go(1)}>
            <svg viewBox="0 0 16 12" aria-hidden="true" focusable="false">
              <path d="M1 6h13M9.5 1.5 14 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * One hotel's four photographs, advancing on their own, and openable.
 *
 * This was a scroll-snap strip, which gave the swipe and the momentum away for
 * free. A picture cannot be cut into slices while it is the content of a native
 * scroller, so the slides are a stack now and the swipe is handled here.
 *
 * Each slider starts at a different point in the effect list and on a different
 * beat, so the three on the page are never doing the same thing at the same
 * moment.
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
 */
export default function HotelGallery({ hotel, order = 0 }) {
  const frame = useRef(null)
  const { stack, fx, at, index, busy, play, go } = useSlideshow(hotel.photos, {
    effectOffset: order,
  })
  const [open, setOpen] = useState(false)
  const [openAt, setOpenAt] = useState(0)

  const held = useRef(false)
  const onScreen = useRef(false)

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
  //
  // It also stops while the lightbox is open: the thumbnail underneath is not
  // being looked at, and the two would fight over which photograph you are on.
  useEffect(() => {
    if (reduced() || open) return undefined
    let id = null
    const tick = () => {
      if (held.current || busy.current || !onScreen.current || document.hidden) return
      go(1)
    }
    const kick = setTimeout(() => {
      id = setInterval(tick, HOLD)
    }, order * 1700)
    return () => {
      clearTimeout(kick)
      if (id) clearInterval(id)
    }
  }, [go, order, open, busy])

  // One pointer gesture, three meanings: a drag sideways is a swipe, a drag
  // downwards is the page being scrolled, and a press that goes nowhere is a
  // click to open the picture.
  const down = useRef(null)
  const onPointerDown = (e) => {
    down.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e) => {
    const s = down.current
    down.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      setOpenAt(index.current)
      setOpen(true)
      return
    }
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    go(dx < 0 ? 1 : -1)
  }

  return (
    <>
      <figure
        className="hotel__photo"
        ref={frame}
        onPointerEnter={() => { held.current = true }}
        onPointerLeave={() => { held.current = false }}
        onFocusCapture={() => { held.current = true }}
        onBlurCapture={() => { held.current = false }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <Frame photos={hotel.photos} stackRef={stack} fxRef={fx} start={0} />

        {/* The keyboard's way in, and the affordance that says the picture
            opens at all. The pointer gets it by clicking the photograph. */}
        <button
          type="button"
          className="hotel__open"
          aria-label={`View ${hotel.name} photographs full size`}
          onClick={() => {
            setOpenAt(index.current)
            setOpen(true)
          }}
        >
          <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
            <path
              d="M5.5 1.5H1.5V5.5M8.5 1.5h4v4M12.5 8.5v4h-4M5.5 12.5h-4v-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>

        <Dots
          photos={hotel.photos}
          at={at}
          onPick={play}
          label={`${hotel.name} photographs`}
          className="hotel__dots"
        />
      </figure>

      {open && (
        <Lightbox hotel={hotel} start={openAt} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
