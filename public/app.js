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
function loadCalls() {
  const list = document.getElementById("callList");
  if (!list) {
    console.error("callList element not found");
    return;
  }

  list.innerHTML = "<h3>Calls</h3>";

  fetch("/api/transcripts")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load transcripts");
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error("Invalid transcripts response", data);
        return;
      }

      data.forEach(call => {
        const div = document.createElement("div");
        div.className = "call";
        div.innerText = `${call.name} (${call.phone})`;

        div.onclick = () => selectCall(call);

        list.appendChild(div);
      });
    })
    .catch(err => {
      console.error(err);
      list.innerHTML +=
        "<p style='color:#ff4d4f'>Failed to load calls</p>";
    });
}

function selectCall(call) {
  selectedCall = call;
  const transcriptEl = document.getElementById("transcript");

  if (transcriptEl) {
    transcriptEl.innerText = call.transcript || "No transcript available";
  }
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
