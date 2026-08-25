import PageHero from '../components/PageHero'
import { programme } from '../data/site'

/**
 * The programme, grouped the way it actually runs rather than as a flat run of
 * days: the Institute, the two governors' seminars, and the adjunct seminars
 * that fill the Thursday between them. Each component keeps the same day/slot
 * rows underneath, so the type and rules are the page's existing ones.
 */
export default function Schedule() {
  return (
    <>
      <PageHero title="Six days, from the first seminar to the last session." />

      <section className="section">
        <p className="section__label">Programme</p>

        {programme.map((c) => (
          <article className="component" key={c.id} id={c.id}>
            <div className="component__head">
              <p className="component__number">{c.number}</p>
              <div>
                <h2 className="component__name">{c.name}</h2>
                <p className="component__dates">{c.dates}</p>
                <p className="component__summary">{c.summary}</p>
              </div>
            </div>

            {c.days.map((d) => (
              <div className="day" key={d.day}>
                <p className="day__date">
                  {d.day} November
                  <span className="day__weekday">{d.weekday}</span>
                </p>
                <div>
                  {d.slots.map((s) => (
                    <div className="slot" key={s.name}>
                      {s.time ? <p className="slot__time">{s.time}</p> : null}
                      <p className="slot__name">{s.name}</p>
                      {s.note ? <p className="slot__note">{s.note}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </article>
        ))}

        <p className="component__caveat">
          Session times follow the pattern of the last Institute and are indicative until the
          organising committee confirms the final programme.
        </p>
      </section>
    </>
  )
}
