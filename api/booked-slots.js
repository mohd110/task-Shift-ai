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
    console.log("📋 Headers:", headers);
    
    // Helper to find column index
    const getIndex = (name) => {
      const index = headers.indexOf(name);
      return index >= 0 ? index : headers.indexOf(name.toLowerCase());
    };

    const nameIdx = getIndex("Name");
    const phoneIdx = getIndex("Number");
    const emailIdx = getIndex("Email");
    const purposeIdx = getIndex("Purpose of call");
    const noteIdx = getIndex("Key Notes");
    const durationIdx = getIndex("call_duration_minutes");
    const bookedStatusIdx = getIndex("Booked"); // Changed from index 5
    const scheduledDateIdx = getIndex("Time"); // Changed from index 4

    console.log("Column indices:", {
      nameIdx, phoneIdx, emailIdx, purposeIdx, noteIdx, durationIdx, bookedStatusIdx, scheduledDateIdx
    });

    // Log first few rows for debugging
    console.log("📋 Sample rows:");
    rows.slice(1, 4).forEach((row, idx) => {
      console.log(`Row ${idx}:`, {
        name: row[nameIdx],
        booked: row[bookedStatusIdx],
        time: row[scheduledDateIdx]
      });
    });

    // Extract booked slots with full details
    const bookedSlots = rows
      .slice(1)
      .filter(r => {
        const bookedStatus = r[bookedStatusIdx] ? r[bookedStatusIdx].trim().toLowerCase() : "";
        const hasDate = r[scheduledDateIdx] && r[scheduledDateIdx].trim();
        const isBooked = bookedStatus === "yes" || bookedStatus === "true" || bookedStatus === "booked" || bookedStatus === "1";
        
        if (hasDate) {
          console.log(`Checking row: booked="${bookedStatus}" (${isBooked}), hasDate=${hasDate}`);
        }
        return isBooked && hasDate;
      })
      .map((r, i) => {
        try {
          const startTime = r[scheduledDateIdx];
          const durationMins = parseInt(r[durationIdx]) || 60;
          
          // Calculate end time
          const startDate = new Date(startTime);
          const endDate = new Date(startDate.getTime() + durationMins * 60000);
          const endTime = endDate.toISOString();

          return {
            id: i,
            start: startTime,
            end: endTime,
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
        } catch (mapErr) {
          console.error("Error mapping slot:", mapErr, r);
          return null;
        }
      })
      .filter(slot => slot !== null);

    console.log("✅ Booked Slots found:", bookedSlots.length);
    res.status(200).json(bookedSlots);
  } catch (err) {
    console.error("❌ Booked slots error:", err);
    res.status(500).json({ error: err.message });
  }
};
