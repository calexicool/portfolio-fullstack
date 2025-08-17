// backend/server.js
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001


const allow = (process.env.CORS_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// мидлварь: если origin разрешён — применяем cors, иначе просто пропускаем без заголовков
const maybeCors = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next(); // same-origin / серверные

  const allowed =
    allow.length === 0 ||               // пусто = разрешаем всё
    allow.includes('*') ||
    allow.includes(origin) ||
    (allow.includes('*.github.io') && origin.endsWith('.github.io'));

  if (!allowed) return next();          // ВАЖНО: просто идём дальше, БЕЗ cors()

  // допустим origin — навешиваем cors с нужными опциями
  return cors({ origin, credentials: true })(req, res, next);
};

// … uploads как было
app.use('/uploads', express.static(uploadsDir));

// CORS только на API и через наш maybeCors
app.use('/api', maybeCors);
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/content', require('./src/routes/content'));
app.use('/api/comments', require('./src/routes/comments'));
app.use('/api/upload', require('./src/routes/upload'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));


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
