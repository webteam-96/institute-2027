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
          {/* The two seminars are one string in the data and one heading here,
              but they are two seminars — stacked, each name reads as a whole
              instead of wrapping mid-title. The conjunction is the split
              point, so nothing is written here that the data does not hold. */}
          <h2 className="gels-intro__seminars">
            {gels.name.split(' & ').map((n) => (
              <span key={n}>{n}</span>
            ))}
          </h2>
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
      </section>

      <section className="gels-where">
        <p className="gels-where__dates">{event.preDates}</p>
        <h2>GELS &amp; GNLS Registration</h2>
        <p className="gels-where__actions">
          <a className="btn" href="/registration#gels-gnls">
            Click here to register
          </a>
        </p>
      </section>
    </>
  )
}
