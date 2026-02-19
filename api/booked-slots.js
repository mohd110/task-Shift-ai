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
    
    // Helper to find column index - more robust
    const getIndex = (name) => {
      // Try exact match first
      let index = headers.indexOf(name);
      if (index >= 0) return index;
      
      // Try lowercase match
      index = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
      if (index >= 0) return index;
      
      // Try partial match
      index = headers.findIndex(h => h.includes(name) || name.includes(h));
      console.warn(`⚠️ Column "${name}" not found exactly, using partial match at index ${index}`);
      return index;
    };

    const nameIdx = getIndex("Name");
    const phoneIdx = getIndex("Number");
    const emailIdx = getIndex("Email");
    const purposeIdx = getIndex("Purpose of call");
    const noteIdx = getIndex("Key Notes");
    const durationIdx = getIndex("call_duration_minutes");
    const bookedStatusIdx = getIndex("Booked");
    const scheduledDateIdx = getIndex("Time");

    console.log("✅ Column indices found:", {
      nameIdx, phoneIdx, emailIdx, purposeIdx, noteIdx, durationIdx, bookedStatusIdx, scheduledDateIdx
    });
    
    // Log first row with column values
    if (rows.length > 1) {
      const firstRow = rows[1];
      console.log("📍 First row values:", {
        name: firstRow[nameIdx],
        phone: firstRow[phoneIdx],
        email: firstRow[emailIdx],
        purpose: firstRow[purposeIdx],
        booked: firstRow[bookedStatusIdx],
        time: firstRow[scheduledDateIdx]
      });
    }

    // Extract booked slots with full details
    const bookedSlots = rows
      .slice(1)
      .filter(r => {
        const bookedStatus = r[bookedStatusIdx] ? r[bookedStatusIdx].trim().toLowerCase() : "";
        let timeValue = r[scheduledDateIdx] ? r[scheduledDateIdx].trim() : "";
        
        // Remove quotes if present
        timeValue = timeValue.replace(/^"|"$/g, '');
        
        const hasDate = timeValue && timeValue.length > 0;
        const isBooked = bookedStatus === "yes" || bookedStatus === "true" || bookedStatus === "booked" || bookedStatus === "1";
        
        return isBooked && hasDate;
      })
      .map((r, i) => {
        try {
          let startTime = r[scheduledDateIdx] ? r[scheduledDateIdx].trim() : "";
          // Remove quotes if present
          startTime = startTime.replace(/^"|"$/g, '');
          
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
