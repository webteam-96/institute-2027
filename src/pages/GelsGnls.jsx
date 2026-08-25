import { Link } from 'react-router-dom'

import PageHero from '../components/PageHero'

/**
 * Unlike the About page's three facets, which are parallel, these three days
 * are a sequence — 23, 24, 25, in order, with times attached. So they are set
 * as an itinerary rather than as three equal columns: an ordered list, one row
 * per day, with the date carrying the structure because that is what a delegate
 * scans for. Rows also give each note the width it needs; as columns they were
 * one short sentence stranded in a 430px measure.
 */
const DAYS = [
  ['23', 'Tuesday', 'Sessions open at 3.00 pm.'],
  ['24', 'Wednesday', 'A full day of GELS and GNLS sessions.'],
  ['25', 'Thursday', 'GELS Valedictory at 3.00 pm, then the TRF Dinner at 6.00 pm.'],
]

export default function GelsGnls() {
  return (
    <>
      <PageHero title="GELS/GNLS" />

      <section className="gels-days">
        <h2>The three days</h2>
        <ol className="gels-days__list">
          {DAYS.map(([date, weekday, note]) => (
            <li key={date}>
              <p className="gels-days__when">
                <span className="gels-days__date">{date}</span>
                <span className="gels-days__weekday">{weekday}</span>
              </p>
              <p className="gels-days__note">{note}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="gels-where">
        <h2>Where they are held</h2>
        <p>
          All sessions are held at ATI ONGC, in the breakout halls off the main corridor.
          Delegates staying in the residency blocks on the same grounds can walk between
          sessions, meals and rooms without leaving the site.
        </p>
        <p>
          <Link className="btn" to="/schedule">
            See the full schedule
          </Link>
        </p>
      </section>
    </>
  )
}
