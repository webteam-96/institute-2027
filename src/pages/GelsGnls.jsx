import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'

export default function GelsGnls() {
  return (
    <>
      <PageHero title="GELS/GNLS" />

      <section className="section">
        <h2>The three days</h2>
        <div className="grid grid--3">
          <div>
            <h3>Tuesday 23</h3>
            <p>Sessions open at 3.00 pm.</p>
          </div>
          <div>
            <h3>Wednesday 24</h3>
            <p>A full day of GELS and GNLS sessions.</p>
          </div>
          <div>
            <h3>Thursday 25</h3>
            <p>GELS Valedictory at 3.00 pm, then the TRF Dinner at 6.00 pm.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Where they are held</h2>
        <p>
          All sessions are held at ATI ONGC, in the breakout halls off the main corridor.
          Delegates staying in the residency blocks on the same grounds can walk between
          sessions, meals and rooms without leaving the site.
        </p>
        <p>
          <Link className="btn" to="/schedule">
            See the full schedule
          </Link>
        </p>
      </section>
    </>
  )
}
