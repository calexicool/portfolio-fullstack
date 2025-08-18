const express = require('express')
const rateLimit = require('express-rate-limit')
const crypto = require('crypto')
const { nanoid } = require('nanoid')
const { files, readJSON, writeJSON, ensureInitialized } = require('../utils/store')
const { optionalAuth, requireModerator } = require('../middleware/auth')
const router = express.Router()

const addLimiter = rateLimit({ windowMs: 15*1000, max: 3, standardHeaders: true, legacyHeaders: false })


function fp(req){
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '0'
  const ua = req.headers['user-agent'] || ''
  const salt = process.env.SERVER_SALT || 'x'
  return crypto.createHash('sha256').update(ip + ua + salt).digest('hex')
}

router.get('/', optionalAuth, async (_req,res)=>{
  await ensureInitialized()
  const list = await readJSON(files.comments, [])
  res.json(list)
})
router.post('/', addLimiter, async (req,res)=>{
  await ensureInitialized()
  const { name, text, parentId=null } = req.body || {}
  const bad = (s='')=> (s||'').toLowerCase().match(/(crypto|casino|viagra|xxx)/) || ((s||'').match(/https?:\/\//g)||[]).length>2 || (s||'').length>2000
  if(!text || bad(text)) return res.status(400).json({ ok:false, error:'spam_or_empty' })
  const list = await readJSON(files.comments, [])
  const c = { id:nanoid(), parentId: parentId||null, name: (name||'Гость').slice(0,80), text: String(text).slice(0,4000), createdAt: new Date().toISOString(), likes:0, approved:false, voters:[] }
  list.unshift(c); await writeJSON(files.comments, list)
  res.json({ ok:true, list })
})
router.post('/like', async (req,res)=>{
  await ensureInitialized()
  const { id } = req.body || {}
  const list = await readJSON(files.comments, [])
  const i = list.findIndex(c=>c.id===id)
  if(i<0) return res.status(404).json({ ok:false })
  const mark = fp(req); if(!list[i].voters) list[i].voters = []
  if(!list[i].voters.includes(mark)){ list[i].voters.push(mark); list[i].likes = (list[i].likes||0)+1; await writeJSON(files.comments, list) }
  res.json({ ok:true, list })
})
const ALLOW = new Set(['owner','admin','editor']);

router.post('/approve', requireModerator, async (req,res)=>{
  await ensureInitialized();
  if (!req.user || !ALLOW.has(req.user.role)) {
    return res.status(401).send('unauthorized');
  }
  const { id } = req.body || {};
  const list = await readJSON(files.comments, []);
  const i = list.findIndex(c => c.id === id);
  if (i < 0) return res.status(404).json({ ok:false });
  list[i].approved = true;
  await writeJSON(files.comments, list);
  res.json({ ok:true, list });
});

router.post('/remove',  requireModerator, async (req,res)=>{
  await ensureInitialized();
  if (!req.user || !ALLOW.has(req.user.role)) {
    return res.status(401).send('unauthorized');
  }
  const { id } = req.body || {};
  let list = await readJSON(files.comments, []);
  const ids = new Set([id]); let changed = true;
  while (changed) {
    changed = false;
    for (const c of list) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id); changed = true;
      }
    }
  }
  list = list.filter(c => !ids.has(c.id));
  await writeJSON(files.comments, list);
  res.json({ ok:true, list });
});

module.exports = router
