import { Link } from 'react-router-dom'

import PageHero from '../components/PageHero'
import { event, programme } from '../data/site'

/**
 * The adjunct seminars, on the day between the governors' seminars and the
 * Institute itself.
 *
 * Read off `programme` rather than restated here, the way the GELS/GNLS page
 * does, so this page and the schedule cannot disagree about a time. The three
 * seminars run in parallel — same day, same hours — which is the one thing
 * about them a delegate needs to know and the reason they are set side by side
 * rather than as a sequence.
 */
const adjunct = programme.find((c) => c.id === 'pre-institute')

export default function AdjunctSeminars() {
  if (!adjunct) return null

  const day = adjunct.days[0]

  return (
    <>
      <PageHero title="Adjunct Seminars" />

      <section className="gels-intro">
        <div className="gels-intro__lede">
          <h2>{adjunct.name}</h2>
          <p>
            Three seminars on the Thursday, between the close of the governors&rsquo; learning
            seminars and the opening of the Institute. They run in parallel, so a delegate
            attends one of them.
          </p>
        </div>

        <dl className="gels-intro__facts">
          <div>
            <dt>Date</dt>
            <dd>{adjunct.dates}</dd>
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

      <section className="gels-days">
        <h2>The three seminars</h2>
        <ol className="gels-days__grid">
          {/* No date on the columns. All three run the same day and the same
              hours — that is the point of them — so repeating "25 Thursday"
              three times says nothing the facts panel above has not already
              said. The time stays, because it is the one thing that would
              differ if the committee ever moved one. */}
          {day.slots.map((s) => (
            <li className="gels-day adjunct-day" key={s.name}>
              {s.time ? <p className="gels-day__time">{s.time}</p> : null}
              <p className="adjunct-day__name">{s.name}</p>
            </li>
          ))}
        </ol>

        <p className="gels-days__more">
          <Link to="/schedule#pre-institute">See this day in the full programme</Link>
        </p>
      </section>

      <section className="gels-where">
        <p className="gels-where__dates">{adjunct.dates}</p>
        <h2>Adjunct Seminars Registration</h2>
        <p className="gels-where__actions">
          <a
            className="btn"
            href={`mailto:${event.email}?subject=Rotary%20Institute%202027%20—%20Adjunct%20Seminars%20registration`}
          >
            Click here to register
          </a>
          <Link className="gels-where__alt" to="/registration#adjunct">
            Registration details
          </Link>
        </p>
      </section>
    </>
  )
}
