import { useEffect, useRef, useState } from 'react'

import * as F from '../data/registration-form'
import '../styles/register.css'
import '../styles/admin.css'

/**
 * The registration team's screen: who has registered, offline registration, and
 * the reports. Everything comes from the registration backend; it needs the
 * team's sign-in.
 */
const { api } = F
const done = (r) => !!r && (r.status === 'paid' || r.status === 'offline')
const status = (m) => {
  const r = m.registration
  if (done(r)) return { state: 'Registered', type: r.summary.type, ref: r.regNo }
  return { state: m.opened || r ? 'Opened' : 'Not opened', type: '' }
}
const details = (m) => (done(m.registration) && m.registration.summary) || null
// members.js stores photos relative to the old HTML pages; the site serves them from /media.
const pic = (p) => p && p.replace(/^.*?\/public(?=\/)/, '')

export default function AdminPage() {
  const [members, setMembers] = useState(null) // null while loading, false when nobody is signed in
  const [failed, setFailed] = useState('')
  const [toast, setToast] = useState('')
  const timer = useRef()
  const say = (text) => { setToast(text); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 2400) }
  const [cats, setCats] = useState([])
  const load = () => Promise.all([api('/admin/members'), api('/admin/categories')])
    .then(([m, c]) => { setMembers(m); setCats(c) })
    .catch((e) => (e.status === 401 ? setMembers(false) : setFailed(e.message)))
  useEffect(() => { load() }, [])
  const setCategory = async (token, category) => {
    try {
      await api(`/admin/members/${token}/category`, { method: 'PUT', body: { category } })
      setMembers((list) => list.map((m) => (m.token === token ? { ...m, category } : m)))
    } catch (x) { say(x.message) }
  }

  return (
    <div className="rf">
      <main className="wrap">
        {failed && <p className="lede">{failed}</p>}
        {!failed && members === null && <p className="lede">Loading registrations…</p>}
        {members === false && <SignIn done={load} />}
        {members && <Admin members={members} cats={cats} setCategory={setCategory} say={say} />}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

export function SignIn({ done: signedIn }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    try { await api('/admin/login', { method: 'POST', body: { username: u.trim(), password: p } }); signedIn() }
    catch (x) { setErr(x.status === 401 ? "That username and password don't match." : x.status === 429 ? 'Too many tries. Wait a minute and try again.' : x.message) }
  }
  return (
    <form onSubmit={submit} noValidate style={{ maxWidth: 420, width: '100%', margin: '40px auto', display: 'grid', gap: 14, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 20, padding: 28 }}>
      <h1 className="h1" style={{ fontSize: 28 }}>Registration team sign-in</h1>
      <label className="field"><span>Username</span><input className="input" name="u" autoComplete="username" autoFocus value={u} onChange={(e) => setU(e.target.value)} required /></label>
      <label className="field"><span>Password</span><input className="input" name="p" type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required /><span className="err">{err}</span></label>
      <button type="submit" className="btn btn--sun">Sign in</button>
    </form>
  )
}

const VIEWS = [['regView', 'Registrations'], ['offView', 'Offline registration'], ['repView', 'Reports']]

