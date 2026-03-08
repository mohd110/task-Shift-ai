/* =====================================================
   js/pages/calllogs.js
   Call Logs page — full table with search + filter.
   ===================================================== */

const CallLogs = (() => {
  let _filter = 'all';
  let _search = '';

  function getFiltered() {
    let data = Sheet.rows.slice().reverse(); // Most recent first
    if (_filter === 'booked')   data = data.filter(r => Sheet.g(r,'booked') === 'Yes');
    if (_filter === 'missed')   data = data.filter(r => !Sheet.g(r,'started'));
    if (_filter === 'answered') data = data.filter(r => Sheet.g(r,'started') && Sheet.g(r,'booked') !== 'Yes');
    if (_search) {
      const q = _search;
      data = data.filter(r =>
        (Sheet.g(r,'name')   ||'').toLowerCase().includes(q) ||
        (Sheet.g(r,'number') ||'').includes(q) ||
        (Sheet.g(r,'purpose')||'').toLowerCase().includes(q)
      );
    }
    return data;
  }

  function render() {
    const data = getFiltered();
    const el   = document.getElementById('logs-body');
    if (!el) return;

    el.innerHTML = data.length
      ? data.map((r, i) => {
          const name    = Sheet.g(r,'name')    || '—';
          const num     = Sheet.g(r,'number')  || '—';
          const started = Sheet.g(r,'started') || '';
          const ended   = Sheet.g(r,'ended')   || '';
          const purpose = Sheet.g(r,'purpose') || '—';
          const status  = statusFromRow(r);
          const sent    = guessSentiment(r);
          const realIdx = Sheet.rows.indexOf(r);
          return '<tr>'
            + '<td style="color:var(--gray-400);font-size:12px">'+(i+1)+'</td>'
            + '<td><div style="display:flex;align-items:center;gap:10px">'
            + '<div class="avatar" style="width:28px;height:28px;font-size:11px">'+initials(name)+'</div>'
            + '<strong>'+name+'</strong></div></td>'
            + '<td style="color:var(--gray-500);font-size:12px">'+num+'</td>'
            + '<td style="color:var(--gray-400);font-size:12px">'+fmtDT(started)+'</td>'
            + '<td>'+calcDur(started,ended)+'</td>'
            + '<td style="color:var(--gray-600)">'+trunc(purpose,38)+'</td>'
            + '<td>'+statusBadge(status)+'</td>'
            + '<td>'+sentimentBadge(sent)+'</td>'
            + '<td><span style="color:var(--blue);font-size:12px;font-weight:600;cursor:pointer" onclick="Detail.openIdx('+realIdx+')">Detail →</span></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--gray-400)">'
        + (Sheet.rows.length ? 'No records match your filter' : 'No data yet')
        + '</td></tr>';

    const sub = document.querySelector('#page-calllogs .page-sub');
    if (sub) sub.textContent = Sheet.rows.length + ' total calls';
  }

  function setSearch(val) { _search = val.toLowerCase(); render(); }

  function setFilter(status, btn) {
    _filter = status;
    document.querySelectorAll('.flt').forEach(b => {
      b.style.borderColor = '';
      b.style.color       = '';
      b.style.background  = '';
    });
    if (btn) {
      btn.style.borderColor = 'var(--blue)';
      btn.style.color       = 'var(--blue)';
      btn.style.background  = 'var(--blue-light)';
    }
    render();
  }

  return { render, setSearch, setFilter };
})();
