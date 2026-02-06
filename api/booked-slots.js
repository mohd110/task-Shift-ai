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
      range: "Sheet1!A2:F",
    });

    const rows = response.data.values || [];

    // Extract booked slots
    const bookedSlots = rows
      .filter(r => r[5] === "BOOKED" && r[4]) // booking_status + scheduled_datetime
      .map(r => ({
        start: r[4],
        end: r[4], // same slot (we’ll add duration in frontend)
      }));

    res.status(200).json(bookedSlots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
