import PageHero from '../components/PageHero'
import { committee, event } from '../data/site'

/**
 * The organising committee as portraits: photograph, designation, name.
 *
 * This used to be a definition list that paired the four appointed officers
 * with five "To be announced" rows. Those rows are gone — a page that is
 * mostly placeholders reads as an unfinished site rather than an early one, and
 * the roles can be added here as they are filled.
 *
 * The grid classes are the homepage strip's, so the two read as the same list
 * and neither needs styling of its own.
 */
export default function Committee() {
  return (
    <>
      <PageHero title="The people putting the Institute together." />

      <section className="committee committee--page">
        <ul className="committee__list">
          {committee.map((person) => (
            <li className="committee__item" key={person.name}>
              <div className="committee__frame">
                <img
                  src={person.photo}
                  alt={`${person.name}, ${person.role}`}
                  width="720"
                  height="900"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="committee__role">{person.role}</p>
              <p className="committee__name">{person.name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section section--tint">
        <h2>Contact</h2>
        <p>
          The Institute is hosted by Zones 4, 5, 6, 7 &amp; 8. Write to the Institute address
          and your message will reach the organisers.
        </p>
        <p>
          <a className="btn" href={`mailto:${event.email}`}>
            Email the committee
          </a>
        </p>
      </section>
    </>
  )
}
