import PageHero from '../components/PageHero'

/**
 * The About copy came from the previous Institute's site. It has been rewritten
 * to say the same things in plainer words - no fact added, removed or changed.
 *
 * Two things in it were wrong rather than merely stiff. "Join us in Goa this
 * November" was written for a site read in the year of its own Institute; read
 * in 2026 it points at the wrong November. And three American spellings sat in
 * a paragraph headed "Organising Excellence", on a site that writes programme,
 * centre and Convenor everywhere else.
 *
 * The four headings are the client's own and stay as written. The paragraphs
 * under them are the plain-words versions; only the padding went.
 *
 * The layout follows the shape the copy actually has, which is not five equal
 * sections: an opening statement, three parallel facets (who runs it, who it is
 * for, what happens there — the three are within 70 characters of each other in
 * length, so they genuinely are a set), and a closing note. Three kinds of
 * content, three treatments.
 *
 * The three facts in the welcome are marked where they sit in the sentence
 * rather than pulled out into a row of statistics: this page is an invitation,
 * and an invitation emphasises its where and when in place.
 */
export default function About() {
  return (
    <>
      <PageHero title="About Rotary Institute 2027" />

      <section className="about-lead">
        <p>
          Rotary Institute 2027 brings together past, present and incoming district and
          senior leaders, alongside Rotarians from across the zones, to share ideas and
          experience of Rotary International and The Rotary Foundation. It is held in{' '}
          <b className="about-fact">Goa</b> from{' '}
          <b className="about-fact">26 to 28 November 2027</b>, for{' '}
          <b className="about-fact">Zones 4, 5, 6, 7 &amp; 8</b>.
        </p>
      </section>

      <div className="about-facets">
        <article>
          <h2>Organising Excellence</h2>
          <p>
            The Institute is put together by its convenors and organisers, drawing on the
            experience of past Rotary officers. The team includes the speakers, panellists,
            discussion leaders and committee members who lead the sessions.
          </p>
        </article>

        <article>
          <h2>Who Should Attend?</h2>
          <p>
            Past, present and future district governors, RI Presidents, Directors, Trustees
            and Regional Leaders, and Rotarians who want to take part in the work of
            Rotary&rsquo;s mission.
          </p>
        </article>

        <article>
          <h2>Learn, Connect, and Lead</h2>
          <p>
            Three days of discussion among people committed to Service Above Self, given to
            the sessions themselves, to the fellowship between them, and to the work of
            Rotary International and The Rotary Foundation.
          </p>
        </article>
      </div>

      <section className="about-coda">
        <h2>Stay Tuned for Updates</h2>
        <p>
          More will be posted here as it is settled &mdash; the programme, the rates and the
          way to register. We hope to see you in Goa in November 2027.
        </p>
      </section>
    </>
  )
}
