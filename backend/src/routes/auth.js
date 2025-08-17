const express = require('express')
const bcrypt = require('bcrypt')
const { nanoid } = require('nanoid')
const { files, readJSON, writeJSON, ensureInitialized } = require('../utils/store')
const { sign, optionalAuth } = require('../middleware/auth')
const router = express.Router()

router.post('/init', async (req,res)=>{
  await ensureInitialized()
  const { inviteCode, email, password } = req.body || {}
  if(!inviteCode || inviteCode !== process.env.ADMIN_INVITE_CODE) return res.status(403).json({ ok:false, error:'forbidden' })
  if(!email || !password) return res.status(400).json({ ok:false, error:'bad_request' })
  const users = await readJSON(files.users, [])
  if(users.some(u=>u.isAdmin)) return res.status(400).json({ ok:false, error:'already_initialized' })
  const hash = await bcrypt.hash(password, 12)
  const user = { id: nanoid(), email, passwordHash: hash, isAdmin: true, createdAt: new Date().toISOString() }
  users.push(user); await writeJSON(files.users, users)
  const token = sign(user); res.cookie('token', token, { httpOnly:true, sameSite:'lax' })
  return res.json({ ok:true })
})
router.post('/login', async (req,res)=>{
  await ensureInitialized()
  const { email, password } = req.body || {}
  const users = await readJSON(files.users, [])
  const user = users.find(u=>u.email === email)
  if(!user) return res.status(400).json({ ok:false, error:'invalid' })
  const ok = await bcrypt.compare(password, user.passwordHash || '')
  if(!ok) return res.status(400).json({ ok:false, error:'invalid' })
  const token = sign(user); res.cookie('token', token, { httpOnly:true, sameSite:'lax' })
  return res.json({ ok:true })
})
router.post('/logout', async (_req,res)=>{ res.clearCookie('token'); res.json({ ok:true }) })
router.get('/me', optionalAuth, (req,res)=>{ if(!req.user) return res.json(null); res.json({ email:req.user.email, isAdmin:!!req.user.isAdmin }) })
module.exports = router
