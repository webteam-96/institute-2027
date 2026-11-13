import { useEffect, useState } from 'react'

import { api } from '../data/registration-form'
import { SignIn } from './AdminPage'
import '../styles/register.css'
import '../styles/invite.css'

/**
 * The registration team's preview of the invite each member gets: the same
 * message as it lands on WhatsApp and in email, with that member's own link.
 */
export default function InvitePage() {
  const [members, setMembers] = useState(null) // null while loading, false when nobody is signed in
  const [failed, setFailed] = useState('')
  const [token, setToken] = useState('')
  const load = () => api('/admin/members').then((m) => { setMembers(m); setToken(m[0] ? m[0].token : '') })
    .catch((e) => (e.status === 401 ? setMembers(false) : setFailed(e.message)))
  useEffect(() => { load() }, [])

  const m = members && members.find((x) => x.token === token)
  const url = m ? `/register/${m.token}` : '#'

  return (
    <div className="rf">
      <main className="wrap">
        {failed && <p className="lede">{failed}</p>}
        {!failed && members === null && <p className="lede">Loading…</p>}
        {members === false && <SignIn done={load} />}
        {m && (
          <>
            <div style={{ display: 'grid', gap: 10 }}><span className="eyebrow">The invite</span><h1 className="h1">Each member gets their own link</h1>
              <p className="lede">Sent on WhatsApp and email when registration opens. The link is unique to the person, so it opens on their own details with nothing to look up.</p></div>

            <div className="pick">
              <label className="field"><span>Preview the invite for</span>
                <select className="select" id="who" value={token} onChange={(e) => setToken(e.target.value)}>
                  {members.map((x) => <option key={x.token} value={x.token}>{x.name} · {x.role}, {x.committee}</option>)}
                </select></label>
            </div>

            <div className="two">
              <div><p className="cap">On WhatsApp</p>
                <div className="wa"><div className="wa__head"><i aria-hidden="true" /><div><b>Rotary Institute 2027</b><small>Business account</small></div></div>
                  <div className="wa__body"><div className="bubble">
                    <img src="/media/venue-aerial-1080.jpg" alt="" width="1080" height="608" />
                    <div className="tx"><p>Namaskar <b>{m.name}</b> 🙏</p><p>Registration for <b>Rotary Institute 2027, Goa</b> (26 – 28 November) is now open.</p><p>Your details are already filled in. It takes about two minutes.</p><p style={{ color: '#7b8a9c', fontSize: 13 }}>This link is only for you. Please don't forward it.</p></div>
                    <div className="t">10:02</div>
                    <a className="cta" href={url}>↗ Register now</a>
                  </div></div>
                </div>
              </div>

              <div><p className="cap">By email</p>
                <div className="mail">
                  <div className="mail__meta"><span>From <b>Rotary Institute 2027</b> &lt;support@rotaryinstitute2027.com&gt;</span><span>To <b>{m.email || 'no email in the committee sheet'}</b></span><span className="subj">Your personal registration link · Rotary Institute 2027, Goa</span></div>
                  <div className="mail__body">
                    <img className="logo" src="/media/logo.png" alt="Rotary Institute 2027 Goa" width="1203" height="684" />
                    <h3>Dear {m.name},</h3>
                    <p>Registration is open for Rotary Institute 2027 at Prithvi Convention Centre ONGC - Goa, 26 – 28 November 2027. We've already filled in what we know about you:</p>
                    <div className="card"><b>{m.name}</b>{m.roles.map((r) => <span key={r}>{r}</span>)}{m.district && <span>District {m.district}</span>}{(m.mobile || m.email) && <span>{[m.mobile, m.email].filter(Boolean).join(' · ')}</span>}</div>
                    <p>All that's left is who's coming with you, what you'll attend, where you'll stay, and payment.</p>
                    <a className="btn btn--sun" href={url}>Open my registration</a>
                    <small>Or paste this link into your browser: <code>{location.host}{url}</code></small>
                    <small>Not you, or something wrong above? Reply to this email and we'll fix it.</small>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
