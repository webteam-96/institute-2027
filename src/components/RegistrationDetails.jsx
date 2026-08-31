import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

import { registration } from '../data/site'

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
    const mm = gsap.matchMedia()
    const ctx = gsap.context(() => {
      gsap.set('.reg-card', { y: 32, opacity: 0 })
      gsap.set('.reg-card__rule', { scaleX: 0, transformOrigin: 'left center' })
      gsap.set('.reg-card__feehead, .reg-card__fees > div, .reg-card__btn', { y: 12, opacity: 0 })

      // Batched per card, not fired once off the section.
      //
      // The trigger used to be the <section>, which carries 10rem of padding
      // and a head block above the first card — so at 390px, where the list is
      // one column, cards 2 and 3 sit ~1400 and ~1830px down and the whole
      // timeline finished on an empty viewport. Nobody ever saw the deal-in.
      // At 1440 the three cards share a top edge, so batch collects them into
      // one call and the gesture is identical to before; on a phone each card
      // now animates as it actually arrives, and the stagger becomes the
      // scroll itself.
      ScrollTrigger.batch(el.querySelectorAll('.reg-card'), {
        start: 'top bottom-=10%',
        once: true,
        onEnter: (cards) => {
          const q = (sel) => cards.flatMap((c) => [...c.querySelectorAll(sel)])
          gsap
            .timeline()
            .to(cards, {
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
              q('.reg-card__rule'),
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
              q('.reg-card__feehead, .reg-card__fees > div, .reg-card__btn'),
              {
                y: 0,
                opacity: 1,
                duration: 0.7,
                ease: 'power3.out',
                stagger: 0.04,
                // The button needs its individual properties back or the
                // stylesheet's :active scale is dead on arrival — GSAP's
                // inline `scale: none` outranks it forever otherwise.
                clearProps: 'transform,translate,rotate,scale',
              },
              '-=0.6'
            )
        },
      })

      // Below 48rem the lists are one per row and there is no pointer, so the
      // card in the middle of the screen takes the lit state instead. Only
      // where the list is single-column: from 768px up the rows are 3 and 4
      // wide, and every card in a row shares a top edge, so the whole row
      // would light and unlight together — a flash, not a gesture.
      mm.add('(max-width: 47.99rem)', () => {
        el.querySelectorAll('.reg-card').forEach((item) =>
          ScrollTrigger.create({
            trigger: item,
            start: 'top 70%',
            end: 'bottom 45%',
            toggleClass: { targets: item, className: 'is-active' },
          })
        )
      })
    }, el)
    return () => {
      mm.revert()
      ctx.revert()
    }
  }, [])

  return (
    <section className="reg" id="registration" ref={root} data-no-split>
      <div className="reg__head">
        <p className="reg__eyebrow">Registration</p>
        <h2 className="reg__title">Event Registration Details</h2>
      </div>

      <ul className="reg__list">
        {registration.map((c) => (
          <li className="reg-card" key={c.id}>
            {/* A real element, not the ::before it used to be: it is drawn in
                on arrival and runs the width of the card on hover, and GSAP
                cannot reach a pseudo-element. */}
            <span className="reg-card__rule" aria-hidden="true" />

            <div className="reg-card__stub">
              <p className="reg-card__dates">{c.dates}</p>
              <h3 className="reg-card__name">{c.name}</h3>
              {c.expands ? <p className="reg-card__expands">{c.expands}</p> : null}
            </div>

            {/* The tear. A real element rather than a percentage down the
                card, because the three heads are not the same height and a
                percentage would put each notch at a different place on its
                own card. Its two pseudo-elements are the punched edges. */}
            <span className="reg-card__tear" aria-hidden="true" />

            {/* Outside the <dl>, not in it: a div that is neither dt nor dd is
                invalid there, and it would shift the :nth-child wipe delays and
                get caught by the row hover. Names the two columns the data
                already is — nothing here is a new fact. */}
            <p className="reg-card__feehead" aria-hidden="true">
              <span>{c.axis}</span>
            </p>

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
              href={`/registration#${c.id}`}
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

      <div className="reg__foot">
        <Link className="reg__more" to="/registration">
          Full registration details
        </Link>
      </div>
    </section>
  )
}
