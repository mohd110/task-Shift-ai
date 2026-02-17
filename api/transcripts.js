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
const getIndex = (name) => headers.indexOf(name);

const data = rows.slice(1).map((row, i) => {

  const name =
    row[getIndex("caller_name")] ||
    row[getIndex("Name")] ||
    "Unknown";

  const phone =
    row[getIndex("caller_phone")] ||
    row[getIndex("Number")] ||
    "";

  const transcript =
    row[getIndex("transcript")] || "";

  const bookedValue = (row[getIndex("appointment_booked")] || "").trim().toLowerCase();
  const outcome = bookedValue === "yes" ? "Scheduled" : "Inquiry";

  const datetime =
    row[getIndex("call_started")] || "";

  const duration =
    row[getIndex("call_duration_minutes")]
      ? row[getIndex("call_duration_minutes")] + " min"
      : "--";

  const snippet =
    row[getIndex("key_notes")] ||
    transcript.substring(0, 120);

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
