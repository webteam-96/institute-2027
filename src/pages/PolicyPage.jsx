import PageHero from '../components/PageHero'
import { policies, supportEmail } from '../data/policies'

// The support address anywhere in the text becomes a mail link.
const withMail = (t) =>
  t.split(supportEmail).flatMap((part, i) => (i ? [<a className="policy__mail" href={`mailto:${supportEmail}`} key={i}>{supportEmail}</a>, part] : [part]))

const id = (h) => h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * One of the three footer policies, picked by `slug`: a contents list that
 * stays beside the text on wide screens, then numbered sections — heading
 * beside its text on desktop so the page uses its full width.
 */
export default function PolicyPage({ slug }) {
  const { title, sections } = policies[slug]

  return (
    <>
      <PageHero title={title} />

      <section className="policy">
        <nav className="policy__toc" aria-label="On this page">
          <p className="policy__toc-label">On this page</p>
          <ol>
            {sections.map((s) => (
              <li key={s.h}>
                <a href={`#${id(s.h)}`}>{s.h}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="policy__body">
          {sections.map((s, i) => (
            <article className="policy__section" id={id(s.h)} key={s.h}>
              <span className="policy__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h2>{s.h}</h2>
              <div className="policy__text">
                {s.p?.map((t) => <p key={t}>{withMail(t)}</p>)}
                {s.cards?.map((c) => (
                  <div className={c.key ? 'policy__card policy__card--key' : 'policy__card'} key={c.p}>
                    {c.h && <h3>{c.h}</h3>}
                    <p>{withMail(c.p)}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
