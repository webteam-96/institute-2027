import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'

const { clamp, mapRange } = gsap.utils

import { event, nav } from '../data/site'

/**
 * The capture's own header: the hamburger, the diagonal menu wedge and the
 * contact panel behind the register button (spec 3).
 *
 * All of the design for this was already in the build's stylesheets — only the
 * markup and the motion were missing, which is why the class names here are the
 * capture's and not ours. Editing them means editing the CSS too.
 *
 * The two panels work the same way: a full-screen layer whose `--size` custom
 * property drives a circular mask, opened over 1.2s and closed over 0.8s. The
 * mask itself is expensive, so the class that applies it is only present while
 * the tween runs — the panel's resting state is a plain clip-path.
 */

const SWEEP_HOVER = 0.44999999999999996
const SWEEP_TOGGLE = 0.6

// A label that rolls: the clone sits below the original and both slide up
// together, so the second one arrives as the first leaves.
function Roll({ children }) {
  return (
    <span className="css-1hswejy">
      <span className="will-change-transform css-13o7eu2">
        <span className="will-change-transform css-1bx5ylf">
          <span className="text css-13o7eu2">{children}</span>
          <span className="text__clone css-rdqqhl">{children}</span>
        </span>
      </span>
    </span>
  )
}

function HeaderLabel({ children }) {
  return (
    <div className="Label_label__run2v styles_header_label__EX6Qy css-f2ndax">{children}</div>
  )
}

// The last pointer position, kept outside the component: the contact panel has
// to know where the cursor is on the very frame it opens, before it can attach
// a listener of its own.
let pointerX = null
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointerX = e.clientX
  }, { passive: true })
}

