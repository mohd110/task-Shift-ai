let selectedCall = null;
let selectedSlot = null;

// Load calls
fetch("/api/transcripts")
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("callList");

    data.forEach(call => {
      const div = document.createElement("div");
      div.className = "call";
      div.innerText = `${call.name} (${call.phone})`;
      div.onclick = () => selectCall(call);
      list.appendChild(div);
    });
  });

function selectCall(call) {
  selectedCall = call;
  document.getElementById("transcript").innerText = call.transcript;
}

// Calendar
const calendar = new FullCalendar.Calendar(
  document.getElementById("calendar"),
  {
    initialView: "timeGridWeek",
    selectable: true,

    events: function(fetchInfo, successCallback, failureCallback) {
      fetch("/api/booked-slots")
        .then(res => res.json())
        .then(data => {
          const events = data.map(slot => ({
            start: slot.start,
            end: slot.start,
            display: "background",
            backgroundColor: "#ff4d4f" // blocked slot color
          }));
          successCallback(events);
        })
        .catch(failureCallback);
    },

    selectAllow: function(selectInfo) {
      const events = calendar.getEvents();
      return !events.some(event =>
        event.startStr === selectInfo.startStr
      );
    },

    select: info => {
      selectedSlot = info;
      alert("Selected: " + info.startStr);
    }
  }
);

calendar.render();


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
    .then(res => res.json())
    .then(() => alert("Booking saved successfully"));
}

