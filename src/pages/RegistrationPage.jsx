import PageHero from '../components/PageHero'
import { event, registration } from '../data/site'

/**
 * Registration Details, as its own page.
 *
 * Laid out after the previous Institute's registration page
 * (rotaryinstitute2025.com/institute-registration), which is a page rather than
 * a card strip: one block per thing you can register for, its dates stated,
 * then the rates underneath it, then the way in.
 *
 * The difference is that theirs carries numbers and ours cannot — no fee has
 * been agreed. So every rate reads "To be announced" and the page says plainly
 * that it will be updated, rather than dressing an empty table as a price list.
 * The categories, the dates and the seminar names are the same ones the
 * schedule and the homepage use; `registration` in data/site.js is the single
 * source, so the two cannot drift apart.
 *
 * Nothing on the reference that this event does not have is carried over: its
 * page lists a TRF Dinner, a DG Mid Year Review, a DRFC seminar and a
 * Sergeant-at-Arms seminar, none of which are in this programme.
 */
export default function RegistrationPage() {
  return (
    <>
      <PageHero title="Registration Details" />

      <section className="section">
        <p className="reg-page__lede">
          Registration for Rotary Institute 2027 covers three separate programmes: the
          Institute itself, the Governors Elect and Governors Nominee Learning Seminars that
          run before it, and the adjunct seminars on the day between them. You may register
          for any one of them, or for more than one.
        </p>
        <p className="reg-page__note">
          Rates are being finalised by the organising committee and will be published here as
          soon as they are confirmed. To be told when they are, write to us at{' '}
          <a href={`mailto:${event.email}`}>{event.email}</a>.
        </p>
      </section>

      <section className="reg-page">
        {registration.map((c) => (
          <article className="reg-page__block" key={c.id} id={c.id}>
            <div className="reg-page__head">
              <p className="reg-page__dates">{c.dates}</p>
              <h2 className="reg-page__name">{c.name}</h2>
              {c.expands ? <p className="reg-page__expands">{c.expands}</p> : null}
            </div>

            <div className="reg-page__body">
              <dl className="reg-page__rates">
                <div className="reg-page__ratehead">
                  <dt>{c.axis}</dt>
                  <dd>Rate</dd>
                </div>
                {c.rows.map(([who, fee]) => (
                  <div key={who}>
                    <dt>{who}</dt>
                    <dd className={fee ? undefined : 'is-pending'}>{fee || 'To be announced'}</dd>
                  </div>
                ))}
              </dl>

              <a
                className="btn reg-page__btn"
                href={`mailto:${event.email}?subject=Rotary%20Institute%202027%20%E2%80%94%20${c.subject}`}
              >
                Register for {c.name}
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="section section--tint">
        <h2>Where it takes place</h2>
        <dl className="facts">
          <div>
            <dt>Venue</dt>
            <dd>{event.venue}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{event.address}</dd>
          </div>
          <div>
            <dt>Institute</dt>
            <dd>{event.dates}</dd>
          </div>
          <div>
            <dt>Pre-Institute</dt>
            <dd>{event.preDates}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}
