#!/usr/bin/env node
/* Builds assets/ruchira-yash-wedding.ics (all celebrations, one file) from config.js.
   Run after changing any event:   node tools/make-ics.js
   The site links to this real file because phones (iOS Safari, WhatsApp's browser,
   some Android browsers) refuse calendar links generated inside the page. */
const fs = require('fs'), path = require('path'), vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), ctx);
const C = ctx.window.WEDDING;

const stamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/[;,]/g, '\\$&').replace(/\n/g, '\\n');
// RFC 5545: fold lines longer than 75 octets
const fold = line => {
  const out = []; let buf = Buffer.from(line, 'utf8');
  while (buf.length > 75) {
    let cut = 75; while (cut > 0 && (buf[cut] & 0xC0) === 0x80) cut--; // don't split a UTF-8 character
    out.push(buf.slice(0, cut).toString('utf8')); buf = Buffer.concat([Buffer.from(' '), buf.slice(cut)]);
  }
  out.push(buf.toString('utf8'));
  return out.join('\r\n');
};

const site = C.siteUrl || 'https://yashvardhan18.github.io/ruchira-yash/';
const loc = C.venue.name + ', ' + C.venue.address;
const couple = C.couple.bride + ' & ' + C.couple.groom;
const now = stamp(new Date());
const lines = [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ruchira & Yash//Wedding//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  'X-WR-CALNAME:' + esc(couple + ' · Wedding'), 'X-WR-TIMEZONE:Asia/Kolkata',
];
for (const ev of C.events) {
  const s = new Date(ev.start), e = new Date(s.getTime() + (ev.hours || 3) * 36e5);
  lines.push(
    'BEGIN:VEVENT',
    'UID:' + ev.id.toLowerCase() + '-20261212@ruchira-yash',
    'DTSTAMP:' + now, 'DTSTART:' + stamp(s), 'DTEND:' + stamp(e),
    'SUMMARY:' + esc(ev.id + ' · ' + couple),
    'LOCATION:' + esc(loc),
    'DESCRIPTION:' + esc((ev.note ? ev.note + '\n' : '') + site),
    'URL:' + site,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(ev.id + ' · ' + couple), 'TRIGGER:-PT3H', 'END:VALARM',
    'END:VEVENT',
  );
}
lines.push('END:VCALENDAR');
const out = path.join(root, 'assets', 'ruchira-yash-wedding.ics');
fs.writeFileSync(out, lines.map(fold).join('\r\n') + '\r\n');
console.log('wrote', path.relative(root, out), '—', C.events.length, 'events');
