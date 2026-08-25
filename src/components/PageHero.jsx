import { Link, useLocation } from 'react-router-dom'

import { nav } from '../data/site'

/**
 * The head of every sub-page: a breadcrumb and the page title, nothing else.
 *
 * It used to carry an eyebrow, a lede paragraph and a capped photograph. The
 * photographs were the WhatsApp-grade venue stills, so every sub-page opened on
 * a soft image before any of its own content — this puts the content first.
 *
 * The trail's second step is taken from `nav` rather than from `title`, so it
 * reads as the menu item the visitor clicked ("Hotel & Venue") rather than the
 * sentence-length page title. Falls back to the title for any route not in the
 * menu.
 */
export default function PageHero({ title }) {
  const { pathname } = useLocation()
  const here = nav.find((item) => item.to === pathname)

  return (
    <div className="hero">
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li aria-current="page">{here ? here.label : title}</li>
        </ol>
      </nav>

      <h1 className="hero__title">{title}</h1>
    </div>
  )
}
