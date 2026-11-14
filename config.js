/* =========================================================================
   Ruchira & Yash — all editable content lives here.
   Edit, save, commit, push. GitHub Pages republishes in ~1 minute.
   NOTE: link-preview text (WhatsApp/OG tags) is in <head> of index.html,
   because WhatsApp does not run JavaScript.
   ========================================================================= */
window.WEDDING = {
  couple: { bride: 'Ruchira', groom: 'Yash' },
  siteUrl: 'https://r-weds-y.github.io/', // used in the calendar file (node tools/make-ics.js)

  // All times are IST. Always keep the +05:30 offset — never rely on device timezone.
  weddingStart: '2026-12-11T11:00:00+05:30', // countdown target: the Haldi, when the festivities begin
  thankYouFrom: '2026-12-13T00:00:00+05:30', // after this: "Thank you for celebrating with us"

  dateBlock: { weekday: 'Fri & Sat', day: '11–12', monthYear: 'December 2026' }, // shown under the photo

  shloka: [
    'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।',
    'निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',
  ],

  venue: {
    name: 'Kadamb Kuteer Resort, Vrindavan',
    address: 'Delhi – Agra National Highway, Uttar Pradesh',
    mapQuery: 'Kadamb Kuteer Resort, Vrindavan, Uttar Pradesh',
  },

  // icon: haldi | mehendi | sangeet | wedding | reception
  events: [
    { id: 'Haldi',     icon: 'haldi',     day: 'Friday, 11 December',   start: '2026-12-11T11:00:00+05:30', hours: 3, time: '1100 HRS',
      note: 'We’d love to see you in pink', swatch: '#E59AB0' },
    { id: 'Mehendi',   icon: 'mehendi',   day: 'Friday, 11 December',   start: '2026-12-11T14:00:00+05:30', hours: 4, time: '1400 HRS',
      note: 'Bring all the colours and love' },
    { id: 'Sangeet',   icon: 'sangeet',   day: 'Friday, 11 December',   start: '2026-12-11T19:00:00+05:30', hours: 4, time: '1900 HRS',
      note: 'Shine bright in the starry night', bunting: true },
    { id: 'Wedding',   icon: 'wedding',   day: 'Saturday, 12 December', start: '2026-12-12T14:00:00+05:30', hours: 4, time: '1400 HRS',
      note: 'Traditionals' },
    { id: 'Reception', icon: 'reception', day: 'Saturday, 12 December', start: '2026-12-12T19:00:00+05:30', hours: 4, time: '1900 HRS' },
  ],

  heroPhoto: {
    webp: 'assets/img/hero.webp',
    jpg: 'assets/img/hero.jpg',
    alt: 'Ruchira and Yash holding hands, her palms decorated with mehndi',
    width: 497, height: 314,
  },

  rsvp: {
    // Paste the Apps Script "Web app" URL here (ends in /exec). See apps-script/README.md
    endpoint: '',
    closesAt: '2026-12-05T23:59:59+05:30', // RSVP closes after 5 Dec 2026
    askSide: true, // set to false to drop the "Bride's side / Groom's side" question
  },

  contact: 'For any questions, please message the family on WhatsApp.',
  // e.g. contact: 'Questions? Call or WhatsApp Aman on +91 98xxx xxxxx',

  // Gallery — section stays hidden while this is empty.
  // { src: 'assets/gallery/01-1280.webp', srcset: 'assets/gallery/01-640.webp 640w, assets/gallery/01-1280.webp 1280w',
  //   fallback: 'assets/gallery/01-1280.jpg', w: 1280, h: 853, alt: 'Describe the photo' }
  gallery: [],

  audio: {
    src: 'assets/audio/flute.mp3', // site works (and hides the shehnai) if this file is missing
    volume: 0.55,
    fadeInSeconds: 2,
  },

  // Scroll moments
  pinLine: 'Two families. One celebration.', // appears under the photo as it grows
  interlude: 'Two days, five celebrations, and a lifetime of stories that begin with you there.', // lights up word by word

  closing: {
    line: 'Two hearts, one journey, forever to go…',
    signoff: 'With love,',
    ps: 'P.S. There is a small secret behind the & in our names, waiting for anyone who knocks seven times.',
    egg: 'Seven taps, seven pheras. Some chains are meant to hold. — R & Y',
  },
};
