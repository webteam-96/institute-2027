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

  return (
    <div ref={root} className="home">
      <HomeMarkup />
      <CommitteeStrip />
    </div>
  )
}
