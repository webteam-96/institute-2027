import PageHero from '../components/PageHero'
import { committeePhotos } from '../data/committee-photos'
import { committees } from '../data/committees'

/**
 * Every committee from the workbook, one grid of people per committee: the
 * photograph, the designation and the name, nothing else.
 *
 * Single portraits throughout, matched by name in scripts/committee-photos.py;
 * a member that last year's Institute site did not have gets initials in the
 * frame rather than a stock silhouette, so the gap is visible and can be
 * filled.
 */
const initials = (name) =>
  name
    .split(' ')
    .filter((w) => !/^(dr|er|major|prof)\.?$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export default function Committee() {
  return (
    <>
      <PageHero title="Our Committee" />

      {committees.map((c) => (
        <section className="crew" key={c.title}>
          <h2 className="crew__title">{c.title}</h2>
          {c.note ? <p className="crew__note">{c.note}</p> : null}
          <ul className="crew__grid">
            {c.members.map((m, j) => {
              const photo = committeePhotos[m.name]
              return (
                <li className="person" key={j}>
                  {photo ? (
                    <img
                      className="person__frame"
                      src={photo}
                      alt=""
                      width="500"
                      height="550"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="person__frame person__frame--empty" aria-hidden="true">
                      {initials(m.name)}
                    </div>
                  )}
                  <p className="person__role">{m.role}</p>
                  <p className="person__name">{m.name}</p>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
