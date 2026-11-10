import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import * as F from '../data/registration-form'
import '../styles/register.css'

/**
 * A committee member's own registration form, opened from their personal link:
 * /register/<link code>. Everything is saved to and checked by the registration
 * backend (registration-api); in development Vite passes /api through to it.
 *
 * ?admin    the registration team looking at it (doesn't count as the member opening it)
 * ?offline  the team filling it in for the member and recording how they paid
 * ?pay=     set by the backend on the way back from Instamojo
 */
const ADMIN = '/admin'
const { api } = F

const done = (r) => !!r && (r.status === 'paid' || r.status === 'offline')

export default function RegisterPage() {
  const { token = '' } = useParams()
  const [qs] = useSearchParams()
  const offline = qs.has('offline')
  const peek = offline || qs.has('admin')
  const [load, setLoad] = useState({ state: 'loading' })
  const [toast, setToast] = useState('')
  const timer = useRef()
  const say = (text) => { setToast(text); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 2400) }

  useEffect(() => {
    let live = true
    api(`/m/${encodeURIComponent(token.toUpperCase())}${peek ? '?peek=1' : ''}`)
      .then((r) => live && setLoad({ state: 'ready', ...r }))
      .catch((e) => live && setLoad({ state: e.status === 404 ? 'bad' : 'error' }))
    return () => { live = false }
  }, [token, peek])

  return (
    <div className="rf">
      <div className="wrap">
        {load.state === 'loading' && <p className="lede">Opening your registration…</p>}
        {load.state === 'bad' && (
          <div className="bad-link"><span className="eyebrow">Link not recognised</span><h1 className="h1">We couldn't open your registration</h1>
            <p className="lede">The link may have been cut short when it was copied. Please open it again from your WhatsApp or email, or write to registration@rotaryinstitute2027goa.org and we'll send you a fresh one.</p></div>
        )}
        {load.state === 'error' && (
          <div className="bad-link"><span className="eyebrow">Couldn't load</span><h1 className="h1">We couldn't reach the registration desk</h1>
            <p className="lede">Please check your connection and open the link again in a minute.</p></div>
        )}
        {load.state === 'ready' && <Form m={load.member} reg={load.registration} prices={load.prices || {}} offline={offline} peek={peek} pay={qs.get('pay')} say={say} />}
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function Form({ m, reg, prices, offline, peek, pay, say }) {
  const [ticket, setTicket] = useState(done(reg) ? { r: reg, again: pay !== 'done' } : null)
  const [d, setD] = useState(() => {
    const v = Object.fromEntries([...F.fields.map((k) => [k, '']), ...F.boxes.map((k) => [k, false])])
    Object.assign(v, { mobile: m.mobile, email: m.email, mDistrict: m.district, call: m.first, in: '2027-11-25', out: '2027-11-29', gels: /Elect|Nominee/.test(m.role) })
    const draft = (reg && reg.draft) || {}
    for (const k of Object.keys(v)) if (draft[k] != null) v[k] = draft[k]
    return v
  })
  const [errs, setErrs] = useState({})
  const [sheet, setSheet] = useState(null)
  const [photo, setPhoto] = useState(m.photo && m.photo.replace(/^.*?\/public(?=\/)/, ''))

  const set = (k, v) => {
    setD((x) => ({ ...x, [k]: v }))
    setErrs((e) => { if (!e[k]) return e; const n = { ...e }; delete n[k]; return n })
  }

  // Save as you go, so the same link reopens where they left off. The team's offline edits are saved when they record the payment.
  const loaded = useRef(false)
  useEffect(() => {
    if (!loaded.current) { loaded.current = true; return }
    if (peek) return
    const t = setTimeout(() => api(`/m/${m.token}/draft`, { method: 'PUT', body: d }).catch(() => {}), 600)
    return () => clearTimeout(t)
  }, [d]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pay === 'failed' && !ticket) setTimeout(() => say("We couldn't confirm your payment. If money left your account it shows here within a few minutes; otherwise you can try again."), 400)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (ticket) return <Ticket m={m} {...ticket} peek={peek} />

  const couple = d.type === 'Couple'
  const probs = F.problems(d)
  const secs = [['sec-who', "Who's coming?"], ['sec-kit', 'Your badge and kit'], ['sec-att', "What you'll attend"], ['sec-stay', "Where you'll stay"], ['sec-inv', 'Your invoice']]
    .map(([id, name]) => ({ id, name, left: Object.keys(probs[id]).length }))
  const left = secs.reduce((a, s) => a + s.left, 0)
  const n = F.nights(d.in, d.out)
  const progs = ['Institute', d.gels && 'GELS & GNLS', d.adjOn && 'Adjunct: ' + (d.adj || 'seminar')].filter(Boolean)
  const amount = prices[d.type] > 0 ? <>₹{Number(prices[d.type]).toLocaleString('en-IN')}</> : <span className="tba">To be announced</span>
  const sec = (id) => secs.find((s) => s.id === id)

  const showErrors = (all) => {
    setErrs(all)
    const k = Object.keys(all)[0]
    const el = document.getElementById(k) || document.querySelector(`.rf input[name="${k}"]`)
    if (el) el.focus()
    say('Almost there. Just a few answers to go.')
  }
  const submit = (e) => {
    e.preventDefault()
    const all = Object.assign({}, ...Object.values(probs))
    if (Object.keys(all).length) return showErrors(all)
    setSheet(offline ? 'record' : 'pay')
  }

  // Plain functions, not components, so React keeps the same inputs (and focus) between renders.
  const err = (k) => <span className="err">{errs[k] || ''}</span>
  const text = (k, label, p = {}) => (
    <label className="field"><span>{label} <em>*</em></span>
      <input className={'input' + (errs[k] ? ' bad' : '')} id={k} value={d[k]} onChange={(e) => set(k, e.target.value)} required {...p} />{err(k)}</label>
  )
  const select = (k, label, list) => (
    <label className="field"><span>{label} <em>*</em></span>
      <select className={'select' + (errs[k] ? ' bad' : '')} id={k} value={d[k]} onChange={(e) => set(k, e.target.value)} required>
        <option value="">Select</option>{list.map((v) => <option key={v}>{v}</option>)}
      </select>{err(k)}</label>
  )
  const radio = (k, v) => ({ type: 'radio', name: k, value: v, checked: d[k] === v, onChange: () => set(k, v), required: true })
  const pills = (k, legend, list) => (
    <fieldset className="field"><legend>{legend}</legend>
      <div className="pills">{list.map(([v, label]) => <label className="pill" key={v}><input {...radio(k, v)} /><span>{label}</span></label>)}</div>{err(k)}</fieldset>
  )
  const head = (id, i) => {
    const s = sec(id)
    return <header><b>{i}</b><h2>{s.name}</h2><span className="st">{s.left ? `${s.left} left` : 'Done'}</span></header>
  }
  const qClass = (id) => 'q' + (sec(id).left ? '' : ' is-done')
  const jump = (e, id) => { e.preventDefault(); document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const bars = secs.map((s) => <i key={s.id} className={s.left ? '' : 'on'} />)
  const label = `${couple ? 'Couple' : 'Single'} registration + ${n} nights`

  return (
    <>
      {offline && <div className="offbar" style={{ marginBottom: 18 }}><span><b>Offline registration.</b> You're filling this in on behalf of {m.name}.</span><a href={ADMIN + '#offline'}>Back to admin</a></div>}
      <form className="grid" noValidate onSubmit={submit}>
        <div className="col">
          <section className="me" aria-label="Your details">
            <div className="ph" style={photo ? { backgroundImage: `url('${photo}')` } : undefined}>
              <span>{photo ? '' : F.initials(m.name)}</span>
              <label title="Change photo" aria-label="Change photo">✎<input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files && e.target.files[0]
                if (f) { const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(f) }
              }} /></label>
            </div>
            <div style={{ display: 'grid', gap: 6, minWidth: 0 }}><span className="known">✓ Filled in for you</span><h1>{m.name}</h1><span className="role">{m.role} · {m.committee}</span></div>
            <dl><div><dt>Committee role{m.roles.length > 1 ? 's' : ''}</dt>{m.roles.map((r) => <dd key={r}>{r}</dd>)}</div></dl>
            <p className="fix">Spotted a mistake? <button type="button" onClick={() => say('In the live form, this opens a short note to the registration team')}>Let us know</button></p>
          </section>

          <section className={qClass('sec-who')} id="sec-who">{head('sec-who', 1)}
            <div className="grid2">
              {text('mobile', 'Your mobile', { inputMode: 'tel', maxLength: 16, placeholder: '10-digit mobile' })}
              {text('email', 'Your email', { type: 'email' })}
              {text('mDistrict', 'District', { inputMode: 'numeric', maxLength: 4, placeholder: 'e.g. 3170' })}
            </div>
            <fieldset className="field"><legend className="u-hide">Registration type</legend><div className="seg">
              <label><input {...radio('type', 'Single')} /><b>Single registration</b><small>I'm coming on my own</small></label>
              <label><input {...radio('type', 'Couple')} /><b>Couple registration</b><small>We're coming together</small></label>
            </div>{err('type')}</fieldset>
            {couple && (
              <div className="sub">
                <span className="lbl">About your spouse / partner</span>
                <div className="grid2">
                  {text('sFirst', 'First name')}
                  {text('sLast', 'Last name')}
                  {text('sMobile', 'Mobile', { inputMode: 'tel', maxLength: 16, placeholder: '10-digit mobile' })}
                  {text('sEmail', 'Email', { type: 'email' })}
                  {text('sCall', 'Name on their badge', { maxLength: 20 })}
                  {select('sCollar', 'Their collar size', F.collar)}
                </div>
                {pills('sFood', 'What would they like to eat? *', F.food.map((f) => [f, f]))}
              </div>
            )}
          </section>

          <section className={qClass('sec-kit')} id="sec-kit">{head('sec-kit', 2)}
            <div className="grid2">
              {text('call', 'Name on your badge', { maxLength: 20 })}
              {select('collar', 'Your collar size', F.collar)}
            </div>
            {pills('food', 'What would you like to eat? *', F.food.map((f) => [f, f]))}
          </section>

          <section className={qClass('sec-att')} id="sec-att">{head('sec-att', 3)}
            <div className="ticks">
              <label><input type="checkbox" checked disabled /><span><b>Rotary Institute 2027</b><small>26 – 28 Nov · Prithvi Convention Centre · included with your registration</small></span></label>
              <label><input type="checkbox" id="gels" checked={d.gels} onChange={(e) => set('gels', e.target.checked)} /><span><b>GELS &amp; GNLS</b><small>23 – 25 Nov · Aakash MDF{/Elect|Nominee/.test(m.role) ? '' : ' · for Governors Elect and Nominee'}</small></span></label>
              <label><input type="checkbox" id="adjOn" checked={d.adjOn} onChange={(e) => set('adjOn', e.target.checked)} /><span><b>Adjunct Seminar</b><small>25 Nov</small></span></label>
            </div>
            {d.adjOn && select('adj', 'Which seminar?', F.seminars)}
            <div className="sub">
              {pills('trf', 'TRF Dinner · 25 Nov · 7.00 pm', [['Yes', "I'll be there"], ['No', "I can't make it"]])}
              {couple && pills('sTrf', 'TRF Dinner · spouse / partner', [['Yes', "They'll be there"], ['No', "They can't make it"]])}
            </div>
          </section>

          <section className={qClass('sec-stay')} id="sec-stay">{head('sec-stay', 4)}
            <fieldset className="field"><legend className="u-hide">Hotel</legend>
              <div className="hotels">{F.hotels.map((h) => (
                <label className="hotel" key={h.id}><input {...radio('hotel', h.id)} />
                  <img src={h.photo} alt="" width="1400" height="933" loading="lazy" />
                  <div><b>{h.name}</b><small>{h.area} · {h.distance} from the venue</small></div></label>
              ))}</div>{err('hotel')}</fieldset>
            <div className="stay">
              {text('in', 'Check-in', { type: 'date', min: F.stayMin, max: F.stayMax })}
              {text('out', 'Check-out', { type: 'date', min: F.stayMin, max: F.stayMax })}
              <div className={'nights' + (n || !d.out ? '' : ' bad')} aria-live="polite">
                {n ? <><b>{n} night{n > 1 ? 's' : ''}</b><small>{F.day(d.in)} – {F.day(d.out)}</small></> : <><b>–</b><small>{d.out ? 'Check-out needs to be after check-in' : 'Choose both dates'}</small></>}
              </div>
            </div>
          </section>

          <section className={qClass('sec-inv')} id="sec-inv">{head('sec-inv', 5)}
            <div className="grid2">
              {text('pan', 'Your PAN', { maxLength: 10, placeholder: 'ABCDE1234F', style: { textTransform: 'uppercase' } })}
              {couple && text('sPan', "Your spouse's PAN", { maxLength: 10, placeholder: 'ABCDE1234F', style: { textTransform: 'uppercase' } })}
            </div>
            {pills('gst', 'Do you need a GST invoice?', [['No', 'No'], ['Yes', 'Yes']])}
            {d.gst === 'Yes' && (
              <div className="grid2">
                {text('gstin', 'GSTIN', { maxLength: 15, placeholder: '27ABCDE1234F1Z5', style: { textTransform: 'uppercase' } })}
                {text('gstName', 'Name to print on the invoice')}
              </div>
            )}
          </section>
        </div>

        <aside className="sum" aria-live="polite">
          <h2>Your registration</h2>
          <div className="prog" aria-hidden="true">{bars}</div>
          <p className="left">{left ? <><b>{left}</b> thing{left > 1 ? 's' : ''} left to answer</> : '✓ All done. Ready to pay.'}</p>
          <ul className="jump">{secs.map((s, i) => (
            <li key={s.id}><a href={'#' + s.id} className={s.left ? '' : 'ok'} onClick={(e) => jump(e, s.id)}><i>{s.left ? i + 1 : '✓'}</i><span>{s.name}</span><small>{s.left ? s.left + ' left' : ''}</small></a></li>
          ))}</ul>
          <dl>
            {[
              ['Registration', d.type || '—'],
              ['Badge', `${d.call || '—'}${couple && d.sCall ? ' & ' + d.sCall : ''}`],
              ['Attending', progs.join(', ')],
              ['TRF Dinner', d.trf ? (couple ? `${d.trf} / ${d.sTrf || '—'}` : d.trf) : '—'],
              ['Hotel', d.hotel ? F.hotelName(d.hotel) : '—'],
              ['Nights', n ? `${n} · ${F.day(d.in)} – ${F.day(d.out)}` : '—'],
              ['Amount', amount],
            ].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <button type="submit" className="btn btn--sun">{offline ? 'Record payment' : 'Continue to payment'}</button>
          <small style={{ color: 'var(--ink-2)', fontSize: 12 }}>We save your answers as you go, so you can close this page and pick up from the same link any time.</small>
        </aside>
        <div className="mbar">
          <div><span>{left ? `${left} thing${left > 1 ? 's' : ''} left · ${secs.filter((s) => !s.left).length} of 5 done` : "All set. You're ready to pay."}</span><div className="prog" aria-hidden="true">{bars}</div></div>
          <button type="submit" className="btn btn--sun">{offline ? 'Record payment' : 'Review & pay'}</button>
        </div>
      </form>

      {sheet === 'pay' && <PaySheet m={m} d={d} label={label} amount={amount} close={() => setSheet(null)} showErrors={showErrors} />}
      {sheet === 'record' && <RecordSheet m={m} d={d} label={`${m.name} · ${couple ? 'Couple' : 'Single'} + ${n} nights`} amount={amount} say={say} showErrors={showErrors}
        close={() => setSheet(null)} registered={(r) => { setSheet(null); setTicket({ r, payment: r.summary.payment }) }} />}
    </>
  )
}

// A bottom sheet on phones, a dialog on wider screens. Escape and the backdrop close it.
function Sheet({ close, label, as: Tag = 'div', children, ...p }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])
  return (
    <div className="scrim" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <Tag className="paysheet" role="dialog" aria-modal="true" aria-label={label} {...p}>
        <header><h2>{label}</h2><button type="button" aria-label="Close" onClick={close}>×</button></header>
        {children}
      </Tag>
    </div>
  )
}