function Admin({ members, cats, setCategory, say }) {
  const [view, setView] = useState(location.hash === '#offline' ? 'offView' : 'regView')
  const all = members.map((m) => ({ ...m, st: status(m) }))

  const signOut = async () => { await api('/admin/logout', { method: 'POST' }); location.reload() }
  return (
    <>
      <div className="intro" style={{ display: 'grid', gap: 10 }}><span className="eyebrow">Registration team</span><h1 className="h1">Who has registered, and who to remind</h1>
        <p className="lede">Every invited member, their status, and one button to nudge everyone who hasn't finished.</p></div>

      <div className="views" role="tablist" aria-label="Admin views">
        {VIEWS.map(([v, name]) => <button type="button" role="tab" key={v} aria-selected={view === v} onClick={() => setView(v)}>{name}</button>)}
      </div>

      {view === 'regView' && <Registrations all={all} cats={cats} setCategory={setCategory} say={say} />}
      {view === 'offView' && <Offline all={all} say={say} />}
      {view === 'repView' && <Reports members={members} cats={cats} />}

      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>Members are the committee list from the website. <a href="/invite" style={{ color: 'var(--azure)' }}>Preview the invite</a> · <button type="button" className="signout" onClick={signOut} style={{ font: 'inherit', color: 'var(--azure)', background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>Sign out</button></p>
    </>
  )
}

const CLS = { Registered: 's-reg', Opened: 's-open', 'Not opened': 's-not' }

// A member's category, or '' when the team hasn't set one. The filters use '-' for "Not set".
const inCat = (m, cat) => !cat || (cat === '-' ? !m.category : m.category === cat)
const CatOptions = ({ cats, all }) => (
  <><option value="">{all}</option>{cats.map((c) => <option key={c}>{c}</option>)}<option value="-">Not set</option></>
)

function Registrations({ all, cats, setCategory, say }) {
  const [filter, setFilter] = useState('All')
  const [q, setQ] = useState('')
  const [fd, setFd] = useState('')
  const [cat, setCat] = useState('')
  const by = (s) => all.filter((m) => m.st.state === s)
  const reg = by('Registered')
  const people = reg.reduce((n, m) => n + (m.st.type === 'Couple' ? 2 : 1), 0)
  const counts = { All: all.length, Registered: reg.length, Opened: by('Opened').length, 'Not opened': by('Not opened').length }
  const ds = [...new Set(all.map((m) => m.committee))]
  const qq = q.trim().toLowerCase()
  const shown = all.filter((m) => (filter === 'All' || m.st.state === filter) && (!fd || m.committee === fd) && inCat(m, cat) && (!qq || (m.name + m.roles.join()).toLowerCase().includes(qq)))
  const pending = shown.filter((m) => m.st.state !== 'Registered').length

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="tiles">
        <div className="tile"><small>Invited</small><b>{all.length}</b><span>personal links sent</span></div>
        <div className="tile reg"><small>Registered</small><b>{reg.length}</b><span>{people} people with spouses</span></div>
        <div className="tile open"><small>Opened, not finished</small><b>{counts.Opened}</b><span>started but not paid</span></div>
        <div className="tile"><small>Not opened</small><b>{counts['Not opened']}</b><span>haven't clicked yet</span></div>
      </div>

      <div className="tools">
        <div className="filters" role="group" aria-label="Filter by status">
          {Object.keys(counts).map((k) => <button type="button" key={k} aria-pressed={k === filter} onClick={() => setFilter(k)}>{k} · {counts[k]}</button>)}
        </div>
        <div className="search">
          <label className="u-hide" htmlFor="q">Search</label><input className="input" id="q" placeholder="Search name or role" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="u-hide" htmlFor="fd">Committee</label>
          <select className="select" id="fd" value={fd} onChange={(e) => setFd(e.target.value)}><option value="">All committees</option>{ds.map((d) => <option key={d}>{d}</option>)}</select>
          <label className="u-hide" htmlFor="fc">Category</label>
          <select className="select" id="fc" value={cat} onChange={(e) => setCat(e.target.value)}><CatOptions cats={cats} all="All categories" /></select>
          <button type="button" className="btn btn--sun" disabled={!pending} onClick={() => say(`Reminder sent to ${pending} members on WhatsApp and email (sample)`)}>{pending ? `Remind ${pending} not registered` : 'Nobody to remind'}</button>
        </div>
      </div>

      <div className="list"><table>
        <thead><tr><th>Member</th><th>Committee</th><th>Category</th><th>Status</th><th>District</th><th>Actions</th></tr></thead>
        <tbody>
          {shown.length ? shown.map((m) => (
            <tr key={m.token}>
              <td><b>{m.name}</b><small>{m.roles.join(' · ')}</small></td>
              <td data-l="">{m.committee}</td>
              <td data-l="Category "><select className="select cat" aria-label={`Category for ${m.name}`} value={m.category || ''} onChange={(e) => setCategory(m.token, e.target.value)}>
                <option value="">Not set</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></td>
              <td><span className={'chip-s ' + CLS[m.st.state]}>{m.st.state}{m.st.type ? ' · ' + m.st.type : ''}</span>{m.st.ref && <><br /><small>{m.st.ref}</small></>}</td>
              <td data-l="District ">{(details(m) || {}).district || m.district || '–'}</td>
              <td><div className="acts">{m.st.state === 'Registered'
                ? <><a href={`/register/${m.token}?admin`}>View ticket</a><button type="button" onClick={() => say(`Ticket resent to ${m.name}`)}>Resend ticket</button></>
                : <><button type="button" onClick={() => say(`Link resent to ${m.name} on WhatsApp and email`)}>Resend link</button><a href={`/register/${m.token}?offline`}>Register offline</a></>}
              </div></td>
            </tr>
          )) : <tr><td colSpan="6" className="empty">Nobody matches this filter.</td></tr>}
        </tbody>
      </table></div>
    </div>
  )
}

// The team fills the member's own form for them and records how they paid.
function Offline({ all, say }) {
  const [q, setQ] = useState('')
  const label = (m) => `${m.name} · ${m.role}, ${m.committee}`
  const open = all.filter((m) => m.st.state !== 'Registered')
  const offline = all.map((m) => ({ m, r: details(m) })).filter((x) => x.r && x.r.by === 'Offline')
  const m = all.find((x) => label(x) === q || x.name.toLowerCase() === q.trim().toLowerCase())
  const taken = m && m.st.state === 'Registered'
  const ok = m && !taken

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="panel">
        <h2>Register a member offline</h2>
        <ol className="how"><li>Find the member who sent their details by phone, on paper or at the desk.</li><li>Fill their form for them. What the committee sheet has is already filled in.</li><li>Record how they paid: cash, cheque, bank transfer or UPI at the desk.</li></ol>
        <div className="off-find">
          <label className="field"><span>Member</span><input className="input" id="offQ" list="offList" placeholder="Type a name" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
            <datalist id="offList">{open.map((x) => <option key={x.token} value={label(x)} />)}</datalist>
            <span className="err">{taken ? 'Already registered. See their ticket on the Registrations list.' : ''}</span></label>
          <a className="btn btn--sun" href={ok ? `/register/${m.token}?offline` : '#'} aria-disabled={!ok} onClick={(e) => { if (!ok) { e.preventDefault(); say('Pick a member from the list first') } }}>Open their form</a>
        </div>
        {m && (
          <div className="off-pick">
            {m.photo ? <img src={pic(m.photo)} alt="" width="52" height="52" /> : <i>{F.initials(m.name)}</i>}
            <div><b>{m.name}</b><small>{m.roles.join(' · ')}{m.district ? ' · District ' + m.district : ''}</small><br /><small>{[m.mobile, m.email].filter(Boolean).join(' · ') || 'No contact details in the committee sheet'}</small></div>
          </div>
        )}
      </section>
      <div className="rt"><h3>Registered offline <small>{offline.length} so far</small></h3><div className="scroll"><table>
        <thead><tr><th>Ref</th><th>Member</th><th>Type</th><th>Payment</th><th>Cheque / UTR no.</th><th className="n">Amount (₹)</th><th>Recorded</th><th></th></tr></thead>
        <tbody>{offline.length ? offline.map(({ m: x, r }) => (
          <tr key={x.token}><td>{x.st.ref}</td><td>{x.name}</td><td>{r.type}</td><td>{r.payment.mode}</td><td>{r.payment.refNo || '–'}</td><td className="n">{r.payment.amount || '–'}</td><td>{r.paid}</td><td><a href={`/register/${x.token}?admin`}>View ticket</a></td></tr>
        )) : <tr><td colSpan="8" className="muted">Nobody registered offline yet</td></tr>}</tbody>
      </table></div></div>
    </div>
  )
}

