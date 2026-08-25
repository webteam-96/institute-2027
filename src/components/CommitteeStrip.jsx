import { Link } from 'react-router-dom'

import { committee } from '../data/site'

/**
 * The organising committee on the homepage, sitting between the programme cards
 * and the quote / contact block.
 *
 * It reuses the capture's own container grid and label classes rather than
 * inventing a layout, so it inherits the same gutters, the same fluid rem scale
 * and the same type as everything above it. The heading and the captions are
 * plain text, which means the line-mask reveal in useHomeMotion picks them up
 * on the way in like every other block on the page.
 */
export default function CommitteeStrip() {
  if (!committee.length) return null
  return (
    <section className="committee" id="committee">
      <div className="committee__head">
        <p className="committee__eyebrow">The organising committee</p>
        <h2 className="committee__title">Our Committee</h2>
      </div>

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

      <div className="committee__foot">
        <Link className="committee__link" to="/committee">
          See the full committee
        </Link>
      </div>
    </section>
  )
}
