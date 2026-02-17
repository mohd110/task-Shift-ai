const { google } = require("googleapis");

module.exports = async function handler(req, res) {
try {


const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

const response = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.SHEET_ID,
  range: "Sheet1!A1:Z",
});

const rows = response.data.values;
if (!rows || rows.length < 2) return res.json([]);

const headers = rows[0];
console.log("Headers found:", headers);

const getIndex = (name) => {
  const index = headers.indexOf(name);
  console.log(`Column "${name}":`, index);
  return index;
};

const data = rows.slice(1).map((row, i) => {
  // Use the actual column names from the sheet
  const nameIdx = getIndex("Name");
  const phoneIdx = getIndex("Number");
  const transcriptIdx = getIndex("Transcript");
  const bookedIdx = getIndex("Booked");
  const datetimeIdx = getIndex("Call Started");
  const notesIdx = getIndex("Key Notes");

  const name = (nameIdx >= 0 && row[nameIdx]) ? row[nameIdx].trim() : "Unknown";
  const phone = (phoneIdx >= 0 && row[phoneIdx]) ? row[phoneIdx].trim() : "";
  const transcript = (transcriptIdx >= 0 && row[transcriptIdx]) ? row[transcriptIdx] : "";
  
  const bookedValue = (bookedIdx >= 0 && row[bookedIdx]) ? row[bookedIdx].trim().toLowerCase() : "";
  const outcome = bookedValue === "yes" ? "Scheduled" : "Inquiry";
  
  const datetime = (datetimeIdx >= 0 && row[datetimeIdx]) ? row[datetimeIdx] : "";
  const duration = "--"; // Not available in current columns
  const snippet = (notesIdx >= 0 && row[notesIdx]) ? row[notesIdx] : transcript.substring(0, 120);

  return {
    callId: i + 1,
    name,
    phone,
    transcript,
    outcome,
    datetime,
    duration,
    snippet
  };
});

res.status(200).json(data);


} catch (err) {
console.error(err);
res.status(500).json({ error: err.message });
}
};
