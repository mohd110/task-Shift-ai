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
      name: selectedCall.name,
      phone: selectedCall.phone,
      datetime: selectedSlot.startStr
    })
  })
    .then(res => res.json())
    .then(() => alert("WhatsApp sent successfully"));
}
