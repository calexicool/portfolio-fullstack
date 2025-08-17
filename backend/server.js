// backend/server.js
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS: можно оставить пустым для same-origin; или перечислить домены через запятую
// --- CORS только для /api ---
// список доменов можно задать через CORS_ORIGIN="https://a.com,https://b.com"
const allow = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsMw = cors({
  credentials: true,
  origin(origin, cb) {
    // same-origin/серверные запросы — пропускаем
    if (!origin) return cb(null, true);

    // если список не задан — разрешаем всё
    if (allow.length === 0) return cb(null, true);

    const ok =
      allow.includes('*') ||
      allow.includes(origin) ||
      (allow.includes('*.github.io') && origin.endsWith('.github.io'));

    // ВАЖНО: не бросаем Error — просто не добавляем CORS-заголовки
    cb(null, ok);
  },
});



app.use(express.json({ limit: '50mb' }))
app.use(cookieParser())

// простые логи
app.use((req, _res, next) => { console.log(new Date().toISOString(), req.method, req.url); next() })

// uploads (на Persistent Disk)
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// API
app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/content', require('./src/routes/content'))
app.use('/api/comments', require('./src/routes/comments'))
app.use('/api/upload', require('./src/routes/upload'))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ===== Раздача фронта из ../frontend/dist (один домен) =====
const distDir = require('path').resolve(__dirname, '..', 'frontend', 'dist');

if (fs.existsSync(distDir)) {
  // 1) ассеты
  app.use('/assets', express.static(path.join(distDir, 'assets'), {
    maxAge: '1y',
    immutable: true
  }));
  // 2) остальные статические файлы + index.html
  app.use(express.static(distDir, { index: 'index.html', maxAge: '1h' }));
  // 3) SPA-фолбек
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  console.log('[static] dist not found:', distDir);
}


app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
