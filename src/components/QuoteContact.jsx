import { useEffect, useRef } from 'react'
import gsap from 'gsap'


/**
 * The quote / contact spotlight the capture puts between every page and the
 * footer (spec 14). Markup and CSS are the capture's — `styles/quote.css`.
 *
 * Two yellow panels wipe open from a hairline in the middle out to a trapezium,
 * one per label, with the matching photograph fading up behind and the section
 * dimming. The capture hit-tests the raw pointer against each label's box
 * rather than using `:hover`, because the labels are `pointer-events: none` on
 * desktop and the panel that covers them would steal the hover anyway.
 */

const CLOSED = 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)'
// The capture's shape is a spotlight beam: narrow at the top, splayed to the
// full width at the bottom, so it reads as a light thrown from where the
// pointer is. That only works with a pointer, and only at a width where 35-65%
// is still a usable measure — on a 390px screen the top of the beam is 117px
// and it slices straight through the panel's own heading. Below 75rem, where
// there is no pointer to throw it from, it opens square instead.
const OPEN = 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)'
const OPEN_NARROW = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'

function Roll({ children }) {
  return (
    <span className="fix-mask-clip-mask css-1hswejy">
      <span className="will-change-transform css-13o7eu2">
        <span className="will-change-transform css-1bx5ylf">
          <span className="text css-13o7eu2">{children}</span>
          <span className="text__clone css-rdqqhl">{children}</span>
        </span>
      </span>
    </span>
  )
}

function Arrow() {
  return (
    <button className="css-1g7m662" type="button" tabIndex={-1} aria-hidden="true">
      <div className="css-14om1bk">
        <div className="main-icon css-1x3oun">
          <img alt="" loading="lazy" width="10" height="10" decoding="async" src="/icons/ic_arrow-right.svg" />
        </div>
      </div>
      <div className="css-gyp8mm">
        <div className="main-icon css-1x3oun">
          <img alt="" loading="lazy" width="10" height="10" decoding="async" src="/icons/ic_arrow-right.svg" />
        </div>
      </div>
    </button>
  )
}

