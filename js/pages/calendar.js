/* =====================================================
   js/pages/calendar.js
   Calendar page — monthly grid + upcoming appointments.
   ===================================================== */

const Cal = (() => {
  const now = new Date();
  let yr = now.getFullYear();
  let mo = now.getMonth();

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  /* Get map of days in current month that have bookings to their count */
  function getEventCounts() {
    const counts = {};
    Sheet.rows
      .filter(r => Sheet.g(r, 'booked') === 'Yes')
      .forEach(r => {
        const t = Sheet.g(r, 'time') || Sheet.g(r, 'started');
        if (!t) return;
        try {
          const d = new Date(t);
          if (d.getFullYear() === yr && d.getMonth() === mo) {
            const day = d.getDate();
            counts[day] = (counts[day] || 0) + 1;
          }
        } catch {}
      });
    return counts;
  }

  /* Render the calendar grid */
  function render() {
    const today  = new Date();
    const isNow  = today.getFullYear() === yr && today.getMonth() === mo;
    const first  = new Date(yr, mo, 1).getDay();
    const days   = new Date(yr, mo + 1, 0).getDate();
    const evtCounts = getEventCounts();

    const lbl = document.getElementById('cal-label');
    if (lbl) lbl.textContent = MONTHS[mo] + ' ' + yr;

    let h = DAYS.map(d => '<div class="cal-dn">' + d + '</div>').join('');
    for (let i = 0; i < first; i++) h += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= days; d++) {
      const isToday = isNow && d === today.getDate();
      const count = evtCounts[d] || 0;
      
      let badgeHtml = '';
      if (count > 0) {
          const label = count === 1 ? 'booking' : 'bookings';
          badgeHtml = `<div class="cal-badge">${count} ${label}</div>`;
      }
      
      h += '<div class="cal-cell'
        + (isToday ? ' today' : '')
        + (count > 0 ? ' has-event' : '')
        + '" onclick="Cal.pick(' + d + ')">' 
        + `<span class="cal-date-num">${d}</span>`
        + badgeHtml 
        + '</div>';
    }

    const grid = document.getElementById('cal-grid');
    if (grid) grid.innerHTML = h;
  }

  /* Navigate months */
  function move(dir) {
    mo += dir;
    if (mo > 11) { mo = 0; yr++; }
    if (mo < 0)  { mo = 11; yr--; }
    render();
  }

  /* Click a day — show bookings for that date */
  function pick(d) {
    const dayRows = Sheet.rows.filter(r => {
      if (Sheet.g(r, 'booked') !== 'Yes') return false;
      const t = Sheet.g(r, 'time') || Sheet.g(r, 'started');
      if (!t) return false;
      try {
        const dt = new Date(t);
        return dt.getFullYear() === yr && dt.getMonth() === mo && dt.getDate() === d;
      } catch { return false; }
    });

    const upEl = document.getElementById('upcoming-list');
    if (!upEl) return;

    upEl.innerHTML = dayRows.length
      ? dayRows.map(r => {
          const name    = Sheet.g(r, 'name')    || '—';
          const time    = Sheet.g(r, 'time')    || Sheet.g(r, 'started') || '';
          const purpose = Sheet.g(r, 'purpose') || '';
          return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--gray-100)">'
            + '<div class="avatar" style="width:32px;height:32px;font-size:12px">' + initials(name) + '</div>'
            + '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + name + '</div>'
            + '<div style="font-size:11px;color:var(--gray-400)">' + trunc(purpose, 35) + '</div></div>'
            + '<div style="text-align:right">'
            + '<div style="font-size:11px;font-weight:600;color:var(--blue)">' + fmtTime(time) + '</div>'
            + '</div></div>';
        }).join('')
      : '<div style="color:var(--gray-400);font-size:13px;padding:16px 0">No bookings on '
        + MONTHS[mo] + ' ' + d + '</div>';
  }

  /* Upcoming appointments list (calendar sidebar) */
  function renderUpcoming() {
    const upcoming = Sheet.rows
      .filter(r => Sheet.g(r, 'booked') === 'Yes')
      .slice(-5).reverse();

    const el = document.getElementById('upcoming-list');
    if (!el) return;

    el.innerHTML = upcoming.length
      ? upcoming.map(r => {
          const name    = Sheet.g(r, 'name')    || '—';
          const time    = Sheet.g(r, 'time')    || Sheet.g(r, 'started') || '';
          const purpose = Sheet.g(r, 'purpose') || '';
          return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--gray-100)">'
            + '<div class="avatar" style="width:32px;height:32px;font-size:12px">' + initials(name) + '</div>'
            + '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + name + '</div>'
            + '<div style="font-size:11px;color:var(--gray-400)">' + trunc(purpose, 30) + '</div></div>'
            + '<div style="text-align:right">'
            + '<div style="font-size:11px;font-weight:600;color:var(--blue)">' + fmtDate(time) + '</div>'
            + '<div style="font-size:11px;color:var(--gray-400)">' + fmtTime(time) + '</div>'
            + '</div></div>';
        }).join('')
      : '<div style="color:var(--gray-400);font-size:13px;padding:16px 0">No upcoming bookings yet</div>';
  }

  return { render, move, pick, renderUpcoming };
})();
