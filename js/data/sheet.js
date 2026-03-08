/* =====================================================
   js/data/sheet.js
   Google Sheets data layer.

   - Fetches all rows from the configured sheet
   - Maps column headers with fuzzy matching
     (handles trailing spaces, case differences)
   - Exposes Sheet.rows[] and Sheet.g(row, key)
   - Calls renderAll() after every successful fetch

   To swap to a different data source later,
   only this file needs to change.
   ===================================================== */

const Sheet = (() => {

  let _rows    = [];   // Array of row objects keyed by header name
  let _cols    = {};   // Map: friendly key → actual header string

  /* ──────────────────────────────────────────
     COLUMN FUZZY MATCHER
     Tries exact match first, then partial match.
     Handles "Name " (trailing space), "name" (lowercase).
  ────────────────────────────────────────── */
  function findCol(headers, ...names) {
    // Pass 1: exact match (case-insensitive + trimmed)
    for (const name of names) {
      const n = name.toLowerCase().trim();
      const h = headers.find(h => h.toLowerCase().trim() === n);
      if (h !== undefined) return h;
    }
    // Pass 2: partial match fallback
    for (const name of names) {
      const n = name.toLowerCase().trim();
      const h = headers.find(h => h.toLowerCase().trim().includes(n));
      if (h !== undefined) return h;
    }
    return null;
  }

  /* Build the friendly key → header mapping */
  function buildCols(headers) {
    _cols = {
      name      : findCol(headers, 'Name', 'name', 'Name '),
      number    : findCol(headers, 'Number', 'Number ', 'phone', 'Phone'),
      email     : findCol(headers, 'Email', 'email'),
      purpose   : findCol(headers, 'Purpose of call', 'purpose_of_call', 'purpose'),
      booked    : findCol(headers, 'Booked', 'booked', 'appointment_booked'),
      time      : findCol(headers, 'Time', 'appointment_time', 'Appointment Time'),
      notes     : findCol(headers, 'Key Notes', 'key_notes', 'notes'),
      started   : findCol(headers, 'Call Started', 'call_started'),
      ended     : findCol(headers, 'Call ended', 'Call Ended', 'call_ended'),
      transcript: findCol(headers, 'Transcript', 'transcript'),
    };
    console.log('📋 Task Shit Ai — column map:', _cols);
  }

  /* ──────────────────────────────────────────
     PUBLIC: get a cell value by friendly key
     Usage: Sheet.g(row, 'name')
  ────────────────────────────────────────── */
  function g(row, key) {
    const col = _cols[key];
    return col ? (row[col] || '') : '';
  }

  /* ──────────────────────────────────────────
     FETCH — loads data from Google Sheets API
  ────────────────────────────────────────── */
  async function load() {
    const url = [
      'https://sheets.googleapis.com/v4/spreadsheets/',
      CONFIG.SHEET_ID,
      '/values/',
      encodeURIComponent(CONFIG.TAB_NAME),
      '!A:Z?key=',
      CONFIG.API_KEY,
    ].join('');

    try {
      const res  = await fetch(url);
      const json = await res.json();

      // API returned an error object
      if (json.error) {
        Toast.show('⚠ Sheet error: ' + json.error.message);
        console.error('Sheets API error:', json.error);
        return;
      }

      const values = json.values || [];

      // Sheet is empty
      if (values.length < 2) {
        _rows = [];
        App.renderAll();
        Toast.show('Sheet appears to be empty');
        return;
      }

      // Row 0 = headers, remaining rows = data
      const headers = values[0];
      buildCols(headers);

      _rows = values.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = (row[i] || '').trim();
        });
        return obj;
      });

      App.renderAll();
      Toast.show(`✓ ${_rows.length} records loaded`);

    } catch (err) {
      Toast.show('⚠ Network error — check console');
      console.error('Sheet fetch error:', err);
    }
  }

  /* ── Public refresh (called by Refresh buttons) ── */
  function refresh() { load(); }

  return {
    load,
    refresh,
    g,
    get rows() { return _rows; },
  };

})();
