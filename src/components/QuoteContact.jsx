import { useEffect, useRef } from 'react'
import gsap from 'gsap'

import { event } from '../data/site'

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
const OPEN = 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)'

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

function Spotlight({ title, body, cta, href }) {
  return (
    <div className="Container_container_grid__LWYyb styles_spotlightWrapper__9LC5Q css-1u3ywa2">
      <div className="styles_spotlightContent__J1Yoy css-jswixd">
        <p className="css-1acna4">Goa is expecting you.</p>
        <div className="css-d7m01n">
          <p className="css-135hczu">{title}</p>
          <p className="css-3fbzfk">{body}</p>
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
          gsap.to(panel, {
            clipPath: on ? OPEN : CLOSED,
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
      const hit = labels.findIndex((label) => {
        const b = label.getBoundingClientRect()
        return e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom
      })
      set(hit)
    }
    const onLeave = () => set(-1)
    window.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
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
                    alt="Coming to the Institute?"
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
                    alt="Got questions? A wild idea?"
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

            <div className="styles_labelWrapper__BqflW styles_labelWrapper__quote__9EII0 css-1glmj8g">
              <h3 id="quote" className="Heading_heading__ts0xt styles_label__u9J_K css-14i50cw">
                quote
              </h3>
            </div>
            <div className="styles_labelWrapper__BqflW styles_labelWrapper__contact___4N_K css-1glmj8g">
              <h3 id="contact" className="Heading_heading__ts0xt styles_label__u9J_K css-14i50cw">
                contact
              </h3>
            </div>

            <div className="css-1sst4df">
              <Spotlight
                title="Coming to the Institute?"
                body="Tell us which district you are travelling from and we will write to you the day the fee slabs are published."
                cta="register your interest"
                href={`mailto:${event.email}?subject=Rotary%20Institute%202027%20—%20registration`}
              />
              <Spotlight
                title="Got questions? A wild idea?"
                body="Sponsorship tiers and House of Friendship stalls."
                cta="Talk to the committee"
                href={`mailto:${event.email}?subject=Rotary%20Institute%202027%20—%20committee`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
