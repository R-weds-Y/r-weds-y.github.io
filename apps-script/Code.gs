/**
 * Ruchira & Yash — RSVP endpoint (Google Apps Script web app, bound to a Google Sheet).
 *
 * Receives JSON (sent as text/plain to avoid a CORS preflight) and upserts one row per
 * reply into the sheet "RSVPs", keyed by a random guest ID the website keeps on the
 * guest's device. Replying again from the same device updates the same row.
 * See apps-script/README.md for deployment steps.
 */

var SHEET_NAME = 'RSVPs';
var HEADERS = ['Timestamp', 'Updated', 'Name', 'Side', 'Attending', 'Guests', 'Message', 'Guest ID'];
var ID_COL = 8; // 1-based column index of "Guest ID"

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents;
    if (!raw) return json_({ ok: false, error: 'Empty request.' });
    var data;
    try { data = JSON.parse(raw); } catch (err) { return json_({ ok: false, error: 'Invalid request.' }); }

    // Honeypot: real guests never see this field. Pretend success, write nothing.
    if (data.website) return json_({ ok: true, updated: false });

    var v = validate_(data);
    if (v.error) return json_({ ok: false, error: v.error });

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) return json_({ ok: false, error: 'The RSVP book is busy — please try again in a moment.' });
    try {
      var sheet = sheet_();
      var now = new Date();
      var row = findRowById_(sheet, v.id);
      var values = [
        row ? sheet.getRange(row, 1).getValue() : now, // Timestamp (first reply)
        row ? now : '',                                  // Updated
        v.name, v.side, v.attending, v.guests, v.message, v.id,
      ];
      if (row) sheet.getRange(row, 1, 1, HEADERS.length).setValues([values]);
      else sheet.appendRow(values);
      return json_({ ok: true, updated: !!row });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Something went wrong on our side. Please try again.' });
  }
}

/** Health check: open the /exec URL in a browser to confirm the deployment is live. */
function doGet() {
  return json_({ ok: true, service: 'rsvp' });
}

function validate_(d) {
  var id = String(d.id || '');
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return { error: 'Please reload the page and try again.' };

  var name = clean_(d.name, 100);
  if (name.length < 2) return { error: 'Please tell us your name.' };

  var attending = d.attending === 'yes' ? 'Yes' : d.attending === 'no' ? 'No' : null;
  if (!attending) return { error: 'Please say whether you can attend.' };

  var guests = 0;
  if (attending === 'Yes') {
    guests = Number(d.guests) === 2 ? 2 : Number(d.guests) === 1 ? 1 : 0;
    if (!guests) return { error: 'Please tell us who is coming.' };
  }

  var side = d.side === 'Bride' ? 'Bride' : d.side === 'Groom' ? 'Groom' : '';

  return { id: id, name: name, side: side, attending: attending, guests: guests, message: clean_(d.message, 300) };
}

/** Trim, cap length, and neutralise spreadsheet formula injection. */
function clean_(s, max) {
  s = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function findRowById_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var col = sheet.getRange(2, ID_COL, last - 1, 1).getDisplayValues();
  for (var i = 0; i < col.length; i++) if (col[i][0] === id) return i + 2;
  return 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor (▶ Run → testUpsert) to check permissions & upsert, then delete the test row. */
function testUpsert() {
  var mk = function (guests) {
    return { postData: { contents: JSON.stringify({ id: 'test-guest-0001', name: 'Test Guest',
      side: 'Groom', attending: 'yes', guests: guests, message: 'testing' }) } };
  };
  Logger.log(doPost(mk(1)).getContent());  // {"ok":true,"updated":false}
  Logger.log(doPost(mk(2)).getContent());  // {"ok":true,"updated":true}
}
