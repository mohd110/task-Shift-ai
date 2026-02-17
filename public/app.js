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

});


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
      callId: selectedCall.callId,
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
