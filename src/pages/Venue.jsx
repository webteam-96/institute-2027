import PageHero from '../components/PageHero'
import { event } from '../data/site'

const FACTS = [
  ['Venue', event.venue],
  ['Address', event.address],
  ['Dates', event.dates],
  ['Pre-Institute', event.preDates],
]

/* Two spaces, not three: the residency card moved to /hotels with the rest of
   the accommodation, so this page is only ever about the building the
   Institute happens in. */
const SPACES = [
  ['/media/venue-exterior.jpg', 'The convention centre facade', 'Plenary hall',
   'A tiered auditorium sized for the full Institute.'],
  ['/media/venue-dining-tables.jpg', 'Banquet tables laid for a sitting', 'Dining',
   'A dining hall that turns over the whole Institute.'],
]

export default function Venue() {
  return (
    <>
      <PageHero title="Venue" />

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

      {/* The page is about a building, so the section describing it is built
          around one. event-plenary.jpg is the Prithvi auditorium in session —
          the "world-class auditorium" the first paragraph names — so the
          picture carries the claim rather than illustrating it generically.
          The copy is the client's, unchanged. */}
      <section className="venue-feature">
        <figure className="venue-feature__figure">
          <img
            src="/media/event-plenary.jpg"
            alt="The plenary auditorium at ATI ONGC in session"
            width="1024"
            height="768"
            loading="lazy"
            decoding="async"
          />
        </figure>

        <div className="venue-feature__body">
          <h2>Goa&rsquo;s largest convention centre at ATI ONGC</h2>
          <p className="venue-feature__lead">
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
        </div>
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

    </>
  )
}
