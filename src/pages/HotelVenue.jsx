import PageHero from '../components/PageHero'
import { event } from '../data/site'

const FACTS = [
  ['Venue', event.venue],
  ['Address', event.address],
  ['Dates', event.dates],
  ['Pre-Institute', event.preDates],
]

const SPACES = [
  ['/media/venue-exterior.jpg', 'The convention centre facade', 'Plenary hall',
   'A tiered auditorium sized for the full Institute.'],
  ['/media/venue-dining-tables.jpg', 'Banquet tables laid for a sitting', 'Dining',
   'A dining hall that turns over the whole Institute.'],
  ['/media/stay-exterior.jpg', 'The residency block from the approach road', 'Residency',
   'Accommodation on the same campus.'],
]

export default function HotelVenue() {
  return (
    <>
      <PageHero title="One campus: sessions, meals and rooms." />

      <section className="section">
        <h2>The venue</h2>
        <dl className="facts">
          {FACTS.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <h2>Goa&rsquo;s largest convention centre at ATI ONGC</h2>
        <p>
          A landmark addition to Goa&rsquo;s infrastructure is taking shape within
          ONGC&rsquo;s Advanced Training Institute (ATI) campus, the state&rsquo;s largest
          and most advanced convention centre. This iconic facility, being developed by
          ONGC, will feature a world-class auditorium, expansive exhibition spaces, and
          modern amenities designed to host high-level global events such as the upcoming
          India Energy Week (IEW) 2026.
        </p>

        <h3>ONGC&rsquo;s commitment to excellence</h3>
        <p>
          The convention centre at ATI underscores ONGC&rsquo;s commitment to excellence,
          innovation, and nation-building beyond exploration and production. It is
          envisioned as a premier hub for international conferences, energy summits, and
          knowledge exchange &mdash; symbolising ONGC&rsquo;s role as a forward-thinking
          energy leader driving India&rsquo;s growth story.
        </p>
        <p>
          As India&rsquo;s largest oil and gas producer, ONGC continues to lead the
          nation&rsquo;s energy security mission while embracing cleaner, smarter
          technologies and future-ready talent development. Hosting IEW at ATI Goa reflects
          ONGC&rsquo;s growing stature as a thought leader driving India&rsquo;s energy
          transition.
        </p>
      </section>

      <section className="section section--tint">
        <h2>On the grounds</h2>
        <div className="grid grid--3">
          {SPACES.map(([src, alt, title, copy]) => (
            <div key={title}>
              <img src={src} alt={alt} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Getting there</h2>
        <p>
          Goa has two international airports &mdash; Mopa in the north and Dabolim in the
          south. Transfer details and the hotel booking process will be published with the
          registration slabs.
        </p>
      </section>
    </>
  )
}
