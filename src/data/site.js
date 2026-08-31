/**
 * The event, and the navigation, in one place.
 *
 * Everything marked "to be announced" is genuinely unconfirmed — the committee
 * has not appointed it yet. Nothing here is invented to fill a gap.
 */
export const event = {
  name: 'Rotary Institute 2027',
  place: 'Goa',
  theme: 'Celebrate Leadership & Service',
  zones: 'Zones 4, 5, 6, 7 & 8',
  dates: '26 · 27 · 28 November 2027',
  preDates: '23 – 25 November 2027',
  venue: 'ATI ONGC — Advanced Training Institute',
  address: 'Kital, Canaguinim, Goa 403723',
  email: 'hello@rotaryinstitute2027goa.org',
}

export const nav = [
  { label: 'Home', to: '/' },
  { label: 'Institute', to: '/about' },
  { label: 'GELS/GNLS', to: '/gels-gnls' },
  { label: 'TRF Events', to: '/trf-events' },
  { label: 'Adjunct Seminars', to: '/adjunct-seminars' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Committee', to: '/committee' },
  { label: 'Hotels', to: '/hotels' },
  { label: 'Venue', to: '/venue' },
]

export const social = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/rotary-international' },
  { label: 'Instagram', href: 'https://www.instagram.com/rotaryinternational' },
]

/**
 * The programme as the organising committee gave it. A time appears only where
 * one was given — the blank days are blank on purpose.
 */
/**
 * The programme, in the three components the organisers run it as: the
 * Institute itself, the two governors' learning seminars, and the adjunct
 * seminars that fill the day between them.
 *
 * Session times follow the shape of Rotary Institute 2025 (rotaryinstitute2025.com),
 * mapped onto the 2027 dates: the seminars run the three days before the
 * Institute, and the adjunct seminars sit on the last of them. They are
 * indicative until the committee confirms the final timings, which is what the
 * note on the schedule page says.
 */
export const programme = [
  {
    id: 'institute',
    number: '01',
    name: 'Rotary Institute 2027',
    dates: '26 · 27 · 28 November 2027',
    days: [
      {
        day: '26',
        weekday: 'Friday',
        slots: [
          { time: '12.30 pm – 2.00 pm', name: 'Inaugural lunch' },
          { time: '2.30 pm – 6.30 pm', name: 'Inaugural and plenary session' },
          { time: '7.00 pm – 11.00 pm', name: 'Dinner and entertainment' },
        ],
      },
      {
        day: '27',
        weekday: 'Saturday',
        slots: [
          { time: '9.00 am – 5.30 pm', name: 'Plenary session' },
          { time: '7.00 pm – 10.30 pm', name: 'Dinner and entertainment' },
        ],
      },
      {
        day: '28',
        weekday: 'Sunday',
        slots: [{ time: '9.00 am – 1.30 pm', name: 'Plenary session and valedictory' }],
      },
    ],
  },
  {
    id: 'gels-gnls',
    number: '02',
    name: 'Governors Elect Learning Seminar (GELS) & Governors Nominee Learning Seminar (GNLS)',
    dates: '23 · 24 · 25 November 2027',
    days: [
      {
        day: '23',
        weekday: 'Tuesday',
        slots: [
          { time: '12.30 pm – 1.30 pm', name: 'Registration and lunch' },
          { time: '3.00 pm – 6.00 pm', name: 'GELS and GNLS opening session, with partners' },
          { time: '5.00 pm – 7.00 pm', name: 'Partners’ programme' },
          { time: '7.00 pm – 10.00 pm', name: 'Fellowship, drinks and dinner' },
        ],
      },
      {
        day: '24',
        weekday: 'Wednesday',
        slots: [
          { time: '7.00 am – 8.30 am', name: 'Breakfast for governors-elect, governors-nominee and partners' },
          { time: '9.30 am – 5.00 pm', name: 'Learning seminars, with a parallel partners’ track' },
          { time: '7.30 pm – 10.00 pm', name: 'Informal fellowship dinner with entertainment' },
        ],
      },
      {
        day: '25',
        weekday: 'Thursday',
        slots: [{ time: '9.30 am – 4.30 pm', name: 'Closing learning seminar and graduation' }],
      },
    ],
  },
  {
    id: 'pre-institute',
    number: '03',
    name: 'Pre-Institute (Adjunct) Seminars',
    dates: '25 November 2027',
    days: [
      {
        day: '25',
        weekday: 'Thursday',
        slots: [
          { time: '10.00 am – 5.00 pm', name: 'District Learning Facilitators Seminar (DLF)' },
          { time: '10.00 am – 5.00 pm', name: 'Council on Legislation (COL)' },
          { time: '10.00 am – 5.00 pm', name: 'Rotaract Seminar' },
        ],
      },
    ],
  },
]

/**
 * The organising committee, as supplied. Photographs are the single portraits
 * from photos/photos, cropped to 4:5 and flattened onto the section ground
 * where the source was a cutout.
 */