export default function SiteChrome() {
  const headerRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const location = useLocation()

  const q = useCallback((sel) => headerRef.current && headerRef.current.querySelector(sel), [])

  // The capture does not render the register button or its panel below 75rem —
  // the header there is the hamburger and the lockup, nothing else.
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width:75rem)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width:75rem)')
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // --- 3a. the header drops in once, on load ------------------------------
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    gsap.set(header, { yPercent: -100 })
    const tween = gsap.to(header, {
      yPercent: 0,
      duration: 1.3,
      // The homepage's shape hero waits for the loader; the rest do not.
      delay: window.location.pathname === '/' ? 0.8 : 0,
      ease: 'power3.out',
    })
    return () => tween.kill()
  }, [])

  // --- 3b. the two bars sweep out to the right and back in ----------------
  const sweep = useCallback(
    (root, duration, slideBackFrom, burgerClass, toggleTo) => {
      const fills = root ? [...root.querySelectorAll('.css-qdc3mj')] : []
      if (fills.length < 2) return
      const [a, b] = fills
      const tl = gsap.timeline({ defaults: { duration, ease: 'power3.out' } })
      gsap.set([a, b], { xPercent: 0 })
      tl.to(a, { xPercent: 100 })
      tl.to(
        b,
        {
          xPercent: 100,
          onComplete: () => {
            if (burgerClass) root.classList.toggle(burgerClass, toggleTo)
            gsap.set([a, b], { xPercent: slideBackFrom })
          },
        },
        '-=' + (duration - 0.1)
      )
      tl.to(a, { xPercent: 0 })
      tl.to(b, { xPercent: 0 }, '-=' + (duration - 0.1))
    },
    []
  )

  // --- 3c. the panel's circular mask --------------------------------------
  const revealPanel = useCallback((panel, inner, open, maskingClass) => {
    if (!panel) return
    const size = 2.8 * Math.max(window.innerHeight, window.innerWidth)
    gsap.killTweensOf(panel)
    if (open) {
      gsap.fromTo(
        panel,
        { '--size': '0px', opacity: 1 },
        {
          '--size': size + 'px',
          duration: 1.2,
          ease: 'power3.inOut',
          pointerEvents: 'auto',
          onStart: () => {
            if (inner) inner.classList.add('styles_on_show__wWWIr')
            panel.classList.add(maskingClass)
          },
          onComplete: () => panel.classList.remove(maskingClass),
        }
      )
    } else {
      gsap.fromTo(
        panel,
        { '--size': size + 'px' },
        {
          '--size': '0px',
          duration: 0.8,
          ease: 'power3.inOut',
          pointerEvents: 'none',
          onStart: () => panel.classList.add(maskingClass),
          onComplete: () => {
            gsap.set(panel, { opacity: 0 })
            if (inner) inner.classList.remove('styles_on_show__wWWIr')
            panel.classList.remove(maskingClass)
          },
        }
      )
    }
  }, [])

  // Opening either panel stops the page behind it. On the homepage that is
  // Lenis; everywhere else there is no smooth scroller to stop.
  useEffect(() => {
    const anyOpen = menuOpen || contactOpen
    if (window.lenis) anyOpen ? window.lenis.stop() : window.lenis.start()
    else document.body.style.overflow = anyOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, contactOpen])

  // The header has two states, and the logo is a sibling of <header> rather
  // than a child, so the flag goes on <html> where both can see it.
  //
  // Over the hero the bar carries the nav and the register button and no mark —
  // the hero card already shows the lockup at size, and a second copy of it
  // 200px above the first is just a repeat. Past the hero the mark comes in on
  // the left and the nav moves to the middle.
  //
  // Sub-pages have no hero, so they are in the scrolled state from the first
  // frame; setting it before paint avoids a flash of the hero layout.
  useEffect(() => {
    const home = location.pathname === '/'
    const root = document.documentElement
    if (!home) {
      root.classList.add('header-scrolled')
      return () => root.classList.remove('header-scrolled')
    }
    const onScroll = () => {
      root.classList.toggle('header-scrolled', window.scrollY > window.innerHeight * 0.6)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      root.classList.remove('header-scrolled')
    }
  }, [location.pathname])

  useEffect(() => {
    const menus = q('[class*="styles_menus__Fobad"]')
    const inner = q('[class*="styles_menus_inner__"]')
    const burger = q('[class*="styles_header_button_wrapper__left_inner"]')
    revealPanel(menus, inner, menuOpen, 'styles_isMasking__67XHX')
    sweep(burger, SWEEP_TOGGLE, -100, 'styles_toggled_burger__vo7Lk', menuOpen)
    const label = q('.css-1bwqv2s')
    const close = q('.css-1bjg9ce')
    const labels = [label, close].filter(Boolean)
    if (labels.length) {
      gsap.to(labels, { yPercent: menuOpen ? -100 : 0, duration: 0.7, ease: 'power3.out' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen])

  useEffect(() => {
    const panel = q('[class*="ContactMenu_maskClip__"]')
    const burger = q('[class*="ContactMenu_hamburger__"]')
    revealPanel(panel, null, contactOpen, 'ContactMenu_isMasking__ftGTd')

    // The register button rolls to CLOSE the same way the hamburger does. Its
    // markup already carried the second label; nothing ever moved it, so the
    // button still read "register" with the panel open.
    //
    // Scoped to the button rather than looked up by class: the register label
    // and the menu label share `css-1bwqv2s`, so a document-wide query would
    // find whichever comes first in the DOM and roll the wrong one.
    const regBtn = q('.css-h9isci')
    const regLabels = regBtn
      ? [regBtn.querySelector('.css-1bwqv2s'), regBtn.querySelector('.css-nqev8k')].filter(Boolean)
      : []
    if (regLabels.length) {
      gsap.to(regLabels, {
        yPercent: contactOpen ? -100 : 0,
        duration: 0.7,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }
    // This panel's wedge is not in the stylesheet: the capture writes it inline
    // and its lower corner follows the pointer across the screen. Closed, the
    // clip is unset by class rather than by clearing the property.
    // On the wrapper, not on the hamburger: the capture's rules for this class
    // target `.ContactMenu_textContent__Kc10E` and `.ContactMenu_hamburger__ZUTHE`
    // as descendants, and the text window is the hamburger's sibling.
    const regInner = regBtn && regBtn.querySelector('.css-ggc5bc')
    if (regInner) regInner.classList.toggle('ContactMenu_toggled_burger__CjyAx', contactOpen)

    const section = q('.js-section-contact')
    let track = null
    if (section) {
      if (contactOpen) {
        section.classList.remove('ContactMenu_disable_clip_path__jexrB')
        // The capture's own wedge, untouched: a diagonal you sweep with the
        // pointer, so which card is revealed follows the mouse. Driving the
        // capture at 127.0.0.1:8082 shows the identical behaviour — same clip
        // polygon, same card rects, its own left card hidden on open — so the
        // one-at-a-time reveal is the original design, not a port defect.
        track = (e) => {
          const vw = window.innerWidth
          const t = clamp(20, 85, mapRange(0.1 * vw, 0.9 * vw, 15, 85, e.clientX))
          section.style.clipPath = `polygon(90% 0%, 100% 0%, 100% 10%, ${t}% 100%, 0% 100%, 0% ${t}%)`
        }
        // Seeded from where the pointer actually is, not from the middle of
        // the screen. You open this panel by clicking REGISTER in the top right,
        // so the centre seed opened it at a 50%% wedge that sliced its own cards
        // mid-word until you moved the mouse — the capture is already at 85%%.
        track({ clientX: pointerX == null ? window.innerWidth / 2 : pointerX })
        window.addEventListener('pointermove', track, { passive: true })
      } else {
        section.classList.add('ContactMenu_disable_clip_path__jexrB')
        section.style.clipPath = ''
      }
    }
    // The register button's bars sweep but do not become an X — only the
    // hamburger on the left does that.
    sweep(burger, SWEEP_TOGGLE, -100)
    const label = q('.ContactMenu_textContent__Kc10E .css-1bwqv2s')
    const close = q('.css-nqev8k')
    const labels = [label, close].filter(Boolean)
    if (labels.length) {
      gsap.to(labels, { yPercent: contactOpen ? -100 : 0, duration: 0.7, ease: 'power3.out' })
    }
    return () => {
      if (track) window.removeEventListener('pointermove', track)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactOpen])

  // The dimmed backdrop is shared: either panel raises it.
  useEffect(() => {
    const overlay = q('[class*="styles_overlay__"]')
    if (overlay) overlay.classList.toggle('styles_toggled__4yeBE', menuOpen || contactOpen)
  }, [menuOpen, contactOpen, q])

  // A route change closes whatever is open.
  useEffect(() => {
    setMenuOpen(false)
    setContactOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      setContactOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="styles_header__vbDbd" ref={headerRef}>
        <div className="styles_header_container__1oB4s" id="header-layout">
          <button
            type="button"
            aria-label="menu button"
            aria-expanded={menuOpen}
            className="styles_header_button_wrapper__wZC4v styles_header_button_wrapper__left__gqruH"
            onPointerEnter={() =>
              sweep(q('[class*="styles_header_button_wrapper__left_inner"]'), SWEEP_HOVER, -200)
            }
            onClick={() => {
              setContactOpen(false)
              setMenuOpen((v) => !v)
            }}
          >
            <div className="styles_header_button_wrapper__left_inner__7iatL css-0">
              <div className="styles_hamburger__W5pV2">
                <span className="styles_hamburger_line__Dwrd7">
                  <span className="css-qdc3mj" />
                </span>
                <span className="styles_hamburger_line__Dwrd7">
                  <span className="css-qdc3mj" />
                </span>
              </div>
              <div className="styles_textContent__LiTlM css-1lucls5">
                <div className="css-1bwqv2s">
                  <Roll>
                    <HeaderLabel>menu</HeaderLabel>
                  </Roll>
                </div>
                <div className="css-1bjg9ce">
                  <Roll>
                    <HeaderLabel>CLOSE</HeaderLabel>
                  </Roll>
                </div>
              </div>
            </div>
          </button>
          {/* Desktop navigation. The hamburger and its full-screen wedge stay
              for phones and tablets, where six links will not fit on a bar;
              from 75rem the links are simply on the bar and the hamburger is
              hidden, so the menu is one click closer. Both are always in the
              DOM — which is shown is a media query, not state, so there is no
              flash while JS decides. */}
          <nav className="site-nav" aria-label="Primary">
            <ul>
              {nav.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={location.pathname === item.to ? 'is-current' : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>


          <div className="styles_header_container__center__Fyxyu css-0" />

          {wide ? (
            <>
          <div className="css-0">
            <button
              type="button"
              className="css-h9isci"
              aria-expanded={contactOpen}
              onPointerEnter={() =>
                sweep(q('[class*="ContactMenu_hamburger__"]'), SWEEP_HOVER, -200)
              }
              onClick={() => {
                setMenuOpen(false)
                setContactOpen((v) => !v)
              }}
            >
              <div className="css-ggc5bc">
                <div className="ContactMenu_textContent__Kc10E css-fzlqzy">
                  <div className="css-1bwqv2s">
                    <Roll>
                      <p className="css-uhh336">register</p>
                    </Roll>
                  </div>
                  <div className="css-nqev8k">
                    <Roll>
                      <p className="css-uhh336">CLOSE</p>
                    </Roll>
                  </div>
                </div>
                <div className="ContactMenu_hamburger__ZUTHE css-25tizy">
                  <div className="ContactMenu_hamburger_line__qrEtg css-18jucy4">
                    <span className="css-qdc3mj" />
                  </div>
                  <div className="ContactMenu_hamburger_line__qrEtg css-18jucy4">
                    <span className="css-qdc3mj" />
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div className="css-1e286h5">
            <div className="css-14k94qg" />
            <div className="ContactMenu_maskClip__5_UqJ css-9uzj">
              <div className="js-section-contact css-1eael3i">
                <div className="css-177vqwg">
                  <div className="css-3xqyq8">
                    <div className="css-1ts116e">
                      <div className="Container_container_grid__LWYyb css-l4y3fm">
                        <div className="css-16054k2">
                          <a
                            href={`mailto:${event.email}?subject=Rotary%20Institute%202027%20—%20Institute%20registration`}
                            className="ContactMenu_contactMenuItem__fp__K css-8atqhb"
                          >
                            <div className="css-wrhlkj">
                              <p className="css-1cmgy9g">{event.dates}</p>
                              <div className="css-0">
                                <h6 className="css-1yk6i8s">Institute Registration</h6>
                              </div>
                              <p className="register-panel__cta">Click here to register</p>
                            </div>
                          </a>
                        </div>
                        <div className="css-1rmq3ew">
                          <a
                            href={`mailto:${event.email}?subject=Rotary%20Institute%202027%20—%20GELS%20and%20GNLS%20registration`}
                            className="ContactMenu_contactMenuItem__fp__K css-8atqhb"
                          >
                            <div className="css-wrhlkj">
                              <p className="css-1cmgy9g">{event.preDates}</p>
                              <div className="css-0">
                                <h6 className="css-1yk6i8s">GELS &amp; GNLS Registration</h6>
                              </div>
                              <p className="register-panel__cta">Click here to register</p>
                            </div>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="styles_fakeMask__kEIcR" />
        <div className="styles_overlay__SxW5X" />

        <div className="styles_menus__Fobad styles_maskClip__Rk0Jm css-1mzjnuc">
          <div className="styles_menus_inner__9X7sY js-header-menus css-9uzj">
            <ul className="styles_menus__items__hZxYX">
              {nav.map((item) => (
                <li className="styles_menus__items_item__eOxOq css-1qojjm9" key={item.to}>
                  <Link to={item.to} onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <figure className="styles_logo__7LWm4 css-0">
        <div className="css-sjw2nw">
          {/* Next/Image's fill mode, which the capture's layout depends on. */}
          <img
            alt="logo"
            loading="eager"
            decoding="async"
            src="/media/logo.png"
            style={{ position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' }}
          />
        </div>
      </figure>
    </>
  )
}
