import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

import { committee } from '../data/site'

gsap.registerPlugin(ScrollTrigger)

/**
 * The organising committee on the homepage, sitting between the programme cards
 * and the quote / contact block.
 *
 * It reuses the capture's own container grid and label classes rather than
 * inventing a layout, so it inherits the same gutters, the same fluid rem scale
 * and the same type as everything above it. The heading and the captions are
 * plain text, which means the line-mask reveal in useHomeMotion picks them up
 * on the way in like every other block on the page.
 */
export default function CommitteeStrip() {
  const root = useRef(null)

  // The portraits deal out left to right, and each photograph settles from
  // slightly over-scaled as its frame arrives — so the picture lands into the
  // frame rather than the pair appearing together already finished. Same
  // easing and stagger as the registration cards below, so the two blocks read
  // as one page rather than two components that each brought their own motion.
  useEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.set('.committee__item', { y: 32, opacity: 0 })
      gsap.set('.committee__frame img', { scale: 1.12 })

      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom-=15%',
        once: true,
        onEnter: () => {
          gsap
            .timeline()
            .to('.committee__item', {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: 'power3.out',
              stagger: 0.12,
              // GSAP writes `translate: none; rotate: none; scale: none` inline
              // alongside its matrix, so its transform is the only one in play.
              // That inline beats the stylesheet, and the hover lift — which
              // uses `translate` precisely to stay off `transform` — never
              // applied until these were handed back.
              clearProps: 'transform,translate,rotate,scale',
            })
            .to(
              '.committee__frame img',
              {
                scale: 1,
                duration: 1.4,
                ease: 'power3.out',
                stagger: 0.12,
                // Back to the stylesheet, which scales the photograph on hover.
                clearProps: 'transform',
              },
              '-=1.1'
            )
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  if (!committee.length) return null
  return (
    <section className="committee" id="committee" ref={root}>
      <div className="committee__head">
        <p className="committee__eyebrow">The organising committee</p>
        <h2 className="committee__title">Our Committee</h2>
      </div>

      <ul className="committee__list">
        {committee.map((person) => (
          <li className="committee__item" key={person.name}>
            <div className="committee__frame">
              <img
                src={person.photo}
                alt={`${person.name}, ${person.role}`}
                width="720"
                height="900"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="committee__role">{person.role}</p>
            <p className="committee__name">{person.name}</p>
          </li>
        ))}
      </ul>

      <div className="committee__foot">
        <Link className="committee__link" to="/committee">
          See the full committee
        </Link>
      </div>
    </section>
  )
}
