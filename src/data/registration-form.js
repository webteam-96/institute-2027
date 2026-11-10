// Lists and checks for the registration form (pages/RegisterPage.jsx).
// The backend (registration-api/Rules.cs) checks the same things again; keep the two in step.

export const collar = ['Small (36)', 'Medium (38)', 'Large (40)', 'Extra Large (42)', 'Double Extra Large (44)', 'Triple Extra Large (46)', 'Custom']
export const food = ['Veg', 'Non-Veg', 'Jain', 'None']
export const seminars = ['DLF Seminar', 'COL Seminar', 'Rotaract Seminar']
export const hotels = [
  { id: 'ati-virat', name: 'ATI ONGC - Virat', area: 'On the venue campus', distance: '0 km', photo: '/media/hotels/ati-virat-main.jpg' },
  { id: 'holiday-inn', name: 'Holiday Inn Resort Goa', area: 'Mobor Beach, Cavelossim', distance: 'about 11 km', photo: '/media/hotels/holiday-inn-main.jpg' },
  { id: 'radisson', name: 'Radisson Blu Resort Goa Cavelossim Beach', area: 'Cavelossim Beach', distance: 'about 11 km', photo: '/media/hotels/radisson-main.jpg' },
]
export const offlineModes = [['Cash', 'At the desk'], ['Cheque', 'Note the cheque number'], ['Bank transfer', 'NEFT, RTGS or IMPS; note the UTR'], ['UPI at the desk', 'Note the UPI reference'], ['Payment pending', 'Register now, collect later']]
export const stayMin = '2027-11-22'
export const stayMax = '2027-11-29'

export const hotelName = (id) => (hotels.find((h) => h.id === id) || {}).name || '-'
export const nights = (a, b) => {
  if (!a || !b) return 0
  const n = Math.round((new Date(b) - new Date(a)) / 86400000)
  return n > 0 ? n : 0
}
export const day = (iso) => (iso ? new Date(iso + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-')
export const initials = (s) => (s || '').replace(/^(Rtn\.?|Dr\.?|PDG|DGE|DGN|DG)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

// Indian 10-digit, with or without 91, or an overseas number (the zones include Sri Lanka and Nepal).
// ponytail: a 9-digit typo of an Indian number passes as overseas; a per-country check would catch it.
const isMobile = (v) => { const d = v.replace(/\D/g, '').replace(/^0/, ''); return /^(91)?[6-9]\d{9}$/.test(d) || (/^\d{9,15}$/.test(d) && (d.length !== 10 || /^\s*\+/.test(v))) }
const checks = {
  mobile: [isMobile, 'Enter a 10-digit mobile number, or an overseas number with its country code.'],
  email: [(v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter an email like name@example.com.'],
  pan: [(v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.toUpperCase()), 'Enter a PAN like ABCDE1234F.'],
  gstin: [(v) => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.toUpperCase()), 'Enter a 15-character GSTIN like 27ABCDE1234F1Z5.'],
}

// Every key the form saves. Text values unless listed in `boxes`.
export const fields = ['mobile', 'email', 'mDistrict', 'sFirst', 'sLast', 'sMobile', 'sEmail', 'sCall', 'sCollar', 'call', 'collar', 'adj', 'in', 'out', 'pan', 'sPan', 'gstin', 'gstName', 'type', 'food', 'sFood', 'trf', 'sTrf', 'hotel', 'gst']
export const boxes = ['gels', 'adjOn']
const radios = ['type', 'food', 'sFood', 'trf', 'sTrf', 'hotel', 'gst']

// What still needs answering, by section: { sectionId: { field: message } }.
// Sections and order follow the page, so the first problem is the first one on screen.
export function problems(d) {
  const couple = d.type === 'Couple'
  const need = {
    'sec-who': ['mobile:mobile', 'email:email', 'mDistrict', 'type', ...(couple ? ['sFirst', 'sLast', 'sMobile:mobile', 'sEmail:email', 'sCall', 'sCollar', 'sFood'] : [])],
    'sec-kit': ['call', 'collar', 'food'],
    'sec-att': [...(d.adjOn ? ['adj'] : []), 'trf', ...(couple ? ['sTrf'] : [])],
    'sec-stay': ['hotel', 'in', 'out'],
    'sec-inv': ['pan:pan', ...(couple ? ['sPan:pan'] : []), 'gst', ...(d.gst === 'Yes' ? ['gstin:gstin', 'gstName'] : [])],
  }
  const out = {}
  for (const [sec, list] of Object.entries(need)) {
    const p = {}
    for (const item of list) {
      const [k, kind] = item.split(':')
      const v = (d[k] || '').trim()
      if (!v) p[k] = radios.includes(k) ? 'Choose one.' : 'This is needed.'
      else if (kind && !checks[kind][0](v)) p[k] = checks[kind][1]
    }
    if (sec === 'sec-stay' && d.in && d.out && !nights(d.in, d.out)) p.out = 'Check-out needs to be after check-in.'
    out[sec] = p
  }
  return out
}

// A stand-in QR: a fixed-looking pattern seeded from the text, with the three corner squares
// a real code has. It is a picture, not a scannable code.
export function qrCells(text, size = 21) {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507)) >>> 0) / 4294967296
  const corners = [[0, 0], [size - 7, 0], [0, size - 7]]
  const cells = []
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const c = corners.find(([fx, fy]) => x >= fx && y >= fy && x < fx + 7 && y < fy + 7)
    if (!c) { cells.push(rnd() > 0.52); continue }
    const dx = x - c[0], dy = y - c[1]
    cells.push(dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx > 1 && dx < 5 && dy > 1 && dy < 5))
  }
  return cells
}

// The registration backend. JSON both ways; a failed call throws an Error carrying the server's message.
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method, credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body && JSON.stringify(body),
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw Object.assign(new Error((data && data.error) || 'Something went wrong. Please try again.'), { status: res.status, data })
  return data
}