// Online: the backend prices it and hands back the Instamojo page to go to.
function PaySheet({ m, d, label, amount, close, showErrors }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("You'll finish paying securely on Instamojo, then come back here for your ticket.")
  const pay = async () => {
    setBusy(true)
    try {
      const { url } = await api(`/m/${m.token}/pay`, { method: 'POST', body: d })
      window.location.href = url
    } catch (x) {
      setBusy(false)
      if (x.data && x.data.errors) { close(); return showErrors(x.data.errors) }
      setNote(x.message)
    }
  }
  return (
    <Sheet close={close} label="Payment">
      <div className="amt"><span>{label}</span><b>{amount}</b></div>
      <div className="methods">
        {[['UPI', 'GPay, PhonePe, Paytm or any UPI app'], ['Card', 'Debit or credit'], ['Net banking', 'All major banks']].map(([b, s], i) => (
          <label key={b}><input type="radio" name="pm" defaultChecked={!i} /><span><b>{b}</b><small>{s}</small></span></label>
        ))}
      </div>
      <p className="note">{note}</p>
      <button type="button" className="btn btn--sun" autoFocus disabled={busy} onClick={pay}>{busy ? 'One moment…' : 'Pay'}</button>
    </Sheet>
  )
}

// Offline: the team records how the member paid; the backend registers them and gives the number.
function RecordSheet({ m, d, label, amount, close, say, showErrors, registered }) {
  const [mode, setMode] = useState('Cash')
  const [refNo, setRefNo] = useState('')
  const [amt, setAmt] = useState('')
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const needRef = !['Cash', 'Payment pending'].includes(mode)
  const needAmt = mode !== 'Payment pending'

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (needRef && !refNo.trim()) er.omRef = 'This is needed.'
    if (needAmt && !amt.trim()) er.omAmt = 'This is needed.'
    else if (needAmt && !/^\d+(\.\d{1,2})?$/.test(amt.replace(/,/g, ''))) er.omAmt = 'Enter the amount in rupees, like 25000.'
    setErrs(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      const r = await api(`/admin/offline/${m.token}`, { method: 'POST', body: { draft: d, payment: { mode, refNo: needRef ? refNo.trim() : '', amount: needAmt ? amt.replace(/,/g, '') : '' } } })
      registered(r.registration)
    } catch (x) {
      setBusy(false)
      if (x.status === 401) return say('Sign in on the admin page first, then try again.')
      if (!(x.data && x.data.errors)) return say(x.message)
      const mine = {}, rest = {}
      for (const [k, v] of Object.entries(x.data.errors)) (k.startsWith('om') ? mine : rest)[k] = v
      setErrs(mine)
      if (Object.keys(rest).length) { close(); showErrors(rest) }
    }
  }
  return (
    <Sheet close={close} label="Record payment" as="form" noValidate onSubmit={submit}>
      <div className="amt"><span>{label}</span><b>{amount}</b></div>
      <fieldset className="field"><legend>Paid by</legend><div className="methods">
        {F.offlineModes.map(([v, s], i) => (
          <label key={v}><input type="radio" name="om" value={v} checked={mode === v} autoFocus={!i} onChange={() => setMode(v)} /><span><b>{v}</b><small>{s}</small></span></label>
        ))}
      </div></fieldset>
      {needRef && <label className="field"><span>Cheque / UTR / UPI reference <em>*</em></span><input className={'input' + (errs.omRef ? ' bad' : '')} id="omRef" value={refNo} onChange={(e) => setRefNo(e.target.value)} required /><span className="err">{errs.omRef || ''}</span></label>}
      {needAmt && <label className="field"><span>Amount received (₹) <em>*</em></span><input className={'input' + (errs.omAmt ? ' bad' : '')} id="omAmt" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value)} required /><span className="err">{errs.omAmt || ''}</span></label>}
      <button type="submit" className="btn btn--sun" disabled={busy}>Record and register</button>
    </Sheet>
  )
}