// ---- Reports: built from what each registered member chose.
const NIGHTS = ['22', '23', '24', '25', '26', '27', '28'] // a night is the date you sleep there; check-out 29 is the last morning
const nightsOf = (r) => NIGHTS.filter((d) => r.in.slice(8) <= d && d < r.out.slice(8))
const short = (h) => F.hotelName(h).replace(/ Resort.*| Goa.*/, '')
const dash = (v) => v || '–'
const sum = (rows, i) => rows.reduce((a, r) => a + r[i], 0)

// Each report builds tables: { title, sub, head, rows, foot, num: [number columns], wrap: [...], heat }
function reports(members, cats) {
  const regs = members.map((m) => { const r = details(m); return { m: r ? { ...m, district: r.district || m.district } : m, r, st: status(m) } }).filter((x) => x.r)
  const people = regs.flatMap(({ m, r }) => [
    { who: m.name, badge: r.call, collar: r.collar, food: r.food, trf: r.trf, kind: 'Member', m, r },
    ...(r.spouse ? [{ who: r.spouse.name, badge: r.spouse.call, collar: r.spouse.collar, food: r.spouse.food, trf: r.sTrf, kind: 'Spouse', m, r }] : []),
  ])
  const count = (key, values) => values.map((v) => [v, people.filter((p) => p.kind === 'Member' && p[key] === v).length, people.filter((p) => p.kind === 'Spouse' && p[key] === v).length])
  const totals = (rows) => ['Total', ...[1, 2, 3].map((i) => sum(rows, i))]

  return {
    hotel: { name: 'Hotel-wise', sub: 'Rooms and guests at each hotel, and rooms needed each night for the room block.', build: () => {
      const byNight = F.hotels.map((h) => {
        const g = regs.filter((x) => x.r.hotel === h.id)
        return [h.name, g.length, g.reduce((a, x) => a + (x.r.spouse ? 2 : 1), 0), g.reduce((a, x) => a + nightsOf(x.r).length, 0), ...NIGHTS.map((d) => g.filter((x) => nightsOf(x.r).includes(d)).length)]
      })
      const lists = F.hotels.map((h) => {
        const g = regs.filter((x) => x.r.hotel === h.id).sort((a, b) => a.r.in.localeCompare(b.r.in))
        return { title: h.name, sub: `${g.length} room${g.length === 1 ? '' : 's'}`, head: ['Guest', 'With', 'District', 'Room', 'Check-in', 'Check-out', 'Nights', 'Ref'], num: [6],
          rows: g.length ? g.map(({ m, r, st }) => [m.name, r.spouse ? r.spouse.name : '–', m.district, r.spouse ? 'Double' : 'Single', F.day(r.in), F.day(r.out), nightsOf(r).length, st.ref]) : [['No rooms yet', '', '', '', '', '', '', '']] }
      })
      return [{ title: 'Rooms per night', sub: 'Night of each date', head: ['Hotel', 'Rooms', 'Guests', 'Room nights', ...NIGHTS.map((d) => d + ' Nov')], rows: byNight,
        foot: byNight[0].map((_, i) => (i ? sum(byNight, i) : 'All hotels')), num: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], heat: true }, ...lists]
    } },
    member: { name: 'Member-wise', sub: 'One row per registration with every answer. The full sheet for the registration desk.', build: () => [{
      title: 'All registrations', sub: `${regs.length} registered`, head: ['Ref', 'Member', 'Committee role', 'District', 'Mobile', 'Email', 'Type', 'Spouse / partner', 'Badge', 'Collar', 'Food', 'Programmes', 'TRF Dinner', 'Hotel', 'Check-in', 'Check-out', 'Nights', 'GST invoice', 'Paid', 'Via', 'Payment'], num: [16], wrap: [2, 11],
      rows: regs.map(({ m, r, st }) => [st.ref, m.name, m.roles.join('; '), m.district, r.mobile, r.email, r.type, r.spouse ? r.spouse.name : '–', r.call + (r.spouse && r.spouse.call ? ' & ' + r.spouse.call : ''), dash(r.collar) + (r.spouse ? ' / ' + dash(r.spouse.collar) : ''), r.food + (r.spouse ? ' / ' + r.spouse.food : ''), r.progs.join(', '), dash(r.trf) + (r.spouse ? ' / ' + dash(r.sTrf) : ''), short(r.hotel), F.day(r.in), F.day(r.out), nightsOf(r).length, r.gst, dash(r.paid), r.by || 'Own link', r.payment ? [r.payment.mode, r.payment.refNo, r.payment.amount && '₹' + r.payment.amount].filter(Boolean).join(' · ') : 'Online']),
    }] },
    category: { name: 'Category-wise', sub: 'VIPs, DGs, DGEs and the rest: how each category is doing, with people and room nights.', build: () => {
      const rows = [...cats, ''].map((c) => {
        const g = members.filter((m) => (m.category || '') === c)
        const st = g.map((m) => status(m).state)
        const R = regs.filter((x) => (x.m.category || '') === c)
        return [c || 'Not set', g.length, st.filter((s) => s === 'Registered').length, st.filter((s) => s === 'Opened').length, st.filter((s) => s === 'Not opened').length, R.reduce((a, x) => a + (x.r.spouse ? 2 : 1), 0), R.reduce((a, x) => a + nightsOf(x.r).length, 0)]
      }).filter((r) => r[1])
      return [{ title: 'By category', head: ['Category', 'Invited', 'Registered', 'Opened, not finished', 'Not opened', 'People', 'Room nights'], rows, foot: rows.length ? rows[0].map((_, i) => (i ? sum(rows, i) : 'Total')) : null, num: [1, 2, 3, 4, 5, 6] }]
    } },
    committee: { name: 'Committee-wise', sub: 'How each committee is doing, with people and room nights.', build: () => {
      const rows = [...new Set(members.map((m) => m.committee))].map((d) => {
        const st = members.filter((m) => m.committee === d).map((m) => status(m).state)
        const R = regs.filter((x) => x.m.committee === d)
        return [d, st.length, st.filter((s) => s === 'Registered').length, st.filter((s) => s === 'Opened').length, st.filter((s) => s === 'Not opened').length, R.reduce((a, x) => a + (x.r.spouse ? 2 : 1), 0), R.reduce((a, x) => a + nightsOf(x.r).length, 0)]
      })
      return [{ title: 'By committee', head: ['Committee', 'Invited', 'Registered', 'Opened, not finished', 'Not opened', 'People', 'Room nights'], rows, foot: rows[0].map((_, i) => (i ? sum(rows, i) : 'Total')), num: [1, 2, 3, 4, 5, 6] }]
    } },
    district: { name: 'District-wise', sub: 'Registrations by the district each member gave.', build: () => {
      const rows = [...new Set(regs.map((x) => x.m.district))].sort().map((d) => { const g = regs.filter((x) => x.m.district === d); return ['District ' + d, g.length, g.reduce((a, x) => a + (x.r.spouse ? 2 : 1), 0), g.reduce((a, x) => a + nightsOf(x.r).length, 0)] })
      return [{ title: 'By district', head: ['District', 'Registered', 'People', 'Room nights'], rows, foot: rows.length ? totals(rows) : null, num: [1, 2, 3] }]
    } },
    food: { name: 'Food', sub: 'Meal counts for the caterer, members and spouses together.', build: () => {
      const rows = count('food', F.food).map(([v, a, b]) => [v, a, b, a + b])
      return [{ title: 'Food preference', head: ['Preference', 'Members', 'Spouses', 'Total'], rows, foot: totals(rows), num: [1, 2, 3] },
        { title: 'Jain and no-meal guests', sub: 'Names the kitchen asks for', head: ['Name', 'Member / spouse', 'Preference', 'Hotel'], rows: people.filter((p) => p.food === 'Jain' || p.food === 'None').map((p) => [p.who, p.kind, p.food, short(p.r.hotel)]) }]
    } },
    kit: { name: 'Kit & badges', sub: 'Collar sizes for the kit order and the badge print list.', build: () => {
      const rows = count('collar', [...F.collar, '']).map(([v, a, b]) => [v || 'Not given', a, b, a + b]).filter((r) => r[3])
      return [{ title: 'Collar sizes', head: ['Size', 'Members', 'Spouses', 'Total'], rows, foot: totals(rows), num: [1, 2, 3] },
        { title: 'Badge print list', sub: `${people.length} badges`, head: ['Badge name', 'Full name', 'Member / spouse', 'District'], rows: people.map((p) => [dash(p.badge), p.who, p.kind, p.m.district]) }]
    } },
    trf: { name: 'TRF Dinner', sub: '25 Nov · 7.00 pm. Who is coming and what they eat.', build: () => {
      const yes = people.filter((p) => p.trf === 'Yes')
      return [{ title: 'Summary', head: ['', 'Members', 'Spouses', 'Total'], rows: [['Yes', 'Attending'], ['No', 'Not attending'], ['', 'Not asked']].map(([v, l]) => [l, people.filter((p) => p.kind === 'Member' && p.trf === v).length, people.filter((p) => p.kind === 'Spouse' && p.trf === v).length, people.filter((p) => p.trf === v).length]).filter((r) => r[3]), num: [1, 2, 3] },
        { title: 'Guest list', sub: `${yes.length} attending`, head: ['Name', 'Member / spouse', 'District', 'Food'], rows: yes.map((p) => [p.who, p.kind, p.m.district, p.food]) }]
    } },
    prog: { name: 'Programmes', sub: 'Head counts for each programme and seminar room.', build: () => {
      const names = [...new Set(regs.flatMap((x) => x.r.progs))]
      return [{ title: 'Members per programme', head: ['Programme', 'Members', 'With spouse'], rows: names.map((n) => { const g = regs.filter((x) => x.r.progs.includes(n)); return [n, g.length, g.filter((x) => x.r.spouse).length] }), num: [1, 2] },
        ...names.filter((n) => n !== 'Institute').map((n) => ({ title: n, head: ['Member', 'Committee role', 'District'], rows: regs.filter((x) => x.r.progs.includes(n)).map(({ m }) => [m.name, m.roles[0], m.district]) }))]
    } },
  }
}

