import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'

/**
 * The page-transition wipe (spec 2): a full-screen yellow layer that closes over
 * the page you are leaving and opens off the one you arrive on.
 *
 * Two halves. Leaving, a circular mask grows from nothing while the inner panel
 * morphs from the menu's own wedge to a full cover, and the route only changes
 * once that finishes. Arriving, the panel morphs the other way and the layer
 * drops out.
 *
 * It does not run on a cold load — measured on :8082, the layer sits at opacity
 * 0 the whole way through the first paint and only the loader curtain moves.
 *
 * Navigation is intercepted in the capture phase so this runs before React
 * Router sees the click; Router's own Link handler bails on a prevented event.
 */

const LEAVE_FROM = {
  desktop: 'polygon(0% 0%, 10% 0%, 100% 20%, 100% 100%, 70% 100%, 0% 6%)',
  tablet: 'polygon(90% 0%, 100% 0%, 100% 8%, 40% 100%, 0% 100%, 0% 40%)',
  mobile: 'polygon(80% 0%, 100% 0%, 100% 8%, 65% 100%, 0% 100%, 0% 50%)',
}

// The capture derives these rather than listing them: a polygon whose first
// point starts at 0 has every percentage between 20 and 70 snapped to 0;
// otherwise the two corner points are pushed out to the edges.
const LEAVE_TO = {
  desktop: 'polygon(0% 0%, 10% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 6%)',
  tablet: 'polygon(90% 0%, 100% 0%, 100% 8%, 100% 100%, 0% 100%, 0% 0%)',
  mobile: 'polygon(80% 0%, 100% 0%, 100% 8%, 100% 100%, 0% 100%, 0% 0%)',
}

const ENTER = {
  desktop: {
    from: 'polygon(100% 0%, 100% 100%, -0% -0%, 100% 100%, 0% 100%, -0% -0%)',
    to: 'polygon(100% 0%, 100% 0%, -0% -0%, 0% 100%, 0% 100%, -0% -0%)',
  },
  other: {
    from: 'polygon(0% 100%, 100% -0%, 0% 100%, 100% 100%, 100% -0%, 0% 0%)',
    to: 'polygon(0% 0%, 100% -0%, 100% 100%, 100% 100%, 100% -0%, 0% 0%)',
  },
}

const breakpoint = () =>
  window.innerWidth >= 1200 ? 'desktop' : window.innerWidth >= 768 ? 'tablet' : 'mobile'

export default function PageEffect() {
  const outerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const cold = useRef(true)

  const leave = useCallback((done) => {
    const outer = outerRef.current
    const inner = outer && outer.firstElementChild
    if (!outer || !inner) {
      done()
      return
    }
    const bp = breakpoint()
    const tl = gsap.timeline()
    tl.fromTo(
      outer,
      { '--size': '0px', opacity: 1, pointerEvents: 'auto' },
      {
        '--size': 2.6 * Math.max(window.innerHeight, window.innerWidth) + 'px',
        duration: 0.8,
        ease: 'power3.inOut',
        onStart: () => outer.classList.add('PageEffect_isMasking__jp6mb'),
        onComplete: () => outer.classList.remove('PageEffect_isMasking__jp6mb'),
      }
    )
    tl.fromTo(
      inner,
      { clipPath: LEAVE_FROM[bp] },
      { clipPath: LEAVE_TO[bp], duration: 1, ease: 'power3.inOut', onComplete: done }
    )
  }, [])

  // Arrive.
  useEffect(() => {
    if (cold.current) {
      cold.current = false
      return
    }
    const outer = outerRef.current
    const inner = outer && outer.firstElementChild
    if (!outer || !inner) return
    const seq = breakpoint() === 'desktop' ? ENTER.desktop : ENTER.other
    gsap.fromTo(
      inner,
      { clipPath: seq.from },
      {
        clipPath: seq.to,
        duration: 1.2,
        ease: 'power3.inOut',
        clearProps: 'clipPath',
        onComplete: () => gsap.set(outer, { pointerEvents: 'none', opacity: 0 }),
      }
    )
  }, [location.pathname])

  // Leave.
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }
      const link = e.target.closest && e.target.closest('a[href]')
      if (!link || link.target === '_blank') return
      const href = link.getAttribute('href')
      if (!href || !href.startsWith('/')) return
      // A link to the page you are already on: swallow it. Without this the
      // browser followed the plain <a> the footer and the homepage cards use —
      // no Router handler bails on those — and reloaded the whole document to
      // arrive back where it started.
      if (href === location.pathname) {
        e.preventDefault()
        return
      }
      e.preventDefault()
      leave(() => navigate(href))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [leave, navigate, location.pathname])

  return (
    <div className="PageEffect_transition___7lnX PageEffect_maskClip__mlGl_ css-1mzjnuc" ref={outerRef}>
      <div className="PageEffect_transition__inner__ybluL css-1mzjnuc" />
    </div>
  )
}
