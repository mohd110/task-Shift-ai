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

    const rows = response.data.values || [];
    if (rows.length < 2) return res.json([]);

    const headers = rows[0];
    
    // Helper to find column index
    const getIndex = (name) => {
      const index = headers.indexOf(name);
      return index >= 0 ? index : headers.indexOf(name.toLowerCase());
    };

    // Extract booked slots with full details
    const bookedSlots = rows
      .slice(1)
      .filter(r => r[5] === "BOOKED" && r[4]) // booking_status + scheduled_datetime
      .map((r, i) => {
        const nameIdx = getIndex("Name");
        const phoneIdx = getIndex("Number");
        const emailIdx = getIndex("Email");
        const purposeIdx = getIndex("Purpose of call");
        const noteIdx = getIndex("Key Notes");
        const durationIdx = getIndex("call_duration_minutes");

        return {
          id: i,
          start: r[4], // scheduled_datetime
          end: r[4],
          title: `${r[nameIdx] || "Client"} - ${r[purposeIdx] || "Appointment"}`,
          name: r[nameIdx] || "Unknown",
          phone: r[phoneIdx] || "",
          email: r[emailIdx] || "",
          purpose: r[purposeIdx] || "",
          notes: r[noteIdx] || "",
          duration: r[durationIdx] || "60",
          backgroundColor: "#fecaca",
          borderColor: "#fca5a5"
        };
      });

    res.status(200).json(bookedSlots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