function Reports({ members, cats }) {
  const [rep, setRep] = useState('hotel')
  const [cat, setCat] = useState('')
  // The category filter narrows every report to those members; the Category-wise report always shows them all.
  const R = reports(rep === 'category' ? members : members.filter((m) => inCat(m, cat)), cats)
  const built = R[rep].build()

  // CSV opens straight in Excel; the BOM keeps the ₹ and – characters intact.
  const csv = () => {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const text = built.map((t) => [[t.title], t.head, ...t.rows, ...(t.foot ? [t.foot] : [])].map((r) => r.map(q).join(',')).join('\r\n')).join('\r\n\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' }))
    a.download = `ri27-${R[rep].name.toLowerCase().replace(/[^a-z]+/g, '-')}${cat && rep !== 'category' ? '-' + (cat === '-' ? 'not-set' : cat).toLowerCase().replace(/[^a-z]+/g, '-') : ''}-report.csv`
    a.click(); URL.revokeObjectURL(a.href)
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="rtabs" role="tablist" aria-label="Reports">
        {Object.entries(R).map(([k, v]) => <button type="button" role="tab" key={k} aria-selected={k === rep} onClick={() => setRep(k)}>{v.name}</button>)}
      </div>
      <div className="rhead"><div><h2>{R[rep].name} report{cat && rep !== 'category' ? ` · ${cat === '-' ? 'Category not set' : cat}` : ''}</h2><p>{R[rep].sub}</p></div>
        <div>{rep !== 'category' && <><label className="u-hide" htmlFor="rc">Category</label>
          <select className="select rcat" id="rc" value={cat} onChange={(e) => setCat(e.target.value)}><CatOptions cats={cats} all="All categories" /></select></>}
          <button type="button" className="btn btn--line" onClick={csv}>Download Excel (CSV)</button><button type="button" className="btn btn--line" onClick={() => window.print()}>Print</button></div></div>
      <div style={{ display: 'grid', gap: 22 }}>{built.map((t) => <Table key={t.title} t={t} />)}</div>
      <p className="rnote">Reports count registered members only. Spouses are counted as their own guest, meal and kit.</p>
    </div>
  )
}

function Table({ t }) {
  const cls = (v, i, body) => [(t.num || []).includes(i) && 'n', (t.wrap || []).includes(i) && 'wrap', body && t.heat && i > 3 && (v ? 'heat' : 'zero')].filter(Boolean).join(' ') || undefined
  return (
    <section className="rt"><h3>{t.title}{t.sub && <> <small>{t.sub}</small></>}</h3><div className="scroll"><table>
      <thead><tr>{t.head.map((h, i) => <th key={i} className={cls(h, i)}>{h}</th>)}</tr></thead>
      <tbody>{t.rows.length ? t.rows.map((r, j) => <tr key={j}>{r.map((v, i) => <td key={i} className={cls(v, i, true)}>{v}</td>)}</tr>)
        : <tr><td colSpan={t.head.length} className="muted">Nobody yet</td></tr>}</tbody>
      {t.foot && <tfoot><tr>{t.foot.map((v, i) => <td key={i} className={cls(v, i)}>{v}</td>)}</tr></tfoot>}
    </table></div></section>
  )
}
