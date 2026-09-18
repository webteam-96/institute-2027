import PageHero from '../components/PageHero'
import { event } from '../data/site'

const HALLS = [
  {
    id: 'vayu',
    kicker: 'Exhibition hall',
    name: 'Vayu \u2013 Exhibition Hall',
    photo: '/media/venue-vayu.jpg',
    alt: 'The Vayu exhibition hall, with its orange patterned facade',
    text:
      'A 7,200 sq m air-conditioned, column-free exhibition floor whose flexible layout adapts to booth grids, brand environments, large installations and industry showcases.',
  },
  {
    id: 'aakash',
    kicker: 'Management development facility',
    name: 'Aakash \u2013 Management Development Facility (MDF)',
    photo: '/media/venue-aakash.jpg',
    alt: 'The Aakash management development facility, with its white angled columns and red roof',
    tag: 'Venue for GELS & GNLS',
    text:
      'Formal learning environments and collaborative discussion spaces in one facility, suited to programmes that need a main session, smaller working groups, leadership engagement and dining to run in parallel.',
  },
]

const FACTS = [
  ['Venue', event.venue],
  ['Address', event.address],
  ['Pre-Institute', event.preDates],
  ['Institute', event.dates],
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
        </div>
      </section>

      {/* The two other halls the Institute uses, as the centre itself
          describes them (ubcc.in, the venue's own site): the photographs and
          the words are theirs. Each hall is a card: the photograph on one
          side, shown whole, its description on the other. The cards alternate
          sides so the two read as two buildings rather than two rows of a
          table. Aakash carries the tag that matters most: it is where GELS
          and GNLS are held. */}
      <section className="halls">
        <h2 className="halls__title">The halls</h2>
        <ul className="halls__list">
          {HALLS.map((h) => (
            <li className="hall" key={h.id} id={h.id}>
              <figure className="hall__figure">
                <img src={h.photo} alt={h.alt} width="880" height="495" loading="lazy" decoding="async" />
                {h.tag ? <figcaption className="hall__tag">{h.tag}</figcaption> : null}
              </figure>
              <div className="hall__body">
                <p className="hall__kicker">{h.kicker}</p>
                <h3 className="hall__name">{h.name}</h3>
                <p className="hall__text">{h.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
