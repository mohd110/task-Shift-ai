const { google } = require("googleapis");

module.exports = async function handler(req, res) {
try {
  console.log("📞 [API] Transcripts endpoint called");

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDS),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  console.log("📊 [API] Fetching from Google Sheets...");
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: "Sheet1!A1:Z",
  });

  const rows = response.data.values;
  console.log("✅ [API] Received rows:", rows ? rows.length : 0);
  
  if (!rows || rows.length < 2) {
    console.warn("⚠️ [API] No rows found or insufficient data");
    return res.json([]);
  }

  const headers = rows[0];
  console.log("🔤 [API] Headers found:", headers);

  // Improved column detection with better matching
  const getIndex = (name) => {
    // Try exact match first
    let index = headers.indexOf(name);
    if (index >= 0) {
      console.log(`  ✅ Column "${name}": ${index}`);
      return index;
    }
    
    // Try lowercase match
    index = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    if (index >= 0) {
      console.log(`  ✅ Column "${name}" (case-insensitive): ${index}`);
      return index;
    }
    
    // Try partial match
    index = headers.findIndex(h => h.includes(name) || name.includes(h));
    if (index >= 0) {
      console.log(`  ⚠️ Column "${name}" (partial match): ${index}`);
      return index;
    }
    
    console.log(`  ❌ Column "${name}": NOT FOUND`);
    return -1;
  };

const data = rows.slice(1).map((row, i) => {
  // Map all column indices with improved detection
  const indices = {
    name: getIndex("Name"),
    phone: getIndex("Number") >= 0 ? getIndex("Number") : getIndex("caller_phone"),
    email: getIndex("Email") >= 0 ? getIndex("Email") : getIndex("caller_email"),
    purposeOfCall: getIndex("Purpose of call") >= 0 ? getIndex("Purpose of call") : getIndex("purpose_of_call"),
    booked: getIndex("Booked") >= 0 ? getIndex("Booked") : getIndex("appointment_booked"),
    time: getIndex("Time") >= 0 ? getIndex("Time") : getIndex("appointment_time"),
    keyNotes: getIndex("Key Notes") >= 0 ? getIndex("Key Notes") : getIndex("key_notes"),
    callStarted: getIndex("Call Started") >= 0 ? getIndex("Call Started") : getIndex("call_started"),
    callEnded: getIndex("Call ended") >= 0 ? getIndex("Call ended") : getIndex("call_ended"),
    transcript: getIndex("Transcript") >= 0 ? getIndex("Transcript") : getIndex("transcript"),
    problemType: getIndex("problem_type"),
    teamSize: getIndex("team_size"),
    durationMinutes: getIndex("call_duration_minutes"),
    endedReason: getIndex("ended_reason"),
    callCost: getIndex("call_cost"),
    recordingUrl: getIndex("recording_url"),
    assistantName: getIndex("assistant_name"),
    loggedAt: getIndex("logged_at")
  };

  // Extract data with fallbacks
  const name = (indices.name >= 0 && row[indices.name]) ? row[indices.name].trim() : "Unknown";
  const phone = (indices.phone >= 0 && row[indices.phone]) ? row[indices.phone].trim() : "";
  const email = (indices.email >= 0 && row[indices.email]) ? row[indices.email].trim() : "";
  const purposeOfCall = (indices.purposeOfCall >= 0 && row[indices.purposeOfCall]) ? row[indices.purposeOfCall].trim() : "";
  const transcript = (indices.transcript >= 0 && row[indices.transcript]) ? row[indices.transcript] : "";
  const keyNotes = (indices.keyNotes >= 0 && row[indices.keyNotes]) ? row[indices.keyNotes].trim() : "";
  const callStarted = (indices.callStarted >= 0 && row[indices.callStarted]) ? row[indices.callStarted] : "";
  const callEnded = (indices.callEnded >= 0 && row[indices.callEnded]) ? row[indices.callEnded] : "";
  const problemType = (indices.problemType >= 0 && row[indices.problemType]) ? row[indices.problemType].trim() : "";
  const teamSize = (indices.teamSize >= 0 && row[indices.teamSize]) ? row[indices.teamSize].trim() : "";
  const durationMinutes = (indices.durationMinutes >= 0 && row[indices.durationMinutes]) ? row[indices.durationMinutes].trim() : "";
  const endedReason = (indices.endedReason >= 0 && row[indices.endedReason]) ? row[indices.endedReason].trim() : "";
  const callCost = (indices.callCost >= 0 && row[indices.callCost]) ? row[indices.callCost].trim() : "";
  const recordingUrl = (indices.recordingUrl >= 0 && row[indices.recordingUrl]) ? row[indices.recordingUrl].trim() : "";
  const assistantName = (indices.assistantName >= 0 && row[indices.assistantName]) ? row[indices.assistantName].trim() : "";
  const loggedAt = (indices.loggedAt >= 0 && row[indices.loggedAt]) ? row[indices.loggedAt] : "";

  // Determine outcome
  const bookedValue = (indices.booked >= 0 && row[indices.booked]) ? row[indices.booked].trim().toLowerCase() : "";
  const outcome = bookedValue === "yes" || bookedValue === "true" ? "Scheduled" : "Inquiry";

  // Create snippet from key notes or transcript
  const snippet = keyNotes || transcript.substring(0, 120) || purposeOfCall;

  return {
    callId: i + 1,
    name,
    phone,
    email,
    purposeOfCall,
    transcript,
    outcome,
    datetime: callStarted,
    duration: durationMinutes || "--",
    snippet,
    keyNotes,
    callStarted,
    callEnded,
    problemType,
    teamSize,
    endedReason,
    callCost,
    recordingUrl,
    assistantName,
    loggedAt,
    appointmentTime: indices.time >= 0 ? row[indices.time] : ""
  };
});

console.log("✅ [API] Processed data records:", data.length);
if (data.length > 0) {
  console.log("📌 [API] Sample record:", data[0]);
}

res.status(200).json(data);


} catch (err) {
console.error("❌ [API] Error:", err.message);
console.error("Stack:", err.stack);
res.status(500).json({ error: err.message });
}
};
