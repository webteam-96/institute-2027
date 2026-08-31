import { Link } from 'react-router-dom'

import PageHero from '../components/PageHero'
import { event, programme } from '../data/site'

/**
 * The two governors' learning seminars.
 *
 * This page used to carry three hand-written one-liners ("Sessions open at 3.00
 * pm") set in a column that filled half the screen and left the other half
 * empty — while `programme` already held the real thing: eight sessions across
 * the three days, with their times. It reads off that now, so the page and the
 * schedule cannot disagree, and there is enough on it to be worth the visit.
 *
 * Nothing here is written for the client. The seminars' full names, the dates,
 * the session times and the venue are all data that already existed; the only
 * new words are the labels on the structure.
 */
const gels = programme.find((c) => c.id === 'gels-gnls')

export default function GelsGnls() {
  if (!gels) return null

  return (
    <>
      <PageHero title="GELS/GNLS" />

      <section className="gels-intro">
        <div className="gels-intro__lede">
          <h2>{gels.name}</h2>
          <p>
            The three days before the Institute opens, for the district governors taking
            office and those nominated to follow them. Partners have their own track
            alongside the main sessions.
          </p>
        </div>

        <dl className="gels-intro__facts">
          <div>
            <dt>Dates</dt>
            <dd>{event.preDates}</dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{event.address}</dd>
          </div>
        </dl>
      </section>

      {/* One column per day rather than one row: three days is a set small
          enough to see at once, and each day's sessions are what a delegate is
          actually here to read. */}
      <section className="gels-days">
        <h2>The three days</h2>
        <ol className="gels-days__grid">
          {gels.days.map((d) => (
            <li className="gels-day" key={d.day}>
              <p className="gels-day__when">
                <span className="gels-day__date">{d.day}</span>
                <span className="gels-day__weekday">{d.weekday}</span>
              </p>
              <ul className="gels-day__slots">
                {d.slots.map((s) => (
                  <li key={s.name}>
                    {s.time ? <p className="gels-day__time">{s.time}</p> : null}
                    <p className="gels-day__name">{s.name}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <p className="gels-days__more">
          <Link to="/schedule#gels-gnls">See these days in the full programme</Link>
        </p>
      </section>

      <section className="gels-where">
        <p className="gels-where__dates">{event.preDates}</p>
        <h2>GELS &amp; GNLS Registration</h2>
        <p className="gels-where__actions">
          <a
            className="btn"
            href={`mailto:${event.email}?subject=Rotary%20Institute%202027%20—%20GELS%20and%20GNLS%20registration`}
          >
            Click here to register
          </a>
          <Link className="gels-where__alt" to="/registration#gels-gnls">
            Registration details
          </Link>
        </p>
      </section>
    </>
  )
}
