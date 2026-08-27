import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

import { event } from '../data/site'

gsap.registerPlugin(ScrollTrigger)

/**
 * Event Registration Details.
 *
 * Modelled on the previous Institute's own registration block
 * (rotaryinstitute2026srilanka.com): one card per thing you can register for,
 * each with its dates and a two-column list of who is registering against what
 * it costs.
 *
 * The fees are not set, so every row reads "To be announced" rather than
 * carrying a number nobody has agreed. The button opens a mail rather than a
 * registration form: there is no registration system to link to yet, so the
 * mailbox is where an interested delegate actually gets an answer.
 *
 * The categories are this site's own three programme components. The reference
 * carries a fourth, a TRF Dinner, which was removed from the schedule here
 * earlier — adding it back only in registration would contradict the programme.
 */

const CATEGORIES = [
  {
    id: 'institute',
    name: 'Rotary Institute 2027',
    dates: '26 · 27 · 28 November 2027',
    subject: 'Institute%20registration',
    rows: [['Single', null], ['Couple', null]],
  },
  {
    id: 'gels-gnls',
    name: 'GELS / GNLS',
    dates: '23 – 25 November 2027',
    subject: 'GELS%20and%20GNLS%20registration',
    rows: [['Single', null], ['Couple', null]],
  },
  {
    id: 'adjunct',
    name: 'Adjunct Seminars',
    dates: '25 November 2027',
    subject: 'Adjunct%20Seminars%20registration',
    rows: [
      ['DLF Seminar', null],
      ['COL Seminar', null],
      ['Rotaract Seminar', null],
    ],
  },
]

export default function RegistrationDetails() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // The cards arrive in sequence rather than together, which reads as a list
    // being dealt out. Same easing and stagger as the committee strip above it,
    // so the two blocks feel like one page.
    //
    // Then the card assembles itself rather than arriving finished: the gold
    // rule draws, and the fee rows come up under it. The overlaps are what keep
    // that from feeling like three separate animations queued back to back.
    const ctx = gsap.context(() => {
      const rules = gsap.utils.toArray('.reg-card__rule')
      gsap.set('.reg-card', { y: 32, opacity: 0 })
      gsap.set(rules, { scaleX: 0, transformOrigin: 'left center' })
      gsap.set('.reg-card__fees > div, .reg-card__btn', { y: 12, opacity: 0 })

      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom-=15%',
        once: true,
        onEnter: () => {
          gsap
            .timeline()
            .to('.reg-card', {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: 'power3.out',
              stagger: 0.12,
              // GSAP writes `translate: none; rotate: none; scale: none` inline
              // next to its matrix, and that inline outranks the stylesheet —
              // the hover lift uses `translate` to stay clear of `transform`,
              // so it needs these handed back or it never fires.
              clearProps: 'transform,translate,rotate,scale',
            })
            .to(
              rules,
              {
                scaleX: 1,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.12,
                // Handed back to the stylesheet, which grows the rule to the
                // full width on hover. A transform left on the element would
                // fight that, and scaling a hairline to 12x smears it.
                clearProps: 'transform',
              },
              '-=0.85'
            )
            .to(
              '.reg-card__fees > div, .reg-card__btn',
              { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.04 },
              '-=0.6'
            )
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="reg" id="registration" ref={root} data-no-split>
      <div className="reg__head">
        <p className="reg__eyebrow">Registration</p>
        <h2 className="reg__title">Event Registration Details</h2>
      </div>

      <ul className="reg__list">
        {CATEGORIES.map((c) => (
          <li className="reg-card" key={c.id}>
            {/* A real element, not the ::before it used to be: it is drawn in
                on arrival and runs the width of the card on hover, and GSAP
                cannot reach a pseudo-element. */}
            <span className="reg-card__rule" aria-hidden="true" />

            <p className="reg-card__dates">{c.dates}</p>
            <h3 className="reg-card__name">{c.name}</h3>

            <dl className="reg-card__fees">
              {c.rows.map(([who, fee]) => (
                <div key={who}>
                  <dt>{who}</dt>
                  <dd className={fee ? undefined : 'is-pending'}>{fee || 'To be announced'}</dd>
                </div>
              ))}
            </dl>

            <a
              className="reg-card__btn"
              href={`mailto:${event.email}?subject=Rotary%20Institute%202027%20%E2%80%94%20${c.subject}`}
            >
              <span>Register now</span>
              <svg className="reg-card__arrow" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                <path
                  d="M1 6h13M9.5 1.5 14 6l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
