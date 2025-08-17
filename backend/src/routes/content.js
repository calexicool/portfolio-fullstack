const express = require('express')
const { files, readJSON, writeJSON, ensureInitialized } = require('../utils/store')
const { optionalAuth, authRequired } = require('../middleware/auth')
const router = express.Router()

router.get('/', optionalAuth, async (_req,res)=>{
  await ensureInitialized()
  const saved = await readJSON(files.content, { content:null })
  res.json(saved.content ?? null)
})
router.post('/', authRequired, async (req,res)=>{
  await ensureInitialized()
  const { content } = req.body || {}
  if(typeof content !== 'object' || content===null) return res.status(400).json({ ok:false, error:'bad_content' })
  await writeJSON(files.content, { content })
  res.json({ ok:true })
})
module.exports = router
