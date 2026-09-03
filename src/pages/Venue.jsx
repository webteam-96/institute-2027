import PageHero from '../components/PageHero'
import { event } from '../data/site'

const FACTS = [
  ['Venue', event.venue],
  ['Address', event.address],
  ['Dates', event.dates],
  ['Pre-Institute', event.preDates],
]

export default function Venue() {
  return (
    <>
      <PageHero title="Venue" />

      <section className="section">
        <dl className="facts">
          {FACTS.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* The page is about a building, so the section describing it is built
          around one — and now around the building itself rather than a hall
          inside it. The alt says what the picture is: the source changed from
          an auditorium in session to the centre's own facade, and an alt left
          describing the old one would be a plain untruth to anyone reading
          with a screen reader. The copy is the client's, unchanged. */}
      <section className="venue-feature">
        <figure className="venue-feature__figure">
          <img
            src="/media/programme-institute.jpg"
            alt="The Prithvi Convention Centre at ONGC Goa"
            width="1400"
            height="788"
            loading="lazy"
            decoding="async"
          />
        </figure>

        <div className="venue-feature__body">
          <h2>Goa&rsquo;s largest convention centre at ATI ONGC</h2>
          <p className="venue-feature__lead">
            The Prithvi Convention Centre stands on ONGC&rsquo;s Advanced Training Institute
            (ATI) campus in South Goa &mdash; the state&rsquo;s largest and most advanced
            convention centre. Built by ONGC, it has a world-class auditorium, expansive
            exhibition spaces and the facilities to host events on the scale of India
            Energy Week.
          </p>

          <h3>ONGC&rsquo;s commitment to excellence</h3>
          <p>
            The centre is part of ONGC&rsquo;s work beyond exploration and production, and is
            used for international conferences, energy summits and knowledge exchange.
          </p>
          <p>
            As India&rsquo;s largest oil and gas producer, ONGC leads the country&rsquo;s
            energy security work while taking on cleaner technologies and the training that
            goes with them. Hosting India Energy Week at ATI Goa is part of that.
          </p>
        </div>
      </section>
    </>
  )
}
