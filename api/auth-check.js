module.exports = function handler(req, res) {
  const cookie = req.headers.cookie || "";

  if(!cookie.includes("session=valid")){
    return res.status(401).json({authenticated:false});
  }

  res.status(200).json({authenticated:true});
};
