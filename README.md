# Ruchira & Yash: wedding invitation

A single-page invitation for **11–12 December 2026, Kadamb Kuteer Resort, Vrindavan**. The printed card opens into a living invitation with a countdown, the two-day celebrations, the venue map, RSVP, and music.

Plain HTML, CSS and vanilla JS, with no build step. It's hosted on GitHub Pages, and RSVPs go to a Google Sheet through Apps Script.

```
index.html          page markup + inline SVG line art (Ganesh, fleurons, icons, seal…)
styles.css          all styling (palette tokens at the top)
main.js             behaviour (cover, music, countdown, timeline, RSVP, 7-tap &)
config.js           ← ALL editable content lives here
assets/img/         hero photo (webp + jpg) and floral corners cut from the card
assets/audio/       flute.mp3 (background loop)
assets/icons/       favicon + apple-touch-icon
assets/og-image.jpg link-preview image (1200×630)
apps-script/        Code.gs (RSVP backend) + its README
tools/              og.html / icon.html: sources for the preview image and icons
invite-card.jpg     the printed card (design reference; not loaded by the site)
```

## Preview locally

```bash
cd "Wedding invite"
python3 -m http.server 8000
```

Open <http://localhost:8000>. To see the RSVP thank-you state before the Apps Script is connected, open <http://localhost:8000/?rsvpdemo>. It simulates a successful submission and sends nothing.

On a phone on the same Wi-Fi, open `http://<your-mac's-IP>:8000`.

## Deploy to GitHub Pages

1. Create a repo on GitHub, e.g. `ruchira-yash`. It can be public, or private if your plan supports Pages for private repos.
2. Push this folder:
   ```bash
   git remote add origin https://github.com/<you>/ruchira-yash.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
4. After about a minute the site is live at `https://<you>.github.io/ruchira-yash/`.

### Before the first WhatsApp share (important)

WhatsApp caches link previews, so set these **before** anyone receives the link:

1. In `index.html`, replace both `https://SITE-URL/` placeholders (`og:url`, `og:image`, `twitter:image`) with the live URL, e.g. `https://<you>.github.io/ruchira-yash/`. The image URL must be absolute.
2. Push, wait for Pages to update, then send the link **to yourself** on WhatsApp and check the preview shows the photo, the names, and "Ruchira & Yash · 12 December 2026".

### Custom domain (optional)

Add the domain under **Settings → Pages → Custom domain** and create the DNS records GitHub shows. Then update the `SITE-URL` values to the new domain. Nothing else in the site depends on the URL.

## Connect RSVPs

Follow [`apps-script/README.md`](apps-script/README.md). The short version: paste `Code.gs` into a Sheet's Apps Script, run `testUpsert` once, deploy as a web app (Execute as **me**, access **Anyone**), then paste the `/exec` URL into `config.js` → `rsvp.endpoint`.

Until an endpoint is set, the form shows a polite "RSVPs aren't connected yet" message.

## Updating content

Everything editable is in **`config.js`**: names, the countdown target, events (times, dress notes, durations for the calendar file), venue and map query, shloka, RSVP endpoint and closing date, the side question, gallery photos, audio path, contact line, and closing copy.

