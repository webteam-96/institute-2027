import PageHero from '../components/PageHero'
import { committee } from '../data/site'

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
      <PageHero title="Our Committee" />

      <section className="committee committee--page">
        <ul className="committee__list">
          {committee.map((person) => (
            <li className="committee__item" key={person.name}>
              {/* See CommitteeStrip: the caption below repeats it, so alt
                  text here would be announced twice. */}
              <div className="committee__frame">
                <img
                  src={person.photo}
                  alt=""
                  width="720"
                  height="900"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="committee__role">{person.role}</p>
              <h2 className="committee__name">{person.name}</h2>
            </li>
          ))}
        </ul>
      </section>

    </>
  )
}
