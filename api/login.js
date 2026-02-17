export default async function handler(req, res) {
  const { password } = req.body;

  if(password !== process.env.ADMIN_PASSWORD){
    return res.status(401).json({error:"Invalid"});
  }

  res.setHeader(
    "Set-Cookie",
    "session=valid; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax"
  );

  res.status(200).json({success:true});
}
