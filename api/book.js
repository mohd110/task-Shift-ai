export default async function handler(req, res) {
  const { name, phone, datetime } = req.body;

  await fetch(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: `Hello ${name}, your Task Shift AI slot is booked for ${datetime}.`,
        },
      }),
    }
  );

  res.status(200).json({ success: true });
}
