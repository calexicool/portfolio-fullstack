// backend/server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// простые логи
app.use((req, _res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// ===== uploads (сначала объявляем и только потом используем) =====
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ===== CORS ТОЛЬКО ДЛЯ /api (никаких бросков ошибок) =====
const allow = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// если origin разрешён — применяем cors(), иначе пропускаем запрос без заголовков CORS
const maybeCors = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next(); // same-origin/серверные

  const allowed =
    allow.length === 0 ||                 // пусто = разрешаем всё
    allow.includes('*') ||
    allow.includes(origin) ||
    (allow.includes('*.github.io') && origin.endsWith('.github.io'));

  if (!allowed) return next();            // ВАЖНО: просто идём дальше, НЕ кидаем ошибку
  return cors({ origin, credentials: true })(req, res, next);
};

// ===== API =====
app.use('/api', maybeCors);
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/content', require('./src/routes/content'));
app.use('/api/comments', require('./src/routes/comments'));
app.use('/api/upload', require('./src/routes/upload'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ===== Раздача фронта из ../frontend/dist =====
const distDir = path.resolve(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  // 1) ассеты
  app.use('/assets', express.static(path.join(distDir, 'assets'), {
    immutable: true,
    maxAge: '1y',
  }));
  // 2) статика и index.html
  app.use(express.static(distDir, { index: 'index.html', maxAge: '1h' }));
  // 3) SPA fallback
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  console.log('[static] dist not found:', distDir);
}

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
