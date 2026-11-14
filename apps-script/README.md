# RSVP backend: Google Sheet + Apps Script

The site sends each RSVP to a small Apps Script web app, which writes one row per reply into a Google Sheet. Each guest's browser keeps a private random **Guest ID**. If they reply again from the same phone, their row is **updated** instead of a new one being added. A reply sent from a different phone or browser shows up as a new row; spot those by name and delete the older one.

## 1. Create the sheet and script (5 minutes)

1. Go to <https://sheets.new> and name the spreadsheet, e.g. **Ruchira & Yash: RSVPs**.
2. Open **Extensions → Apps Script**.
3. Delete the starter code in `Code.gs` and paste in the contents of [`Code.gs`](Code.gs) from this folder. Save (⌘S).
4. *(Recommended)* Pick **testUpsert** in the function dropdown and click **▶ Run**.
   - Google asks for permission: **Review permissions →** your account **→ Advanced → Go to … (unsafe) → Allow**. The script is yours and only touches this spreadsheet.
   - The log should show `{"ok":true,"updated":false}` and then `{"ok":true,"updated":true}`. Back in the sheet, the `RSVPs` tab has a single "Test Guest" row with a value in **Updated**. That proves the upsert works. **Delete that row** (keep the header row).

### If Google says "This app is blocked"

This happens when the script asks for access to *all* your spreadsheets, a "sensitive" permission that Google can block for scripts it hasn't verified.

1. Check that the first lines of `Code.gs` in the editor include `@OnlyCurrentDoc`, exactly as in this folder's copy. That limits the script to this one spreadsheet, which Google allows.
2. Save, then **▶ Run → testUpsert** again.
3. If Google still blocks it:
   - Make sure the browser is signed in to the **same Google account that owns the spreadsheet**.
   - If that account uses Google's **Advanced Protection Program**, it blocks every unverified script, including your own. In that case, create the sheet and script with a different Google account.

## 2. Deploy as a web app

1. **Deploy → New deployment**, then click the ⚙ next to "Select type" and choose **Web app**.
2. Description: `RSVP v1`
3. **Execute as: Me**
4. **Who has access: Anyone** (guests aren't signed in, so it has to be "Anyone", not "Anyone with Google account").
5. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
6. Paste it into `config.js`:
   ```js
   rsvp: {
     endpoint: 'https://script.google.com/macros/s/AKfy…/exec',
   ```
7. Commit and push. Optionally, open the `/exec` URL in a browser: it should show `{"ok":true,"service":"rsvp"}`.

## 3. After editing Code.gs (important)

Saving the script does **not** update the live web app. To publish changes **without changing the URL**:

**Deploy → Manage deployments →** select the deployment **→ ✏️ Edit → Version: New version → Deploy.**

(Choosing "New deployment" instead gives you a *new* URL, which you would then have to paste into `config.js` again.)

## Sheet columns

`Timestamp | Updated | Name | Side | Attending | Guests | Message | Guest ID`

- **Timestamp**: first reply. **Updated**: most recent change (blank if never changed).
- **Guests**: `1` for "Just me", `2` for "The two of us", `0` for a decline.
- Expected headcount: `=SUM(F:F)`.
- To count attendees, use a filter or formula on the sheet itself. The website never shows any tally.

## Notes

- Spam: a hidden "website" field (honeypot) is ignored by real guests. Submissions that fill it are accepted silently and never written.
- Values starting with `=`, `+`, `-` or `@` get a leading `'`, so a message can't run as a spreadsheet formula.
- To drop the Bride's/Groom's side question, set `askSide: false` in `config.js`. The **Side** column then stays blank. No script change is needed.
