import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

import { event } from '../data/site'

/**
 * The hero's centrepiece: a glass panel carrying the mark, the name, the dates,
 * the venue and the two ways in.
 *
 * Glass only reads as glass when there is something behind it to refract, and
 * the hero already provides that — the purple/cream diagonal and the giant GOA
 * 2027 wordmark both pass under the card, so the blur has real material to work
 * with rather than blurring a flat colour.
 *
 * Two pointer behaviours, both borrowed from the reel's vocabulary in
 * useHomeMotion so the card feels native to the page rather than bolted on:
 * the panel tilts toward the cursor in 3D, and a specular sheen tracks across
 * it. The tilt is what makes it an object; the sheen is what makes it glass.
 *
 * The tilt is eased at 0.1 per frame off a clamped normalised pointer, the same
 * constants the reel uses, and the whole thing is skipped for a coarse pointer
 * or when the reader has asked for reduced motion.
 */

gsap.registerPlugin(ScrollTrigger)

const MAX_TILT = 11 // degrees at the far corner — 7 was too shy to read as depth
const clamp = (lo, hi, v) => Math.min(hi, Math.max(lo, v))

export default function HeroCard() {
  const cardRef = useRef(null)
  const sheenRef = useRef(null)
  const wrapRef = useRef(null)
  // 1 while the card is its own object, 0 once it has filled the screen. The
  // tilt reads it so the lean eases out as the card becomes the page.
  const flat = useRef(1)

  useEffect(() => {
    const card = cardRef.current
    const sheen = sheenRef.current
    if (!card || !sheen) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Perspective on the card itself rather than a parent, so nothing above it
    // in the hero has to know this exists.
    gsap.set(card, { transformPerspective: 720, transformOrigin: '50% 50%' })

    const target = { x: 0, y: 0 }
    const eased = { x: 0, y: 0 }
    const setRotX = gsap.quickSetter(card, 'rotationX', 'deg')
    const setRotY = gsap.quickSetter(card, 'rotationY', 'deg')

    const onMove = (e) => {
      const b = card.getBoundingClientRect()
      // Normalised against the card's own centre, clamped so a pointer far off
      // to one side does not run the tilt away.
      target.x = clamp(-1, 1, (e.clientX - (b.left + b.width / 2)) / (b.width * 1.6))
      target.y = clamp(-1, 1, (e.clientY - (b.top + b.height / 2)) / (b.height * 1.6))
      // The sheen is placed in the card's own space, so it reads as a highlight
      // on the surface rather than a spotlight thrown from outside.
      sheen.style.setProperty('--x', ((e.clientX - b.left) / b.width) * 100 + '%')
      sheen.style.setProperty('--y', ((e.clientY - b.top) / b.height) * 100 + '%')
    }

    const tick = () => {
      eased.x += (target.x - eased.x) * 0.1
      eased.y += (target.y - eased.y) * 0.1
      // Negated on X: a positive CSS rotateX tips the top away from the viewer,
      // and the card should lean toward the cursor.
      setRotX(-eased.y * MAX_TILT * flat.current)
      setRotY(eased.x * MAX_TILT * flat.current)
    }
    gsap.ticker.add(tick)
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onMove)
      gsap.set(card, { clearProps: 'transform' })
    }
  }, [])

  // The card grows to full screen as you scroll, the way the venue film reel
  // used to. The hero already has the shape that needs: a 200svh outer section
  // with a sticky 100svh child, which is what the reel was scrubbed against.
  //
  // Desktop only — the sticky is itself a >=75rem rule, so below that the
  // section simply scrolls and there is nothing to scrub against.
  useEffect(() => {
    const glass = cardRef.current
    const wrap = wrapRef.current
    if (!glass || !wrap) return
    if (!window.matchMedia('(min-width: 75rem)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const section = wrap.closest('.css-b45nl7')
    if (!section) return

    const ctx = gsap.context(() => {
      let w0, h0, r0, pad, padX
      const measure = () => {
        gsap.set(glass, { clearProps: 'width,height,borderRadius,maxWidth' })
        gsap.set(wrap, { clearProps: 'paddingTop,paddingLeft,paddingRight' })
        const b = glass.getBoundingClientRect()
        w0 = b.width
        h0 = b.height
        r0 = parseFloat(getComputedStyle(glass).borderRadius) || 0
        const ws = getComputedStyle(wrap)
        pad = parseFloat(ws.paddingTop) || 0
        padX = parseFloat(ws.paddingLeft) || 0
        // Pin the measured size as well as lifting the cap. The card is
        // `width: 100%` under a max-width, so removing the cap on its own left
        // it full-bleed from the first frame — onUpdate does not fire until you
        // actually scroll.
        gsap.set(glass, { maxWidth: 'none', width: w0, height: h0 })
      }
      measure()

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onRefresh: measure,
        onUpdate: (self) => {
          // Full-bleed a little before the end, so the card holds at full size
          // for a beat rather than arriving exactly as the section leaves.
          const g = clamp(0, 1, self.progress / 0.82)
          flat.current = 1 - g
          gsap.set(glass, {
            width: w0 + (window.innerWidth - w0) * g,
            height: h0 + (window.innerHeight - h0) * g,
            borderRadius: r0 * (1 - g),
          })
          // The wrapper's insets close at the same rate. Without the top one
          // the card fills the viewport minus the bar and sits 68px low;
          // without the side ones it stops 24px short of each edge and never
          // quite goes full-bleed.
          gsap.set(wrap, {
            paddingTop: pad * (1 - g),
            paddingLeft: padX * (1 - g),
            paddingRight: padX * (1 - g),
          })
        },
      })
    }, wrap)

    return () => ctx.revert()
  }, [])

  const mailto = (subject) =>
    `mailto:${event.email}?subject=Rotary%20Institute%202027%20%E2%80%94%20${subject}`

  return (
    <div className="hero-card" data-no-split ref={wrapRef}>
      <div className="hero-card__glass" ref={cardRef}>
        <div className="hero-card__sheen" ref={sheenRef} aria-hidden="true" />
        <div className="hero-card__edge" aria-hidden="true" />

        {/* Everything printed on the pane sits on its own plane in front of
            it, so the tilt gives real parallax between glass and content
            instead of moving them as one flat picture. */}
        <div className="hero-card__layer">
          <img
            className="hero-card__logo"
            src="/media/logo.png"
            alt="Rotary Institute 2027 — Goa. Celebrate Leadership &amp; Service"
            width="1244"
            height="712"
            decoding="async"
          />

          <h1 className="hero-card__title">Rotary Institute 2027</h1>

          <p className="hero-card__dates">{event.dates}</p>

          <p className="hero-card__venue">
            {event.venue}
            <span>{event.address}</span>
          </p>

          <div className="hero-card__actions">
            <a className="hero-card__btn" href={mailto('Institute%20registration')}>
              Register for the Institute
            </a>
            <a
              className="hero-card__btn hero-card__btn--ghost"
              href={mailto('GELS%20and%20GNLS%20registration')}
            >
              Register for GELS &amp; GNLS
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
