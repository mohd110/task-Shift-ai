/* =====================================================
   js/pages/detail.js
   Call Detail page — shows full info for one call row.
   ===================================================== */

const Detail = (() => {

  /* Open by row index in Sheet.rows */
  function openIdx(idx) {
    const row = Sheet.rows[idx];
    if (row) open(row);
    switchPage('detail');
  }

  function open(r) {
    switchPage('detail');
    const name    = Sheet.g(r,'name')    || 'Unknown';
    const num     = Sheet.g(r,'number')  || '—';
    const email   = Sheet.g(r,'email')   || '—';
    const purpose = Sheet.g(r,'purpose') || '—';
    const notes   = Sheet.g(r,'notes')   || '—';
    const started = Sheet.g(r,'started') || '';
    const ended   = Sheet.g(r,'ended')   || '';
    const time    = Sheet.g(r,'time')    || '';
    const booked  = Sheet.g(r,'booked')  === 'Yes';
    const tx      = Sheet.g(r,'transcript') || '';

    // Header
    const avatarEl = document.getElementById('detail-avatar');
    if (avatarEl) avatarEl.textContent = initials(name);

    setEl('detail-name',     name);
    setEl('detail-num',      num);
    setEl('detail-datetime', fmtDT(started));
    setEl('detail-dur',      calcDur(started, ended));
    setEl('detail-purpose',  purpose);
    setEl('detail-appt',     time ? fmtDT(time) : '—');
    setEl('detail-email',    email);
    setEl('detail-notes',    notes);

    // Status badge
    const badgeEl = document.getElementById('detail-badge');
    if (badgeEl) badgeEl.innerHTML = booked
      ? '<span class="badge badge-green">Booked</span>'
      : '<span class="badge badge-gray">Not Booked</span>';

    // Transcript
    const txEl = document.getElementById('detail-transcript');
    if (txEl) {
      const lines = tx.split('\n').filter(Boolean);
      txEl.innerHTML = lines.length
        ? lines.map(line => {
            const isAI = /^(AI|Sarah|Bot|Assistant)\s*:/i.test(line);
            const text = line.replace(/^(AI|Sarah|Bot|Assistant|User|Client)\s*:\s*/i, '');
            return '<div class="transcript-msg">'
              + '<div class="role ' + (isAI ? 'ai' : 'user') + '">' + (isAI ? 'AI Sarah' : 'Caller') + '</div>'
              + '<div class="bubble">' + text + '</div>'
              + '</div>';
          }).join('')
        : '<div style="color:rgba(255,255,255,.4);font-size:13px">No transcript recorded.</div>';
    }

    // Sentiment
    const sent    = guessSentiment(r);
    const sentEl  = document.getElementById('detail-sentiment');
    if (sentEl) {
      const score = sent === 'positive' ? '8.4' : sent === 'negative' ? '3.2' : '5.8';
      const color = sent === 'positive' ? 'var(--green)' : sent === 'negative' ? 'var(--red)' : 'var(--orange)';
      const label = sent.charAt(0).toUpperCase() + sent.slice(1);
      const pct   = sent === 'positive' ? 84 : sent === 'negative' ? 32 : 58;
      sentEl.innerHTML = '<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">'
        + '<div style="font-size:40px;font-weight:700;font-family:var(--font-d);color:' + color + '">' + score + '</div>'
        + '<div><div style="font-size:13px;font-weight:600;color:' + color + '">' + label + '</div>'
        + '<div style="font-size:12px;color:var(--gray-400)">Overall call sentiment</div></div>'
        + '</div>'
        + '<div class="sentiment-bar" style="width:' + pct + '%;background:' + color + '"></div>'
        + '<div style="display:flex;justify-content:space-between;margin-top:6px">'
        + '<span style="font-size:11px;color:var(--gray-400)">Negative</span>'
        + '<span style="font-size:11px;color:var(--gray-400)">Positive</span>'
        + '</div>';
    }
  }

  return { open, openIdx };
})();
