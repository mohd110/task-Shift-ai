const { google } = require("googleapis");

module.exports = async function handler(req, res) {
  try {
    const { callId, datetime } = req.body;

    if (!callId || !datetime) {
      return res.status(400).json({ error: "Missing callId or datetime" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 1️⃣ Read all rows
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A2:F",
    });

    const rows = readResponse.data.values || [];

    // 2️⃣ Find row index by call_id
    const rowIndex = rows.findIndex(r => r[0] == callId);

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Call ID not found" });
    }

    // 3️⃣ Calculate exact row number in sheet
    const sheetRowNumber = rowIndex + 2;

    console.log("DEBUG callId:", callId);
console.log("DEBUG rowIndex:", rowIndex);
console.log("DEBUG writing to row:", sheetRowNumber);

await sheets.spreadsheets.values.update({
  spreadsheetId: process.env.SHEET_ID,
  range: `Sheet1!E${sheetRowNumber}:F${sheetRowNumber}`,
  valueInputOption: "RAW",
  requestBody: {
    values: [[datetime, "BOOKED"]],
  },
});


    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
