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
 * carrying a number nobody has agreed. That is also why the button says
 * "Register interest" and opens a mail — there is no registration system to
 * link to yet, and a Register Now that goes nowhere is worse than an honest ask.
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
    rows: [['Single or Couple', null]],
  },
  {
    id: 'adjunct',
    name: 'Adjunct Seminars',
    dates: '25 November 2027',
    subject: 'Adjunct%20Seminars%20registration',
    rows: [
      ['DLF / COL Seminar', null],
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
    const ctx = gsap.context(() => {
      gsap.set('.reg-card', { y: 32, opacity: 0 })
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom-=15%',
        once: true,
        onEnter: () =>
          gsap.to('.reg-card', {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            stagger: 0.12,
          }),
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="reg" id="registration" ref={root} data-no-split>
      <div className="reg__head">
        <p className="reg__eyebrow">Event Registration Details</p>
        <h2 className="reg__title">
          Join an inspiring gathering of change makers celebrating leadership, fellowship and
          service driven innovation.
        </h2>
      </div>

      <ul className="reg__list">
        {CATEGORIES.map((c) => (
          <li className="reg-card" key={c.id}>
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
              Register interest
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
