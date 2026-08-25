import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * The custom cursor (spec 5).
 *
 * This one is not in the HTTrack mirror: it mounts lazily on the live site,
 * behind the same idle callback as the WebGL reel, and the capture never got
 * that chunk — which is why `:8082` has the CSS for it but no element. Markup
 * and rules came from https://iventions.com/ directly.
 *
 * Two shells, both following the same smoothed pointer: a small white disc that
 * says PLAY / PAUSE over the film, and an 18rem yellow disc that says Next /
 * Previous over the venue slider. The native cursor is left visible — the
 * original never hides it.
 *
 * Anything can raise one by dispatching `rotary:cursor` with a detail of
 * 'play' | 'pause' | 'slide-control' | 'default'.
 */

const SHOW = 'Play_show__s52Nf'
const SHOW_PLAY = 'Play_show__play__I5ZPK'
const SHOW_PAUSE = 'Play_show__pause__5XO2_'

export default function CustomCursor() {
  const playRef = useRef(null)
  const slideRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const playShell = playRef.current
    const slideShell = slideRef.current
    if (!playShell || !slideShell) return

    const playInner = playShell.firstElementChild
    const circle = slideShell.querySelector('button')
    const stack = slideShell.querySelector('.css-16agjqd > *')

    // 5a — the pointer is eased before anything reads it. `relX` stays raw:
    // which half of the screen you are on is not something to lag behind.
    const smooth = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const qx = gsap.quickTo(smooth, 'x', { duration: 0.5, ease: 'power3' })
    const qy = gsap.quickTo(smooth, 'y', { duration: 0.5, ease: 'power3' })
    // Starts unknown rather than false, so the very first pointer move applies
    // a zone instead of comparing against a guess and doing nothing.
    let appliedZone = null

    const setters = [playShell, slideShell].map((el) => ({
      el,
      x: gsap.quickSetter(el, 'x', 'px'),
      y: gsap.quickSetter(el, 'y', 'px'),
    }))

    // 5b — each shell centres itself on the smoothed pointer.
    const place = () => {
      for (const s of setters) {
        const b = s.el.getBoundingClientRect()
        s.x(smooth.x - b.width / 2)
        s.y(smooth.y - b.height / 2)
      }
    }
    gsap.ticker.add(place)

    const onMove = (e) => {
      qx(e.clientX)
      qy(e.clientY)
      // 5c — Next and Previous are one stack; which one shows is the zone.
      const leftZone = e.clientX < window.innerWidth / 2
      if (appliedZone !== leftZone && stack) {
        appliedZone = leftZone
        gsap.to(stack, { yPercent: leftZone ? -100 : 0, duration: 0.8, ease: 'power3.out', overwrite: 'auto' })
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    if (circle) gsap.set(circle, { scale: 0 })

    const onType = (e) => {
      const type = e.detail || 'default'
      if (circle) {
        gsap.to(circle, {
          scale: type === 'slide-control' ? 1 : 0,
          duration: 0.8,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      }
      // 5d — every state of this one is a CSS transition off a class.
      if (playInner) {
        playInner.classList.toggle(SHOW, type === 'play' || type === 'pause')
        playInner.classList.toggle(SHOW_PLAY, type === 'play')
        playInner.classList.toggle(SHOW_PAUSE, type === 'pause')
      }
    }
    window.addEventListener('rotary:cursor', onType)

    return () => {
      gsap.ticker.remove(place)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('rotary:cursor', onType)
    }
  }, [])

  return (
    <>
      <div className="CsCursor_cursor__xtq78 css-1dffeah" ref={playRef}>
        <div className="Play_cursor__f_Ajo">
          <div className="css-79elbk">
            <div className="Play_iconWrapper__ulVDt css-8sx2u7">
              <img
                alt="play"
                loading="lazy"
                width="12"
                height="12"
                decoding="async"
                className="Play_icon__5Z81R Play_icon__play__cHJJ1"
                src="/icons/ic_play.svg"
              />
              <img
                alt="pause"
                loading="lazy"
                width="12"
                height="12"
                decoding="async"
                className="Play_icon__5Z81R Play_icon__pause__Ir4Id"
                src="/icons/ic_pause.svg"
              />
            </div>
            <div className="css-nuzpxm">
              <div className="Play_content__9tv28 css-cg84vn">
                <div className="Play_text__F4reF css-l6ct9h">
                  <p className="css-dzqf7j">PLAY</p>
                  <p className="css-abnjoa">PAUSE</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="CsCursor_cursor__xtq78 css-1dffeah" ref={slideRef}>
        <div className="css-1x5bobx">
          <button type="button" className="css-1h2oj20" tabIndex={-1} aria-hidden="true">
            <div className="css-16agjqd">
              <div className="css-l6ct9h">
                <p className="css-0">Next</p>
                <p className="css-19d460d">Previous</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
