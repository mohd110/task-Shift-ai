/* =====================================================
   js/pages/analytics.js
   Analytics page — computed metrics from sheet data.
   ===================================================== */

const Analytics = (() => {

  function render() {
    const rows   = Sheet.rows;
    const total  = rows.length;
    const answered = rows.filter(r => Sheet.g(r,'started')).length;
    const answerRate = total ? Math.round((answered / total) * 100) : 0;

    let totalMs = 0;
    let durCount = 0;
    
    rows.forEach(r => {
      const start = Sheet.g(r, 'started');
      const end = Sheet.g(r, 'ended');
      if (start && end) {
         const ms = new Date(end) - new Date(start);
         if(!isNaN(ms) && ms > 0) {
            totalMs += ms;
            durCount++;
         }
      }
    });

    let durString = "0<span style=\"font-size:20px\">m</span> 0<span style=\"font-size:20px\">s</span>";
    let costString = "$0.00";
    if (durCount > 0) {
       const avgMs = Math.floor(totalMs / durCount);
       const m = Math.floor(avgMs / 60000);
       const s = Math.floor((avgMs % 60000) / 1000);
       durString = `${m}<span style=\"font-size:20px\">m</span> ${Math.max(s,1)}<span style=\"font-size:20px\">s</span>`;
       
       // Dynamic realistic cost calculation mock based on calls and duration
       const costPerCall = ((m * 60 + s) * 0.04 + 1.25).toFixed(2);
       costString = `$${costPerCall}`;
    }

    const arEl = document.getElementById('a-answer-rate');
    if (arEl) arEl.innerHTML = `${answerRate}<span style=\"font-size:20px\">%</span>`;
    
    const adEl = document.getElementById('a-avg-dur');
    if (adEl) adEl.innerHTML = durString;
    
    setEl('a-cost', costString);

    // Purpose/intent breakdown
    const pm = {};
    rows.forEach(r => {
      const p = (Sheet.g(r,'purpose') || 'Unknown')
        .split(/[.\n]/)[0].trim().slice(0, 40);
      pm[p] = (pm[p] || 0) + 1;
    });

    const sorted = Object.entries(pm).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const intentEl = document.getElementById('intent-tbody');
    if (intentEl) {
      intentEl.innerHTML = sorted.length
        ? sorted.map(([label, count]) => {
            const pct = Math.round((count / Math.max(total, 1)) * 100);
            const cvr = Math.round(
              rows.filter(r =>
                (Sheet.g(r,'purpose') || '').toLowerCase().includes(label.toLowerCase().slice(0, 10))
                && Sheet.g(r,'booked') === 'Yes'
              ).length / Math.max(count, 1) * 100
            );
            const cvrColor = cvr >= 50 ? '#10b981' : cvr >= 20 ? '#f59e0b' : '#ef4444';
            return '<tr style="border-bottom:1px solid #f8fafc">'
              + '<td style="padding:16px 8px;font-size:12px;font-weight:500;color:#334155">' + label + '</td>'
              + '<td style="padding:16px 8px;font-size:12px;font-weight:700;color:#0f172a">' + count + '</td>'
              + '<td style="padding:16px 8px"><span style="color:#3b82f6;font-size:12px;font-weight:600">• ' + pct + '%</span></td>'
              + '<td style="padding:16px 8px;font-size:12px;font-weight:600;color:#94a3b8">—</td>' /* Default to - per screenshot */
              + '<td style="padding:16px 8px"><span style="color:' + cvrColor + ';font-size:12px;font-weight:600">• ' + cvr + '%</span></td>'
              + '</tr>';
          }).join('')
        : '<tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;font-size:13px">No data yet</td></tr>';
    }

    // Call Volume Bar Graph (Last 7 Days)
    const volEl = document.getElementById('volume-bars');
    if (volEl) {
      const days = [0,0,0,0,0,0,0]; // Last 7 days, 6 is latest
      const dayNames = [];
      
      // Find the most recent date in the sheet to anchor the graph relative to it
      let maxDateMs = 0;
      rows.forEach(r => {
        const t = Sheet.g(r, 'time') || Sheet.g(r, 'started');
        if(t) {
            const ms = new Date(t).setHours(0,0,0,0);
            if (!isNaN(ms) && ms > maxDateMs) maxDateMs = ms;
        }
      });
      const latestDay = maxDateMs > 0 ? new Date(maxDateMs) : new Date();

      for(let i=6; i>=0; i--) {
        const d = new Date(latestDay);
        d.setDate(latestDay.getDate() - i);
        dayNames.push(d.toLocaleDateString('en-US', {weekday:'short'}));
      }

      rows.forEach(r => {
        const t = Sheet.g(r, 'time') || Sheet.g(r, 'started');
        if(!t) return;
        const callDate = new Date(t);
        if(isNaN(callDate)) return;
        
        // Calculate difference in days from the latest day
        const diffDays = Math.floor((latestDay.setHours(0,0,0,0) - callDate.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          days[6 - diffDays]++;
        }
      });

      const maxVol = Math.max(...days, 1);
      
      volEl.innerHTML = days.map((val, idx) => {
        const hPct = val > 0 ? Math.round((val / maxVol) * 100) : 5; // min 5% height if 0
        const barColor = (val === maxVol && val > 0) ? '#2563eb' : '#bfdbfe'; // Dark blue for max, light blue for others
        const valLabel = val > 0 ? val : '';
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:12px;">
                  <div style="font-size:11px;font-weight:600;color:#0f172a;min-height:16px">${valLabel}</div>
                  <div style="width:100%;height:120px;display:flex;align-items:flex-end;justify-content:center;">
                    <div style="width:100%;max-width:48px;height:${hPct}%;background:${barColor};border-radius:6px;transition:height 0.5s ease"></div>
                  </div>
                  <div style="font-size:11px;color:#94a3b8;font-weight:500;text-transform:capitalize">${dayNames[idx]}</div>
                </div>`;
      }).join('');
    }

    // Sentiment Analysis Breakdown
    const sentEl = document.getElementById('sentiment-bars');
    const sentCounts = { positive: 0, neutral: 0, negative: 0 };
    
    rows.forEach(r => {
      let sent = typeof guessSentiment === 'function' ? guessSentiment(r) : 'neutral';
      sent = sent.toLowerCase(); // ensure lowercase string tracking
      if(sentCounts[sent] !== undefined) {
         sentCounts[sent]++;
      } else {
         sentCounts.neutral++;
      }
    });

    let satPct = 0;
    if (total > 0) {
      const posPct = Math.round((sentCounts.positive / total) * 100);
      const neuPct = Math.round((sentCounts.neutral / total) * 100);
      const negPct = Math.round((sentCounts.negative / total) * 100);
      
      // Calculate Satisfaction as generic sum of positive + neutral
      satPct = posPct + neuPct;
      
      // Calculate Avg Score out of 10 and CSAT out of 5 based on sentiment points
      // Positive = 10/5, Neutral = 7/3.5, Negative = 2/1
      let totalPoints10 = (sentCounts.positive * 10) + (sentCounts.neutral * 7) + (sentCounts.negative * 2);
      let totalPoints5 = (sentCounts.positive * 5) + (sentCounts.neutral * 3.5) + (sentCounts.negative * 1);
      
      let avgScore = (totalPoints10 / total).toFixed(1);
      let csat = (totalPoints5 / total).toFixed(1);

      if (sentEl) {
        sentEl.innerHTML = 
          `<div>
             <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px"><span style="color:#10b981;font-weight:600">😊 Positive</span><span style="font-weight:700;color:#0f172a">${posPct}%</span></div>
             <div style="height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden"><div style="width:${posPct}%;height:100%;background:#10b981;border-radius:3px"></div></div>
           </div>
           <div>
             <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px"><span style="color:#64748b;font-weight:600">😐 Neutral</span><span style="font-weight:700;color:#0f172a">${neuPct}%</span></div>
             <div style="height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden"><div style="width:${neuPct}%;height:100%;background:#cbd5e1;border-radius:3px"></div></div>
           </div>
           <div>
             <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px"><span style="color:#ef4444;font-weight:600">😠 Negative</span><span style="font-weight:700;color:#0f172a">${negPct}%</span></div>
             <div style="height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden"><div style="width:${negPct}%;height:100%;background:#ef4444;border-radius:3px"></div></div>
           </div>`;
      }
      
      const scoreEl = document.getElementById('sent-avg-score');
      if (scoreEl) scoreEl.innerHTML = `<span style="color:#10b981">${avgScore}</span><span style="color:#cbd5e1;font-size:14px">/10</span>`;
      
      const csatEl = document.getElementById('sent-csat');
      if (csatEl) csatEl.innerHTML = `<span style="color:#3b82f6">${csat}</span><span style="color:#cbd5e1;font-size:14px">/5</span>`;
      
    } else if (sentEl) {
       sentEl.innerHTML = '<div style="color:var(--gray-400);font-size:13px">No calls to analyze</div>';
    }
    
    // Top Row Satisfaction value
    const satTop = document.getElementById('a-satisfaction');
    if (satTop) satTop.innerHTML = `${satPct}<span style="font-size:20px">%</span>`;
  }

  return { render };
})();
