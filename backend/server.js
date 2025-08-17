// backend/server.js
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Если фронт и бэк на одном домене (Render) — CORS не обязателен.
// Оставлю гибкую схему: можно перечислить несколько origin через запятую в CORS_ORIGIN.
const origins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)           // same-origin/серверные запросы
    if (origins.length === 0) return cb(null, true)
    const ok = origins.some(o => {
      if (o === '*') return true
      if (o === '*.github.io' && origin.endsWith('.github.io')) return true
      return origin === o
    })
    cb(ok ? null : new Error('Not allowed by CORS'), ok)
  }
}))

app.use(express.json({ limit: '50mb' }))
app.use(cookieParser())

// Логи
app.use((req, _res, next) => { console.log(new Date().toISOString(), req.method, req.url); next() })

// uploads (папка сохраняется на Persistent Disk)
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// API
app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/content', require('./src/routes/content'))
app.use('/api/comments', require('./src/routes/comments'))
app.use('/api/upload', require('./src/routes/upload'))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ===== раздача фронта (same-origin) =====
// ВАЖНО: server.js лежит в backend/, значит идём на один уровень вверх.
const distDir = path.resolve(__dirname, '..', 'frontend', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { index: 'index.html', maxAge: '1h' }))
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
} else {
  console.log('[static] dist not found:', distDir)
}

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
