import { useEffect } from 'react'

import CommitteeStrip from '../components/CommitteeStrip'
import HomeMarkup from './HomeMarkup'
import useHomeMotion from '../motion/useHomeMotion'

/**
 * The homepage, carried over from the captured build: its own markup (converted
 * to JSX in HomeMarkup) and its own styles (home-extracted.css, which is the
 * inline CSS the capture had scattered through the DOM).
 *
 * The motion is re-authored on top of it — see src/motion/useHomeMotion.
 */
export default function Home() {
  const root = useHomeMotion()

  // The captured hero has no link or button of its own — the original never
  // needed one. It goes inside the <h1>, not beside it: the hero lockup is a
  // flex row and a fourth child there re-divides it, pushing the date and venue
  // under the video card.
  useEffect(() => {
    const h1 = root.current && root.current.querySelector('h1')
    if (!h1 || h1.querySelector('.rotary-register')) return
    const a = document.createElement('a')
    a.className = 'rotary-register'
    a.href = 'mailto:hello@rotaryinstitute2027goa.org'
    a.textContent = 'Register'
    h1.appendChild(a)
    return () => a.remove()
  }, [root])

  return (
    <div ref={root} className="home">
      <HomeMarkup />
      <CommitteeStrip />
    </div>
  )
}
