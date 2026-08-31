import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import CustomCursor from './CustomCursor'
import PageEffect from './PageEffect'
import QuoteContact from './QuoteContact'
import SiteChrome from './SiteChrome'
import SiteFooter from './SiteFooter'

/**
 * The shell every page below the homepage shares: the two gold corner blocks,
 * the centred lockup, the full-screen menu, and the capture's own footer.
 *
 * The gold blocks are not pills — they are full-bar-height rectangles with a
 * single rounded corner each, flush to the top edge, exactly as the homepage
 * sets them.
 */
export default function Layout({ children }) {
  const location = useLocation()

  // A route change starts the new page at the top rather than wherever the
  // previous one was scrolled to — unless the link named a section, in which
  // case it starts there. The three programme cards on the homepage each link
  // to their own component on the schedule, so "Program schedule" under GELS &
  // GNLS has to land on the GELS & GNLS days rather than at the top of a page
  // holding all three.
  //
  // Deferred a frame: the new route's markup does not exist yet when this
  // effect runs on the first pass, so the element cannot be found. The page
  // transition wipe is still covering the screen at this point, so the jump
  // happens behind it either way.
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0)
      return
    }
    window.scrollTo(0, 0)
    const id = decodeURIComponent(location.hash.slice(1))
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        const target = document.getElementById(id)
        if (target) target.scrollIntoView({ block: 'start' })
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [location.pathname, location.hash])

  return (
    <>
      <SiteChrome />

      <main className="styles_home__sDEX3">{children}</main>

      {/* The capture puts this between every page and the footer, so it stands
          in for the hand-written CTA the sub-pages used to carry. */}
      <QuoteContact />

      <SiteFooter />

      <PageEffect />
      <CustomCursor />
    </>
  )
}
