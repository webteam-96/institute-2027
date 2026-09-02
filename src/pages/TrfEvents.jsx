import PageHero from '../components/PageHero'
import { trfEvents } from '../data/site'

/**
 * The Rotary Foundation events.
 *
 * Two of them, and only what the committee gave: a name, a date and a time
 * each. No fee, no venue beyond the Institute's own, no description of what
 * happens at either — none of that has been supplied, and a page that invents
 * it reads as filled in rather than finished.
 *
 * They are set as a pair of dated cards rather than as a table, because two
 * rows is not a table; the date is what a delegate scans for, so it carries
 * the structure.
 */
export default function TrfEvents() {
  return (
    <>
      <PageHero title="TRF Events" />

      <section className="section">
        <p className="trf__lede">
          Two events for The Rotary Foundation sit alongside the Institute, on the evening
          before it opens and on its first morning.
        </p>
      </section>

      <section className="trf">
        <ol className="trf__list">
          {trfEvents.map((e) => (
            <li className="trf-card" key={e.id} id={e.id}>
              <p className="trf-card__when">
                <span className="trf-card__day">{e.day}</span>
                <span className="trf-card__weekday">{e.weekday}</span>
              </p>
              <div className="trf-card__body">
                <h2 className="trf-card__name">{e.name}</h2>
                <p className="trf-card__date">{e.date}</p>
                <p className="trf-card__time">{e.time}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
