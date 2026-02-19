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
console.log("🚀 DOMContentLoaded event fired");

// Only run call system on call page
if (document.getElementById("callsTable")) {
  console.log("📋 Calls table found - loading calls");
  loadCalls();
} else {
  console.log("⚠️ Calls table NOT found on this page");
}

// Only run calendar on calendar page
if (document.getElementById("calendar")) {
  console.log("📅 Calendar found - initializing calendar");
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
    console.error("❌ callsTable element not found");
    return;
  }

  console.log("📞 Starting to load calls...");

  try {
    console.log("🔄 Fetching from /api/transcripts");
    const response = await fetch("/api/transcripts");
    console.log("📦 Response status:", response.status);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const data = await response.json();
    console.log("✅ API Response received:", data);
    console.log("📊 Total records:", data.length);
    
    if (!Array.isArray(data)) {
      console.error("❌ Response is not an array:", typeof data, data);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444">Invalid data format</td></tr>`;
      return;
    }

    tbody.innerHTML = ""; // Clear loading message

    if (data.length === 0) {
      console.warn("⚠️ No calls found in response");
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8">No calls found</td></tr>`;
      return;
    }

    console.log("🎯 First call sample:", data[0]);

    data.forEach((call, index) => {
      console.log(`📌 Processing call ${index + 1}:`, {
        name: call.name,
        phone: call.phone,
        datetime: call.datetime,
        duration: call.duration,
        outcome: call.outcome
      });

      const row = document.createElement("tr");
      
      // Generate avatar color based on name
      const avatarBg = getAvatarColor(call.name);
      const initials = call.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      
      // Format date/time - use appointmentTime if available, otherwise use callStarted
      const displayTime = call.appointmentTime || call.datetime;
      const dateTime = displayTime ? formatDateTime(displayTime) : "--";
      
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
        <td style="font-size:13px">${call.duration || "--"}${call.duration && call.duration !== "--" ? " min" : ""}</td>
        <td>${outcomeBadge}</td>
        <td style="font-size:12px;color:#64748b;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${call.snippet || "--"}</td>
        <td>
          <button class="viewBtn" onclick="openTranscriptDetail(${index})">View</button>
        </td>
      `;

      // Store call data on row for quick access
      row.dataset.callIndex = index;
      row.dataset.call = JSON.stringify(call);

      tbody.appendChild(row);
    });

    console.log("✅ All calls rendered successfully");

    // Update KPI cards if they exist
    updateCallsKPI(data);

  } catch (err) {
    console.error("❌ Load calls error:", err);
    console.error("Error stack:", err.stack);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444">Error: ${err.message}</td></tr>`;
  }
}

function updateCallsKPI(data) {
  const totalCallsEl = document.getElementById("totalCalls");
  if (!totalCallsEl) {
    console.warn("⚠️ totalCalls element not found, skipping KPI update");
    return; // Not on calls page, skip
  }

  console.log("📊 Updating KPI metrics...");

  const totalCalls = data.length;
  const scheduledCalls = data.filter(c => c.outcome === "Scheduled").length;
  
  // Calculate success rate: calls with duration > 1 minute
  const successfulCalls = data.filter(d => {
    const duration = parseInt(d.duration) || 0;
    return duration > 1;
  }).length;
  const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;
  
  // Calculate average duration
  const totalDuration = data.reduce((sum, d) => {
    return sum + (parseInt(d.duration) || 0);
  }, 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
  
  // Total savings: $10 per booked call
  const totalSavings = scheduledCalls * 10;

  console.log("📈 KPI Metrics calculated:", {
    totalCalls,
    avgDuration: avgDuration + "m",
    successRate: successRate + "%",
    totalSavings: "$" + totalSavings,
    scheduledCalls,
    successfulCalls
  });

  const kpiCards = document.querySelectorAll(".cards .card-value");
  console.log("🎴 Found KPI cards:", kpiCards.length);
  
  if (kpiCards.length >= 4) {
    kpiCards[0].innerText = totalCalls;
    kpiCards[1].innerText = avgDuration + "m";
    kpiCards[2].innerText = successRate + "%";
    kpiCards[3].innerText = "$" + totalSavings;
    console.log("✅ KPI cards updated");
  } else {
    console.warn("⚠️ Expected 4 KPI cards, found:", kpiCards.length);
  }
}

function openTranscriptDetail(index) {
  const rows = document.querySelectorAll("#callsTable tr");
  const row = rows[index];
  if (!row) return;

  const call = JSON.parse(row.dataset.call);
  
  // Store call data in sessionStorage to pass to detail page
  sessionStorage.setItem("selectedCall", JSON.stringify(call));
  
  // Navigate to transcript detail page
  window.location.href = "/transcript-detail.html";
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
let bookedSlotsData = [];

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
      bookedSlotsData = data; // Store for later reference
      const events = data.map(slot => ({
        id: slot.id,
        title: `${slot.name} - ${slot.purpose}`,
        start: slot.start,
        end: slot.end,
        display: "block",
        backgroundColor: "#fecaca",
        borderColor: "#fca5a5",
        textColor: "#7f1d1d",
        extendedProps: {
          name: slot.name,
          phone: slot.phone,
          email: slot.email,
          purpose: slot.purpose,
          notes: slot.notes,
          duration: slot.duration
        }
      }));
      console.log("📅 Calendar events:", events);
      successCallback(events);
    })
    .catch(err => {
      console.error("❌ Error fetching booked slots:", err);
      failureCallback(err);
    });
},

