import PageHero from '../components/PageHero'

/**
 * The About copy is the client's, taken from the previous Institute's site and
 * changed only where the facts differ: 2025 -> 2027, Delhi -> Goa, 14-16
 * November -> 26-28 November, and Zones 4, 5, 6 and 7 -> Zones 4, 5, 6, 7 & 8.
 * Not a word of it is written for them.
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
          Welcome to Rotary Institute 2027, where past, present, and incoming district and
          senior leaders, alongside dedicated Rotarians, come together to foster
          collaboration, share insights, and exchange ideas about Rotary International and
          The Rotary Foundation. Scheduled to take place in{' '}
          <b className="about-fact">the vibrant state of Goa</b> from{' '}
          <b className="about-fact">26th November to 28th November 2027</b>, this event
          promises to be a significant gathering for Rotarians from{' '}
          <b className="about-fact">Zones 4, 5, 6, 7 &amp; 8</b>.
        </p>
      </section>

      <div className="about-facets">
        <article>
          <h2>Organising Excellence</h2>
          <p>
            The success of Rotary Institute 2027 is made possible by the dedication of our
            conveners and organizers, to ensure the event runs seamlessly. Drawing from the
            wisdom and experience of past Rotary officers, our team includes distinguished
            speakers, panelists, discussion leaders, and committee members, all contributing
            their unique perspectives to the event.
          </p>
        </article>

        <article>
          <h2>Who Should Attend?</h2>
          <p>
            Rotary Institute 2027 welcomes an esteemed audience, including past, present, and
            future district governors, RI Presidents, Directors, Trustees, and Regional
            Leaders. This platform is designed for those passionate about Rotary&rsquo;s
            mission and eager to contribute to meaningful global change.
          </p>
        </article>

        <article>
          <h2>Learn, Connect, and Lead</h2>
          <p>
            Rotary Institute 2027 is more than just a conference&mdash;it is an opportunity to
            connect with like-minded individuals committed to Service Above Self. Engage in
            thought-provoking discussions, explore innovative strategies, and help drive
            Rotary International and The Rotary Foundation&rsquo;s global initiatives forward.
          </p>
        </article>
      </div>

      <section className="about-coda">
        <h2>Stay Tuned for Updates</h2>
        <p>
          As we prepare for this exciting event, stay updated with the latest information and
          resources about Rotary Institute 2027. Join us in Goa this November, and be part of
          a transformative journey towards building a better world.
        </p>
      </section>
    </>
  )
}
