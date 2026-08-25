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
  // previous one was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

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