function Spotlight({ title, cta, href }) {
  return (
    <div className="Container_container_grid__LWYyb styles_spotlightWrapper__9LC5Q css-1u3ywa2">
      <div className="styles_spotlightContent__J1Yoy css-jswixd">
        <div className="css-d7m01n">
          <p className="css-135hczu">{title}</p>
          <a href={href}>
            <div className="css-ch5759">
              <Roll>
                <p className="css-1jvnbej">{cta}</p>
              </Roll>
              <Arrow />
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default function QuoteContact() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const labels = [...el.querySelectorAll('[class*="styles_labelWrapper__"]')]
    const wrappers = [...el.querySelectorAll('[class*="styles_spotlightWrapper__"]')]
    const panels = wrappers.map((w) => w.querySelector('[class*="styles_spotlightContent__"]'))
    const images = [...el.querySelectorAll('.css-3l1h0e > *')]
    if (!labels.length || !wrappers.length) return

    let open = -1
    const set = (index) => {
      if (index === open) return
      open = index
      // The capture ships a dim layer above these panels but never raises it on
      // this hover — measured on :8082, it stays at opacity 0 — so neither do we.
      wrappers.forEach((wrapper, i) => {
        const panel = panels[i]
        const on = i === index
        gsap.killTweensOf([wrapper, panel, images[i]].filter(Boolean))
        if (on) gsap.set(wrapper, { pointerEvents: 'auto', visibility: 'visible' })
        else gsap.set(wrapper, { pointerEvents: 'none' })
        if (panel) {
          const open = window.matchMedia('(min-width: 75rem)').matches ? OPEN : OPEN_NARROW
          gsap.to(panel, {
            clipPath: on ? open : CLOSED,
            ease: 'power3.out',
            duration: 0.8,
            onComplete: on
              ? undefined
              : () => gsap.set(wrapper, { visibility: 'hidden', clearProps: 'clipPath' }),
          })
        }
        if (images[i]) {
          gsap.set(images[i], { zIndex: on ? 1 : 0 })
          gsap.to(images[i], { opacity: on ? 1 : 0, ease: 'power3.out', duration: 0.8 })
        }
      })
    }

    // --- parallax (spec 6) ------------------------------------------------
    // Not ScrollTrigger: a per-frame read of where the box's own middle sits
    // against the middle of the viewport, translated straight onto the inner.
    // Desktop only, as in the original.
    const inner = el.querySelector('[class*="styles_parallaxBox_inner"]')
    let drift = null
    if (inner && window.matchMedia('(min-width:1200px)').matches) {
      const setY = gsap.quickSetter(inner, 'y', 'px')
      drift = () => {
        const vh = window.innerHeight
        const b = el.getBoundingClientRect()
        if (!(b.bottom > 0 && b.top < vh)) return
        // speed 0.5, not the component's default of 1 — measured against the
        // live site, which moves this box exactly half as far as the raw
        // anchor difference.
        setY((vh * 0.5 - (b.top + b.height * 0.5)) * 0.5)
      }
      gsap.ticker.add(drift)
    }

    // Hit-tested against the raw pointer, not :hover — see the note above.
    const onMove = (e) => {
      // Desktop only. A tap emits pointermove too, so without this the touch
      // path would open a panel here and the click below would immediately
      // toggle it shut again.
      if (!window.matchMedia('(min-width: 75rem)').matches) return
      const hit = labels.findIndex((label) => {
        const b = label.getBoundingClientRect()
        return e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom
      })
      set(hit)
    }
    const onLeave = () => set(-1)

    // Tap to open, for every device that cannot hover.
    //
    // The reveal above is driven entirely by pointer position, so below 75rem
    // — where the stylesheet also hides the panels outright — the two headings
    // sat there underlined and did nothing, and the "Click here to register"
    // inside each panel could not be reached at all. On those widths the panel
    // is shown (see quote.css) and the heading becomes its switch: tap to
    // open, tap the same one again or the panel's own background to close.
    // The CTA keeps its own click, so tapping the button still opens the mail.
    const onClick = (e) => {
      if (window.matchMedia('(min-width: 75rem)').matches) return
      const i = labels.findIndex((label) => label.contains(e.target))
      if (i > -1) {
        set(i === open ? -1 : i)
        return
      }
      // Anywhere on the open panel that is not the button closes it again.
      if (open > -1 && !e.target.closest('a')) set(-1)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('click', onClick)
      if (drift) gsap.ticker.remove(drift)
    }
  }, [])

  return (
    <div className="styles_parallaxBox__19SzL styles_isClip__0Mxib css-rqgsqp" ref={root}>
      <div className="styles_parallaxBox_inner__yVlq6">
        <div className="styles_section__VRl4k css-ahjpv9">
          <div className="css-1ndlzv6" />
          <div className="Container_container_grid__LWYyb styles_section_content__bHg04 css-u4s309">
            <div className="css-3l1h0e">
              <div className="css-i3uo7i">
                <div className="image-placeholder ImagePlaceholder_imagePlaceholder__UW5XD css-pf0bo6">
                  <img
                    alt="Register for Rotary Institute 2027"
                    loading="lazy"
                    width="1920"
                    height="1080"
                    decoding="async"
                    className="ImagePlaceholder_imagePlaceholder__original__CpPiD ImagePlaceholder_isLoaded__A0g_D"
                    src="/media/venue-dusk.jpg"
                  />
                </div>
              </div>
              <div className="css-i3uo7i">
                <div className="image-placeholder ImagePlaceholder_imagePlaceholder__UW5XD css-pf0bo6">
                  <img
                    alt="Register for GELS and GNLS"
                    loading="lazy"
                    width="1920"
                    height="1080"
                    decoding="async"
                    className="ImagePlaceholder_imagePlaceholder__original__CpPiD ImagePlaceholder_isLoaded__A0g_D"
                    src="/media/venue-entrance.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Plain headings. Below 75rem they are the tap target that opens
                the panel behind them — see the click handler above — so an
                anchor here would launch a mail client instead of revealing the
                CTA the panel already carries. */}
            <div className="styles_labelWrapper__BqflW styles_labelWrapper__quote__9EII0 css-1glmj8g">
              <h3 id="quote" className="Heading_heading__ts0xt styles_label__u9J_K css-14i50cw">
                Institute
              </h3>
            </div>
            <div className="styles_labelWrapper__BqflW styles_labelWrapper__contact___4N_K css-1glmj8g">
              <h3 id="contact" className="Heading_heading__ts0xt styles_label__u9J_K css-14i50cw">
                GELS &amp; GNLS
              </h3>
            </div>

            <div className="css-1sst4df">
              <Spotlight
                title="Register for Rotary Institute 2027"
                cta="Click here to register"
                href="/registration#institute"
              />
              <Spotlight
                title="Register for GELS &amp; GNLS"
                cta="Click here to register"
                href="/registration#gels-gnls"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
