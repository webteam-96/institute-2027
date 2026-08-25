import PageHero from '../components/PageHero'
import { event } from '../data/site'

export default function About() {
  return (
    <>
      <PageHero title="Five zones meet on one coast." />

      <section className="section">
        <h2>What an Institute is</h2>
        <p>
          A Rotary Institute is the annual gathering of a group of zones. It is where
          district governors past, present and incoming meet Rotary International&rsquo;s
          leadership, and where the year ahead is set out.
        </p>
        <p>
          The Institute proper runs across three days. The days before it carry the training
          seminars &mdash; GELS and GNLS &mdash; and the adjunct seminars, so that everyone
          who needs to be trained is trained before the Institute opens.
        </p>
      </section>

      <section className="section section--tint">
        <h2>Who it is for</h2>
        <div className="grid grid--3">
          <div>
            <h3>Governors</h3>
            <p>Past, present, elect and nominee district governors from all five host zones.</p>
          </div>
          <div>
            <h3>Club leadership</h3>
            <p>
              Club presidents and senior Rotarians attending the Institute programme and the
              House of Friendship.
            </p>
          </div>
          <div>
            <h3>Rotaract &amp; companions</h3>
            <p>The Rotaract seminar and the companion programme run alongside the main days.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>The theme</h2>
        <p>
          <em>Celebrate Leadership &amp; Service</em> is the theme carried by the 2027 emblem
          &mdash; the Goan coastline, its churches, its forts and its lighthouse, drawn in
          Rotary&rsquo;s own blue and gold.
        </p>
      </section>
    </>
  )
}
