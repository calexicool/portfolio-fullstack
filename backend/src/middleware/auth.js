const jwt = require('jsonwebtoken')
function sign(user){ const payload={ id:user.id, email:user.email, isAdmin:!!user.isAdmin }; return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn:'7d' }) }
function authRequired(req,res,next){
  const token=req.cookies?.token; if(!token) return res.status(401).json({ ok:false, error:'unauthorized' })
  try{ req.user = jwt.verify(token, process.env.JWT_SECRET); next() }catch{ return res.status(401).json({ ok:false, error:'invalid' }) }
}
function optionalAuth(req,_res,next){ const t=req.cookies?.token; if(t){ try{ req.user=jwt.verify(t, process.env.JWT_SECRET) }catch{} } next() }
module.exports = { sign, authRequired, optionalAuth }
