/* =====================================================
   js/pages/dashboard.js
   Dashboard Overview page logic.
   Renders: stat cards, outcome bars, recent calls table.
   ===================================================== */

const Dashboard = (() => {

  function renderStats() {
    const rows   = Sheet.rows;
    const total  = rows.length;
    const booked = rows.filter(r => Sheet.g(r, 'booked') === 'Yes').length;
    const rate   = total ? Math.round((booked / total) * 100) : 0;

    let ms = 0, n = 0;
    rows.forEach(r => {
      try {
        const d = new Date(Sheet.g(r,'ended')) - new Date(Sheet.g(r,'started'));
        if (d > 0) { ms += d; n++; }
      } catch {}
    });
    const avgDur = n
      ? Math.floor(ms/n/60000) + 'm ' + Math.floor((ms/n%60000)/1000) + 's'
      : '—';

    setEl('stat-total',  total);
    setEl('stat-booked', booked);
    setEl('stat-dur',    avgDur);
    setEl('stat-rate',   rate + '%');

    const missed   = rows.filter(r => !Sheet.g(r,'started') && Sheet.g(r,'booked') !== 'Yes').length;
    const answered = total - booked - missed;
    const ansRate  = total ? Math.round((answered/total)*100) : 0;
    const missRate = total ? Math.round((missed/total)*100)   : 0;

    const setProg = (id, pct) => { const el=document.getElementById(id); if(el) el.style.width=pct+'%'; };
    setProg('prog-answered', ansRate);
    setProg('prog-booked',   rate);
    setProg('prog-missed',   missRate);
    setEl('pct-answered', ansRate+'%');
    setEl('pct-booked',   rate+'%');
    setEl('pct-missed',   missRate+'%');
  }

  function renderRecentCalls() {
    const rows = Sheet.rows.slice(-5).reverse();
    const el   = document.getElementById('dashboard-calls');
    if (!el) return;
    el.innerHTML = rows.length
      ? rows.map(r => {
          const name    = Sheet.g(r,'name')    || '—';
          const started = Sheet.g(r,'started') || '';
          const ended   = Sheet.g(r,'ended')   || '';
          const purpose = Sheet.g(r,'purpose') || '—';
          const status  = statusFromRow(r);
          const rowJson = JSON.stringify(r).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
          return '<tr>'
            + '<td><div style="display:flex;align-items:center;gap:10px">'
            + '<div class="avatar" style="width:28px;height:28px;font-size:11px">'+initials(name)+'</div>'
            + '<strong>'+name+'</strong></div></td>'
            + '<td style="color:var(--gray-400);font-size:12px">'+fmtDT(started)+'</td>'
            + '<td>'+calcDur(started,ended)+'</td>'
            + '<td style="color:var(--gray-500)">'+trunc(purpose,38)+'</td>'
            + '<td>'+statusBadge(status)+'</td>'
            + '<td><span style="color:var(--blue);font-size:12px;font-weight:600;cursor:pointer" onclick="Detail.openIdx('+Sheet.rows.indexOf(r)+')">View →</span></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">No records yet</td></tr>';
  }

  function render() {
    renderStats();
    renderRecentCalls();
  }

  return { render };
})();
