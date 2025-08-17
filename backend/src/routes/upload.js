const express = require('express')
const multer = require('multer')
const path = require('path')
const router = express.Router()
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (_req, file, cb) => { const ext = path.extname(file.originalname || ''); const name = Date.now() + '-' + Math.random().toString(36).slice(2) + ext; cb(null, name) }
})
const upload = multer({ storage })
router.post('/', upload.single('file'), (req,res)=>{ if (!req.file) return res.status(400).json({ ok:false, error:'no_file' }); const url = `/uploads/${req.file.filename}`; res.json({ ok:true, url }) })
module.exports = router
