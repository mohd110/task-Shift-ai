const { google } = require("googleapis");

module.exports = async function handler(req, res) {
try {

const { name, phone, datetime } = req.body;

if (!name || !phone || !datetime) {
  return res.status(400).json({ error: "Missing booking data" });
}

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// 1️⃣ Read entire sheet
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: process.env.SHEET_ID,
  range: "Sheet1!A1:Z",
});

const rows = response.data.values;
if (!rows || rows.length < 2)
  return res.status(404).json({ error: "Sheet empty" });

const headers = rows[0];

const colIndex = (name) => headers.indexOf(name);

const nameCol =
  colIndex("caller_name") !== -1
    ? colIndex("caller_name")
    : colIndex("Name");

const phoneCol =
  colIndex("caller_phone") !== -1
    ? colIndex("caller_phone")
    : colIndex("Number");

const bookedCol = colIndex("appointment_booked");
const timeCol = colIndex("appointment_time");

// 2️⃣ find correct row
let targetRow = -1;

rows.slice(1).forEach((row, i) => {
  const rName = row[nameCol] || "";
  const rPhone = row[phoneCol] || "";

  if (
    rName.trim().toLowerCase() === name.trim().toLowerCase() &&
    rPhone.replace(/\s/g, "") === phone.replace(/\s/g, "")
  ) {
    targetRow = i + 2;
  }
});

if (targetRow === -1)
  return res.status(404).json({ error: "Caller not found in sheet" });

// 3️⃣ write booking
const colLetter = (index) =>
  String.fromCharCode(65 + index);

const bookedCell = `${colLetter(bookedCol)}${targetRow}`;
const timeCell = `${colLetter(timeCol)}${targetRow}`;

await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: process.env.SHEET_ID,
  requestBody: {
    valueInputOption: "RAW",
    data: [
      {
        range: bookedCell,
        values: [["Yes"]],
      },
      {
        range: timeCell,
        values: [[datetime]],
      },
    ],
  },
});

res.status(200).json({ success: true });


} catch (err) {
console.error(err);
res.status(500).json({ error: err.message });
}
};
