const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '50mb' }));
app.set('trust proxy', 1); // для secure cookies за прокси
app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONT_ORIGIN, // например "https://your-frontend.onrender.com"
  credentials: true,                // разрешить куки
}));
app.use(cors({ origin: process.env.FRONT_ORIGIN, credentials: true }));
// простые логи
app.use((req, _res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

/* ================= uploads ================= */
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

/* ================= мягкий CORS ТОЛЬКО для /api ================= */
const allow = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// если origin разрешён — применяем cors(), иначе пропускаем без заголовков CORS
const maybeCors = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next(); // same-origin/серверные

  const allowed =
    allow.length === 0 ||                 // пустой список = разрешаем всё
    allow.includes('*') ||
    allow.includes(origin) ||
    (allow.includes('*.github.io') && origin.endsWith('.github.io'));

  if (!allowed) return next();            // ВАЖНО: не кидаем ошибку и не передаём в cors()
  return cors({ origin, credentials: true })(req, res, next);
};

/* ================= API ================= */
app.use('/api', maybeCors);
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/content', require('./src/routes/content'));
app.use('/api/comments', require('./src/routes/comments'));
app.use('/api/upload', require('./src/routes/upload'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

/* ================= фронт (dist) ================= */
const distDir = path.resolve(__dirname, '..', 'frontend', 'dist');
console.log('[static] using distDir:', distDir);

if (fs.existsSync(distDir)) {
  // 1) отдать ассеты до любого fallback
  app.use('/assets', (req, res, next) => {
    const filePath = path.join(distDir, 'assets', req.path.replace(/^\/+/, ''));
    // отладка — сразу видно, что реально ищем
    // console.log('[assets]', filePath, fs.existsSync(filePath) ? 'FOUND' : 'MISS');
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.sendFile(filePath);
  });

  // 2) остальные статики + index.html
  app.use(express.static(distDir, { index: 'index.html', maxAge: '1h' }));

  // 3) SPA fallback
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  console.log('[static] dist not found:', distDir);
}

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