function Ticket({ m, r, again, payment, peek }) {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const s = r.summary, c = !!s.spouse
  const cells = F.qrCells(r.regNo)
  const h1 = { fontSize: 'clamp(28px,4vw,44px)' }
  return (
    <div className="done">
      <div className="ok"><i aria-hidden="true">✓</i><div>
        {payment
          ? <><span className="eyebrow">Registered offline · {payment.mode}{payment.refNo ? ' · ' + payment.refNo : ''}{payment.amount ? ' · ₹' + payment.amount : ''}</span><h1 className="h1" style={h1}>{m.name} is registered</h1></>
          : <><span className="eyebrow">{again ? 'Already registered' : 'Payment received'}</span><h1 className="h1" style={h1}>{again ? "You're all registered" : `You're in, ${s.call}!`}</h1></>}
      </div></div>
      <article className="ticket">
        <div className="main">
          <div className="top"><img src="/media/logo.png" alt="" width="1744" height="712" /><span>Delegate ticket</span></div>
          <h2>{m.name}</h2>
          <div className="kv">
            <div><small>Registration</small><span>{s.type}{c ? ' · with ' + s.spouse.name : ''}</span></div>
            <div><small>District</small><span>{s.district}</span></div>
            <div><small>Badge</small><span>{s.call}{c && s.spouse.call ? ' & ' + s.spouse.call : ''}</span></div>
            <div><small>Attending</small><span>{s.progs.join(' · ')}</span></div>
            <div><small>Stay</small><span>{F.hotelName(s.hotel)}</span></div>
            <div><small>Nights</small><span>{F.day(s.in)} – {F.day(s.out)}</span></div>
            <div><small>Meals</small><span>{s.food}{c ? ' / ' + s.spouse.food : ''}</span></div>
            <div><small>TRF Dinner</small><span>{s.trf}{c ? ' / ' + s.sTrf : ''}</span></div>
          </div>
        </div>
        <div className="stub"><small>Show this at the desk</small>
          <div className="qr" style={{ gridTemplateColumns: 'repeat(21, 1fr)' }}>{cells.map((on, i) => <i key={i} className={on ? 'on' : undefined} />)}</div>
          <b>{r.regNo}</b></div>
      </article>
      {peek && (
        <div className="after">
          {payment && <a className="btn btn--sun" href={ADMIN + '#offline'}>Register another offline</a>}
          <a className="btn btn--line" href={ADMIN}>See it on the admin screen</a>
        </div>
      )}
    </div>
  )
}