dateClick(info) {
  const selectedDate = info.dateStr;
  displaySlotsForDate(selectedDate);
},

select(info) {
  selectedSlot = info;
  const selectedDate = info.startStr;
  displaySlotsForDate(selectedDate);
}


});

calendar.render();
}

function displaySlotsForDate(dateStr) {
  // Find all slots for this date
  const slotsForDate = bookedSlotsData.filter(slot => {
    const slotDate = slot.start.split("T")[0]; // Get date part
    return slotDate === dateStr;
  });

  const dateTitle = document.getElementById("selectedDateTitle");
  const slotsContainer = document.getElementById("slotsContainer");
  const noSlotsMessage = document.getElementById("noSlotsMessage");

  if (slotsForDate.length === 0) {
    dateTitle.textContent = `${formatDateDisplay(dateStr)} - No booked slots`;
    slotsContainer.style.display = "none";
    noSlotsMessage.style.display = "block";
    return;
  }

  dateTitle.textContent = `${formatDateDisplay(dateStr)} (${slotsForDate.length} slot${slotsForDate.length > 1 ? "s" : ""})`;
  noSlotsMessage.style.display = "none";
  slotsContainer.style.display = "block";
  slotsContainer.innerHTML = "";

  slotsForDate.forEach(slot => {
    const slotEl = document.createElement("div");
    slotEl.className = "slotCard";
    
    const timeStr = formatTime(slot.start);
    const avatarBg = getAvatarColor(slot.name);
    const initials = slot.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    slotEl.innerHTML = `
      <div style="display: flex; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fafbfc; margin-bottom: 12px;">
        <div style="background-color: ${avatarBg}; color: white; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0;">
          ${initials}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${slot.name}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">${slot.phone}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Time:</strong> ${timeStr}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Duration:</strong> ${slot.duration} min</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Purpose:</strong> ${slot.purpose}</div>
          ${slot.notes ? `<div style="font-size: 12px; color: #475569; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;"><strong>Notes:</strong> ${slot.notes}</div>` : ""}
        </div>
      </div>
    `;
    
    slotsContainer.appendChild(slotEl);
  });
}

function formatDateDisplay(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const options = { weekday: "long", month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function formatTime(dateTimeStr) {
  try {
    const date = new Date(dateTimeStr);
    const options = { hour: "2-digit", minute: "2-digit", hour12: true };
    return date.toLocaleTimeString("en-US", options);
  } catch {
    return dateTimeStr;
  }
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