export const committee = [
  { name: 'Gurjeet S. Sekhon', role: 'Convenor', photo: '/media/committee/gurjeet-sekhon.jpg' },
  { name: 'Basu Dev Golyan', role: 'Co-Convenor', photo: '/media/committee/basu-dev-golyan.jpg' },
  { name: 'J. B. Kamdar', role: 'Chairman', photo: '/media/committee/jb-kamdar.jpg' },
  { name: 'Dr Lenny Da Costa', role: 'Secretary', photo: '/media/committee/lenny-da-costa.jpg' },
]

/**
 * What you can register for, in the three components the programme runs as.
 *
 * Every fee is genuinely unset — the committee has not agreed them — so each
 * row carries null and renders as "To be announced" rather than a number
 * nobody has approved. Nothing here is invented: the categories, the dates and
 * the seminar names are the same ones `programme` above uses.
 */
export const registration = [
  {
    id: 'institute',
    name: 'Rotary Institute 2027',
    axis: 'Delegate',
    dates: '26 · 27 · 28 November 2027',
    subject: 'Institute%20registration',
    rows: [['Single', null], ['Couple', null]],
  },
  {
    id: 'gels-gnls',
    name: 'GELS / GNLS',
    expands: 'Governors Elect Learning Seminars & Governors Nominee Learning Seminars',
    axis: 'Delegate',
    dates: '23 – 25 November 2027',
    subject: 'GELS%20and%20GNLS%20registration',
    rows: [['Single', null], ['Couple', null]],
  },
  {
    id: 'trf',
    name: 'TRF Events',
    expands: 'The Rotary Foundation Dinner and Seminar',
    axis: 'Event',
    dates: '25 – 26 November 2027',
    subject: 'TRF%20Events%20registration',
    rows: [['TRF Dinner', null], ['TRF Seminar', null]],
    // The homepage strip shows the three programme components the Institute
    // runs as; these two sit alongside it and have their own page. Listed here
    // so the registration page carries everything you can register for without
    // a second source to keep in step.
    onHome: false,
  },
  {
    id: 'adjunct',
    name: 'Adjunct Seminars',
    // This card's left column is a different axis from the other two: which
    // seminar, not who is registering.
    axis: 'Seminar',
    dates: '25 November 2027',
    subject: 'Adjunct%20Seminars%20registration',
    rows: [
      ['DLF Seminar', null],
      ['COL Seminar', null],
      ['Rotaract Seminar', null],
    ],
  },
]

/**
 * The Rotary Foundation events, as supplied by the committee.
 *
 * These sit alongside the Institute rather than inside it — they were taken
 * out of the programme earlier and are given their own page here — so they are
 * their own list rather than a fourth `programme` component. Only what was
 * given: a name, a date and a time each.
 */
export const trfEvents = [
  {
    id: 'trf-dinner',
    name: 'TRF Dinner',
    day: '25',
    weekday: 'Thursday',
    date: '25 November 2027',
    time: '7.00 pm onwards',
  },
  {
    id: 'trf-seminar',
    name: 'TRF Seminar',
    day: '26',
    weekday: 'Friday',
    date: '26 November 2027',
    time: '10.00 am – 2.00 pm',
  },
]

/**
 * The three hotels, as named by the committee.
 *
 * Addresses and the official booking pages are from each chain's own site, not
 * from an aggregator. Nothing is said about rates, room types or an allocation
 * — none of that has been agreed, and a hotel page that implies a negotiated
 * block where there is none would mislead a delegate into expecting one.
 *
 * The distance is honest about what it is. All three sit on the same two
 * kilometres of the Cavelossim-Mobor strip, and the road to Canaguinim runs
 * south through Betul, so they share one figure rather than three invented
 * ones that differ by a few hundred metres. It is marked approximate on the
 * page and should be confirmed before the site goes live.
 */
export const hotels = [
  {
    id: 'holiday-inn',
    name: 'Holiday Inn Resort Goa, an IHG Hotel',
    address: 'Mobor Beach, Cavelossim, Salcete, South Goa 403731',
    site: 'https://www.ihg.com/holidayinnresorts/hotels/us/en/goa/goiin/hoteldetail',
  },
  {
    id: 'novotel',
    name: 'Novotel Goa Dona Sylvia Resort',
    address: 'Cavelossim Road, Mobor, Cavelossim, South Goa 403731',
    site: 'https://all.accor.com/hotel/A6P4/index.en.shtml',
  },
  {
    id: 'radisson',
    name: 'Radisson Blu Resort Goa Cavelossim Beach',
    address: 'Cavelossim Beach, Salcete, South Goa 403731',
    site: 'https://www.radissonhotels.com/en-us/hotels/radisson-blu-resort-goa-cavelossim-beach',
  },
]

/** Shared by all three — see the note above. */
export const hotelDistance = {
  road: 'about 11 km by road',
  drive: 'roughly 25 minutes',
}
