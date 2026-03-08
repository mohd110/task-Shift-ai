/* =====================================================
   js/components/helpers.js
   Shared utility functions used across all pages.
   ===================================================== */

/* ── Format a date string → "7 Mar 2026" ── */
function fmtDate(s) {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return s; }
}

/* ── Format a time string → "12:03 PM" ── */
function fmtTime(s) {
  if (!s) return '';
  try {
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleTimeString('en-IN', {
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return s; }
}

/* ── Format date + time together ── */
function fmtDT(s) {
  if (!s) return '—';
  const date = fmtDate(s);
  const time = fmtTime(s);
  return time ? `${date}, ${time}` : date;
}

/* ── Calculate call duration from start + end ISO strings ── */
function calcDur(start, end) {
  if (!start || !end) return '—';
  try {
    const ms = new Date(end) - new Date(start);
    if (isNaN(ms) || ms <= 0) return '—';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  } catch { return '—'; }
}

/* ── Truncate long strings with ellipsis ── */
function trunc(s, n = 45) {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

/* ──────────────────────────────────────────
   STATUS HELPER
   Maps 'Yes'/'No' booked + presence of
   call start/end into a status string.
────────────────────────────────────────── */
function statusFromRow(row) {
  const booked  = Sheet.g(row, 'booked');
  const started = Sheet.g(row, 'started');
  if (booked === 'Yes') return 'booked';
  if (!started)         return 'missed';
  return 'answered';
}

/* ── Status badge HTML ── */
function statusBadge(s) {
  if (s === 'booked')   return '<span class="badge badge-green">Booked</span>';
  if (s === 'answered') return '<span class="badge badge-blue">Answered</span>';
  if (s === 'missed')   return '<span class="badge badge-red">Missed</span>';
  return '<span class="badge badge-gray">Unknown</span>';
}

/* ──────────────────────────────────────────
   SENTIMENT HELPER
   Guesses sentiment from notes + purpose
   text using keyword matching.
────────────────────────────────────────── */
function guessSentiment(row) {
  const text = (
    Sheet.g(row, 'notes') + ' ' + Sheet.g(row, 'purpose')
  ).toLowerCase();

  if (/great|happy|wonderful|perfect|thank|booked|confirmed/.test(text)) {
    return 'positive';
  }
  if (/cancel|issue|problem|wrong|missed|fail|unhappy/.test(text)) {
    return 'negative';
  }
  return 'neutral';
}

/* ── Sentiment badge HTML ── */
function sentimentBadge(s) {
  if (s === 'positive') return '<span class="badge badge-green">😊 Positive</span>';
  if (s === 'negative') return '<span class="badge badge-red">😠 Negative</span>';
  return '<span class="badge badge-gray">😐 Neutral</span>';
}

/* ── Set element text by ID (safe) ── */
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Build avatar initials from name ── */
function initials(name) {
  return (name || 'UN').slice(0, 2).toUpperCase();
}
