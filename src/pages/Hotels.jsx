import HotelGallery from '../components/HotelGallery'
import PageHero from '../components/PageHero'
import { hotelDistance, hotels } from '../data/site'

/**
 * A Google Maps search rather than a pinned coordinate. The name and address
 * are what the committee gave and what the chains publish; a lat/long would be
 * a number nobody supplied, and a wrong pin sends a delegate to the wrong
 * beach.
 */
const mapUrl = (h) =>
  h.map ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name}, ${h.address}`)}`

/**
 * Where to stay.
 *
 * The hotels, each with its address, its distance from the venue and a map
 * link, and the rate the committee gave for it.
 *
 * Four photographs each, from the chains' own galleries, in one order: the
 * property, a room, a view, an amenity. How they change is HotelGallery's
 * business, not this page's.
 *
 * The distance is one figure for both beach hotels because that is the truth of it:
 * they share two kilometres of the same beach strip, and the road to Canaguinim
 * runs south through Betul either way. Three different numbers would be three
 * inventions.
 */
/**
 * One hotel's four photographs.
 *
 * The strip is a real overflow scroller with scroll-snap, so a touch swipe,
 * a trackpad and shift+wheel all work without a line of JS, and the dots are
 * the only thing scripted. The active dot is read back off scrollLeft rather
 * than held as the source of truth, so a swipe the buttons never saw still
 * lights the right one.
 */
export default function Hotels() {
  return (
    <>
      <PageHero title="Hotels" />

      <section className="hotels">
        <ul className="hotels__list">
          {hotels.map((h, i) => (
            <li className="hotel" key={h.id} id={h.id}>
              <HotelGallery hotel={h} order={i} />

              <div className="hotel__head">
                <h2 className="hotel__name">{h.name}</h2>
                {h.address && <p className="hotel__address">{h.address}</p>}
                {h.rates && (
                  <div className="hotel__offer">
                    {h.for && <p className="hotel__for">{h.for}</p>}
                    <dl className="hotel__price">
                      {h.rates.map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>
                            <span className="hotel__cur">₹</span>{v.replace('₹', '')}
                            <small>+ 18% GST</small>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>

              <dl className="hotel__facts">
                <div>
                  <dt>Distance to venue</dt>
                  <dd>{h.distance || hotelDistance.road}</dd>
                </div>
                {!h.distance && (
                  <div>
                    <dt>Driving time</dt>
                    <dd>{hotelDistance.drive}</dd>
                  </div>
                )}
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
      </section>
    </>
  )
}
