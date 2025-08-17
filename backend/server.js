const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:5173'

app.use(express.json({ limit: '50mb' }))
app.use(cookieParser())
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))

app.use((req,res,next)=>{ console.log(new Date().toISOString(), req.method, req.url); next() })

const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/content', require('./src/routes/content'))
app.use('/api/comments', require('./src/routes/comments'))
app.use('/api/upload', require('./src/routes/upload'))

app.get('/api/health', (_req,res)=>res.json({ ok:true }))
app.listen(PORT, ()=>console.log(`API listening on http://127.0.0.1:${PORT}`))
