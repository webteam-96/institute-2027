import PageHero from '../components/PageHero'
import { event, hotelDistance, hotels } from '../data/site'

/**
 * A Google Maps search rather than a pinned coordinate. The name and address
 * are what the committee gave and what the chains publish; a lat/long would be
 * a number nobody supplied, and a wrong pin sends a delegate to the wrong
 * beach.
 */
const mapUrl = (h) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name}, ${h.address}`)}`

/**
 * Where to stay.
 *
 * Three hotels, each with its address, its distance from the venue and a map
 * link. Deliberately not stated: rates, room types, or an Institute
 * allocation — none of that has been agreed, and implying a negotiated block
 * where there is none would have a delegate arrive expecting a rate that does
 * not exist.
 *
 * The photographs are placeholders taken from the template's own asset set,
 * not pictures of these three hotels. They are wired through `image` in
 * site.js so that dropping a real photograph in is a one-line change per
 * hotel - see the note in the reply. A stock resort shot captioned with a
 * named hotel is a claim about a real business a delegate books on.
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
              {/* Alt is the hotel name alone. The photograph is the subject, so
                  describing it a second time in prose would just repeat the
                  heading directly beneath it to a screen reader. */}
              <figure className="hotel__photo">
                <img src={h.image} alt={h.name} loading="lazy" decoding="async" width="960" height="720" />
              </figure>

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
                href={mapUrl(h)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Go to Map
              </a>
            </li>
          ))}
        </ul>

        <p className="hotels__note">
          Distances are approximate and measured by road to {event.venue}, Kital, Canaguinim.
        </p>
      </section>
    </>
  )
}