| Change | Where |
|---|---|
| Drop the Bride's/Groom's side question | `rsvp.askSide: false` |
| Close RSVPs earlier or later | `rsvp.closesAt` (keep the `+05:30`) |
| Test the "RSVPs closed" state | set `closesAt` to a past date, reload, then set it back |
| Contact line shown when RSVPs are closed | `contact` |
| Add gallery photos | `gallery: [...]` (see below). The section appears automatically. |
| Replace the music | drop a new file at `assets/audio/flute.mp3` (≤ 2 MB, 128 kbps) |
| Link-preview title/description/image | `<head>` of `index.html` (WhatsApp doesn't run JS) |

**Shloka font note:** the Devanagari font is loaded as a subset of just the shloka's characters, so it stays small. If you change the shloka text, regenerate the `text=` parameter in the Tiro Devanagari `<link>` in `index.html`:
```bash
node -e "const s='<new shloka text>';console.log(encodeURIComponent([...new Set([...s.replace(/ /g,'')])].join('')))"
```

### Higher-res hero photo

Replace `assets/img/hero.webp` and `assets/img/hero.jpg` with the same crop (about 1.58 : 1, the hands centred). Around 1200 px wide is plenty. Update `heroPhoto.width/height` in `config.js`, then regenerate the link preview (below).

### Gallery photos

For each photo, export a 640 px and a 1280 px WebP plus a 1280 px JPEG into `assets/gallery/`, then add:
```js
{ src: 'assets/gallery/01-1280.webp',
  srcset: 'assets/gallery/01-640.webp 640w, assets/gallery/01-1280.webp 1280w',
  fallback: 'assets/gallery/01-1280.jpg', w: 1280, h: 853, alt: 'Describe the photo' },
```
(macOS: `sips -s format jpeg -Z 1280 in.heic --out 01-1280.jpg`. Use <https://squoosh.app> for WebP.)

### Regenerating the link-preview image and icons

`tools/og.html` and `tools/icon.html` are the sources. Serve the folder locally, open `http://localhost:8000/tools/og.html` in Chrome, and capture a 1200×630 screenshot (DevTools → device toolbar → set 1200×630 → ⋮ → *Capture screenshot*). Save it as `assets/og-image.jpg`. Do the same for `icon.html` at 180×180 → `assets/icons/apple-touch-icon.png`.

## Behaviour notes

- **Envelope → card → invitation:** tapping the wax seal opens the flap, the card slides out and settles centre-screen, and the music fades in over 2 s. That first tap is what lets browsers play audio. Tapping the card swings it open into the site and the gold frame draws itself. With *Reduce Motion* turned on, each step is a simple fade.
- **Scroll motion:** effects are tied to scroll position; scrolling itself is never hijacked.
  - the hero drifts away with gentle parallax
  - the photo pins and grows from a framed print to full width (caption: `pinLine` in `config.js`)
  - a line of text lights up word by word (`interlude`)
  - headings rise word by word
  - the anchor chain draws down the timeline
  - the map unmasks
  - All of it is off under *Reduce Motion*.
- **Music:** loads only after the tap. If `flute.mp3` is missing or fails to load, the shehnai button stays hidden and nothing breaks. Mute is remembered on the device. Music pauses when the tab is hidden and resumes on return unless muted.
- **Countdown** targets the Haldi, `2026-12-11T11:00:00+05:30` (when the festivities begin), so it's correct in any device timezone. Once it passes it reads "The celebrations have begun", and from 13 Dec (IST) it reads "Thank you for celebrating with us".
- **RSVP:** the form asks for a name, Bride's/Groom's side, and whether they're coming. If they accept, it asks "Just me" or "The two of us", so one link works for singles and couples. The thank-you message adapts ("…with you both"). There's no phone number: the guest's browser keeps a private random ID, so replying again from the same phone updates their row, and their answers come back prefilled. If sending fails, the typed answers stay in the form.
- **Calendar:** "Add to calendar" under the timeline opens a small panel:
  - **Apple Calendar · Outlook** links to a real file, `assets/ruchira-yash-wedding.ics`, with all five celebrations and a 3-hour reminder for each.
  - **Google Calendar** subscribes to that same file.
  - There are also one-at-a-time Google links.
  - The file is generated from `config.js`. **After changing any event, run `node tools/make-ics.js`** and commit the updated file.
- **Privacy:** `noindex,nofollow`. No analytics, trackers or cookies. The only third parties are Google Fonts, the lazy-loaded Google Maps embed (loads as you scroll near the venue), and the Apps Script endpoint.
- **Only one interactive easter egg:** seven taps on the "&" between the names. The other touches (Morse divider, signal-flag bunting, compass, anchor-chain timeline, block seal, "✓ 1 confirmation") are deliberately silent decoration.
