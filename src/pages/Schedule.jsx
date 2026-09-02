import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import PageHero from '../components/PageHero'
import { scheduleComponents } from '../data/site'

/**
 * The programme, one component at a time.
 *
 * It used to be stacked down a single column: the Institute, the two governors'
 * seminars and the adjunct seminars, one after another, so reading the Sunday
 * of the Institute meant scrolling past a component you were not looking for.
 * They are alternatives — a delegate is registered for one or two of them, not
 * for the list — so they are tabs, and the page opens on the Institute.
 *
 * The day and slot rows underneath are unchanged; only what surrounds them is
 * new. Nothing here is a new fact: the tab carries the number and a short
 * label, and the panel repeats the full name and dates in the type the stacked
 * list used — all of it out of `scheduleComponents`, which is the three
 * programme components plus the TRF events folded into the same shape.
 *
 * The four cards on the homepage, the GELS page and the adjunct seminars page
 * all link to /schedule#<component>. Those used to land on a heading; with one
 * panel visible at a time the hash has to pick the tab instead, which is what
 * the effect below does. The tab keeps the component's own id so Layout's
 * hash-scroll still finds an element to bring into view.
 */
export default function Schedule() {
  const { hash } = useLocation()
  const [active, setActive] = useState(scheduleComponents[0].id)
  const tabs = useRef([])

  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1))
    if (scheduleComponents.some((c) => c.id === id)) setActive(id)
  }, [hash])

  const index = Math.max(0, scheduleComponents.findIndex((c) => c.id === active))
  const current = scheduleComponents[index]

  // Arrow keys move along the row and select as they go, which is the expected
  // behaviour for a tablist whose panels are already loaded.
  const onKeyDown = useCallback(
    (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (!step) return
      e.preventDefault()
      const next = (index + step + scheduleComponents.length) % scheduleComponents.length
      setActive(scheduleComponents[next].id)
      const el = tabs.current[next]
      if (el) el.focus()
    },
    [index]
  )

  return (
    <>
      <PageHero title="Program schedule" />

      <section className="section sched">
        <p className="section__label">Program</p>

        <div className="sched__tabs" role="tablist" aria-label="Programme">
          {scheduleComponents.map((c, i) => {
            const on = c.id === current.id
            return (
              <button
                key={c.id}
                id={c.id}
                type="button"
                role="tab"
                className={on ? 'sched-tab is-active' : 'sched-tab'}
                aria-selected={on}
                aria-controls={`${c.id}-panel`}
                tabIndex={on ? 0 : -1}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                onClick={() => setActive(c.id)}
                onKeyDown={onKeyDown}
              >
                {/* Drawn in on the active tab rather than a border that jumps
                    between them — the same gold rule the registration cards
                    use, so the two blocks read as one site. */}
                <span className="sched-tab__rule" aria-hidden="true" />
                <span className="sched-tab__number">{c.number}</span>
                <span className="sched-tab__label">{c.short}</span>
                <span className="sched-tab__dates">{c.dates}</span>
              </button>
            )
          })}
        </div>

        {/* Keyed on the component so React replaces the panel instead of
            patching it, which is what replays the arrival. */}
        <div
          className="sched__panel"
          key={current.id}
          id={`${current.id}-panel`}
          role="tabpanel"
          aria-labelledby={current.id}
          tabIndex={-1}
        >
          {/* The full name against its dates — the tab only has room for the
              short label. */}
          <div className="sched__head">
            <h2 className="sched__name">{current.name}</h2>
            <p className="sched__dates">{current.dates}</p>
          </div>

          <div className="sched__days">
            {current.days.map((d) => (
              <div className="day" key={d.day}>
                <p className="day__date">
                  {d.day} November
                  <span className="day__weekday">{d.weekday}</span>
                </p>
                <div>
                  {d.slots.map((s) => (
                    <div className="slot" key={s.name}>
                      {s.time ? <p className="slot__time">{s.time}</p> : null}
                      <p className="slot__name">{s.name}</p>
                      {s.note ? <p className="slot__note">{s.note}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
