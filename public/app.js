let selectedCall = null;
let selectedSlot = null;
let calendar = null;

// // Protect page
// fetch("/api/auth-check")
//   .then(res=>{
//     if(!res.ok){
//       window.location="/login.html";
//     }
//   });


document.addEventListener("DOMContentLoaded", () => {

// Only run call system on call page
if (document.getElementById("callList")) {
loadCalls();
}

// Only run calendar on calendar page
if (document.getElementById("calendar")) {
initCalendar();
}

// Only run dashboard on index page
if (document.getElementById("totalCalls")) {
loadDashboard();
}

});


/* -------------------- DASHBOARD -------------------- */
async function loadDashboard() {
  try {
    const response = await fetch("/api/transcripts");
    if (!response.ok) throw new Error("Failed to load data");
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error("Invalid response", data);
      return;
    }

    // Debug logging
    console.log("API Response:", data);
    console.log("Sample call:", data[0]);

    // Calculate metrics
    const totalCalls = data.length;
    const bookedCalls = data.filter(call => call.outcome === "Scheduled").length;
    const missedCalls = data.filter(call => call.outcome === "Inquiry").length;
    const revenue = bookedCalls * 50;

    console.log("Total:", totalCalls, "Booked:", bookedCalls, "Missed:", missedCalls);

    // Update KPI cards
    document.getElementById("totalCalls").innerText = totalCalls;
    document.getElementById("bookedCalls").innerText = bookedCalls;
    document.getElementById("missedCalls").innerText = missedCalls;
    document.getElementById("revenue").innerText = "$" + revenue;

    // Load call volume chart
    if (document.getElementById("volumeChart")) {
      loadCallVolumeChart(data);
    }

    // Load recent activity (last 3 callers)
    if (document.getElementById("activityTable")) {
      loadRecentActivity(data.slice(0, 3));
    }

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

function loadCallVolumeChart(data) {
  // Group calls by date
  const callsByDate = {};

  data.forEach(call => {
    if (call.datetime) {
      const date = call.datetime.split("T")[0]; // Extract date part
      callsByDate[date] = (callsByDate[date] || 0) + 1;
    }
  });

  const dates = Object.keys(callsByDate).sort();
  const counts = dates.map(date => callsByDate[date]);

  const ctx = document.getElementById("volumeChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: dates.length > 0 ? dates : ["No data"],
      datasets: [{
        label: "Calls per Day",
        data: counts.length > 0 ? counts : [0],
        borderColor: "#0284c7",
        backgroundColor: "rgba(2, 132, 199, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

function loadRecentActivity(recentCalls) {
  const tbody = document.getElementById("activityTable");
  tbody.innerHTML = "";

  recentCalls.forEach(call => {
    const row = document.createElement("tr");
    
    const statusBadge = call.outcome === "Scheduled" 
      ? '<span class="status booked">Booked</span>'
      : '<span class="status inquiry">Inquiry</span>';

    row.innerHTML = `
      <td><strong>${call.name}</strong></td>
      <td>${statusBadge}</td>
      <td>${call.duration}</td>
      <td>${call.datetime || "--"}</td>
    `;

    tbody.appendChild(row);
  });
}


/* -------------------- LOAD CALLS -------------------- */
async function loadCalls() {
  const tbody = document.getElementById("callsTable");
  if (!tbody) {
    console.error("callsTable element not found");
    return;
  }

  try {
    const response = await fetch("/api/transcripts");
    if (!response.ok) throw new Error("Failed to load transcripts");
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error("Invalid transcripts response", data);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444">Failed to load calls</td></tr>`;
      return;
    }

    tbody.innerHTML = ""; // Clear loading message

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8">No calls found</td></tr>`;
      return;
    }

    data.forEach(call => {
      const row = document.createElement("tr");
      
      // Generate avatar color based on name
      const avatarBg = getAvatarColor(call.name);
      const initials = call.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      
      // Format date/time
      const dateTime = call.datetime ? formatDateTime(call.datetime) : "--";
      
      // Format outcome with badge
      const badgeClass = call.outcome === "Scheduled" ? "scheduled" : "inquiry";
      const outcomeBadge = `<span class="badge ${badgeClass}">${call.outcome}</span>`;

      row.innerHTML = `
        <td>
          <div class="callerCell">
            <div class="callerAvatar" style="background-color:${avatarBg}">${initials}</div>
            <div>
              <div style="font-weight:600;color:#1e293b">${call.name}</div>
              <div style="font-size:12px;color:#94a3b8">${call.phone || "N/A"}</div>
            </div>
          </div>
        </td>
        <td style="font-size:13px">${dateTime}</td>
        <td style="font-size:13px">${call.duration || "--"}</td>
        <td>${outcomeBadge}</td>
        <td style="font-size:12px;color:#64748b;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${call.snippet || "--"}</td>
        <td>
          <button class="viewBtn" onclick="openTranscriptModal(${data.indexOf(call)})">View</button>
        </td>
      `;

      // Store call data on row for quick access
      row.dataset.callIndex = data.indexOf(call);
      row.dataset.call = JSON.stringify(call);

      tbody.appendChild(row);
    });

    // Update KPI cards if they exist
    updateCallsKPI(data);

  } catch (err) {
    console.error("Load calls error:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444">Error loading calls: ${err.message}</td></tr>`;
  }
}

function updateCallsKPI(data) {
  const totalCallsEl = document.getElementById("totalCalls");
  if (!totalCallsEl) return; // Not on calls page, skip

  const totalCalls = data.length;
  const scheduledCalls = data.filter(c => c.outcome === "Scheduled").length;
  const inquiryCalls = data.filter(c => c.outcome === "Inquiry").length;
  const successRate = totalCalls > 0 ? Math.round((scheduledCalls / totalCalls) * 100) : 0;

  const kpiCards = document.querySelectorAll(".cards .card-value");
  if (kpiCards.length >= 4) {
    kpiCards[0].innerText = totalCalls;
    kpiCards[1].innerText = "3m 42s"; // Average duration - can be calculated if duration data exists
    kpiCards[2].innerText = successRate + "%";
    kpiCards[3].innerText = "$" + (scheduledCalls * 100); // Estimate savings
  }
}

function openTranscriptModal(index) {
  const rows = document.querySelectorAll("#callsTable tr");
  const row = rows[index];
  if (!row) return;

  const call = JSON.parse(row.dataset.call);
  
  // Populate modal with call data
  document.getElementById("modalCallerName").innerText = call.name;
  document.getElementById("modalCallerPhone").innerText = call.phone || "N/A";
  document.getElementById("modalDateTime").innerText = call.datetime ? formatDateTime(call.datetime) : "--";
  
  const badgeClass = call.outcome === "Scheduled" ? "scheduled" : "inquiry";
  document.getElementById("modalOutcome").innerHTML = `<span class="badge ${badgeClass}">${call.outcome}</span>`;
  
  document.getElementById("modalTranscript").innerText = call.transcript || "No transcript available";
  
  // Show modal
  document.getElementById("transcriptModal").classList.add("active");
}

function closeTranscriptModal() {
  document.getElementById("transcriptModal").classList.remove("active");
}

// Close modal when clicking outside content
document.addEventListener("click", (e) => {
  const modal = document.getElementById("transcriptModal");
  if (modal && e.target === modal) {
    closeTranscriptModal();
  }
});

function formatDateTime(dateTimeStr) {
  try {
    const date = new Date(dateTimeStr);
    const options = { 
      month: "short", 
      day: "numeric", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    };
    return date.toLocaleDateString("en-US", options);
  } catch {
    return dateTimeStr;
  }
}

function getAvatarColor(name) {
  const colors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
    "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1"
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/* -------------------- CALENDAR -------------------- */
/* -------------------- CALENDAR -------------------- */
function initCalendar() {
const calendarEl = document.getElementById("calendar");
if (!calendarEl) return; // prevents errors on other pages

calendar = new FullCalendar.Calendar(calendarEl, {


initialView: "dayGridMonth",
height: "auto",
selectable: true,

headerToolbar: {
  left: "prev,next today",
  center: "title",
  right: "dayGridMonth,timeGridWeek,timeGridDay"
},

buttonText: {
  today: "today",
  month: "Month",
  week: "Week",
  day: "Day"
},

/* Block booked dates */
events(fetchInfo, successCallback, failureCallback) {
  fetch("/api/booked-slots")
    .then(res => res.json())
    .then(data => {
      const events = data.map(slot => ({
        start: slot.start,
        end: slot.end || slot.start,
        display: "background",
        backgroundColor: "#fecaca"
      }));
      successCallback(events);
    })
    .catch(failureCallback);
},

select(info) {
  selectedSlot = info;
  alert("Selected: " + info.startStr);
}


});

calendar.render();
}


/* -------------------- CONFIRM BOOKING -------------------- */
function confirmBooking() {
  if (!selectedCall || !selectedSlot) {
    alert("Please select call and slot");
    return;
  }

  fetch("/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        name: selectedCall.name,
  phone: selectedCall.phone,
  datetime: selectedSlot.startStr
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Booking failed");
      return res.json();
    })
    .then(() => {
      alert("Booking saved successfully");
      calendar.refetchEvents();
    })
    .catch(err => {
      console.error(err);
      alert("Failed to save booking");
    });
}
