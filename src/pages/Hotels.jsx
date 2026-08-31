import PageHero from '../components/PageHero'
import { event, hotelDistance, hotels } from '../data/site'

/**
 * Where to stay.
 *
 * Three hotels, each with its address, its distance from the venue and a link
 * to its own booking page. Deliberately not stated: rates, room types, or an
 * Institute allocation — none of that has been agreed, and implying a
 * negotiated block where there is none would have a delegate arrive expecting
 * a rate that does not exist.
 *
 * The distance is one figure for all three because that is the truth of it:
 * they share two kilometres of the same beach strip, and the road to Canaguinim
 * runs south through Betul either way. Three different numbers would be three
 * inventions.
 */
export default function Hotels() {
  return (
    <>
      <PageHero title="Hotels" />

      <section className="section">
        <p className="hotels__lede">
          Three hotels on the Cavelossim and Mobor beach strip in South Goa, each a short
          drive down the coast road from {event.venue}.
        </p>
      </section>

      <section className="hotels">
        <ul className="hotels__list">
          {hotels.map((h) => (
            <li className="hotel" key={h.id} id={h.id}>
              <div className="hotel__head">
                <h2 className="hotel__name">{h.name}</h2>
                <p className="hotel__address">{h.address}</p>
              </div>

              <dl className="hotel__facts">
                <div>
                  <dt>Distance to venue</dt>
                  <dd>{hotelDistance.road}</dd>
                </div>
                <div>
                  <dt>Driving time</dt>
                  <dd>{hotelDistance.drive}</dd>
                </div>
              </dl>

              <a
                className="hotel__link"
                href={h.site}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit the hotel&rsquo;s website
              </a>
            </li>
          ))}
        </ul>

        <p className="hotels__note">
          Distances are approximate and measured by road to {event.venue}, Kital, Canaguinim.
          Rooms are booked with the hotel directly &mdash; the Institute has not published an
          allocation or a rate. For anything about accommodation, write to us at{' '}
          <a href={`mailto:${event.email}`}>{event.email}</a>.
        </p>
      </section>
    </>
  )
}
