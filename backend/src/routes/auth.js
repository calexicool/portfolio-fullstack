// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const COOKIE_NAME = 'uid';
const isProd = process.env.NODE_ENV === 'production';

// -------- мини-"БД" в файле --------
const DB_PATH = path.join(__dirname, '../../storage/admins.json');
const DB_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], invites: [] }, null, 2));
}

const readDB  = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = (d) => fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
const publicUser = (u) => {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
};

// --------- auth middlewares ----------
function requireAuth(req, res, next) {
  const id = req.cookies?.[COOKIE_NAME];
  if (!id) return res.status(401).json({ error: 'unauthorized' });
  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user) return requireAuth(req, res, () => requireAdmin(req, res, next));
  if (!['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

// ================= ROUTES =================

// 1) Первый админ (одноразовая инициализация)
router.post('/init', async (req, res) => {
  const { code, email, password, role = 'owner' } = req.body || {};
  const db = readDB();
  if (db.users.length > 0) return res.status(400).json({ error: 'already-initialized' });

  const expected = String(process.env.INIT_CODE || '72405');
  if (String(code) !== expected) return res.status(400).json({ error: 'bad-code' });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = { id: Date.now().toString(36), email: String(email), role, passwordHash };
  db.users.push(user);
  writeDB(db);

  // автологин
  res.cookie(COOKIE_NAME, user.id, {
    httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.json({ ok: true, user: publicUser(user) });
});

// 2) Выдать код приглашения (только админ/owner)
router.post('/issue-code', requireAuth, requireAdmin, (req, res) => {
  const db = readDB();
  db.invites = db.invites.filter(x => x.expiresAt > Date.now());

  const code = Math.floor(10000 + Math.random() * 90000).toString();
  db.invites.push({ code, expiresAt: Date.now() + 60 * 60 * 1000 }); // 1 час
  writeDB(db);

  res.json({ code, ttl: 3600 });
});

// 3) Добавить админа по коду приглашения
router.post('/add', async (req, res) => {
  const { code, email, password, role = 'admin' } = req.body || {};
  const db = readDB();
  if (db.users.length === 0) return res.status(400).json({ error: 'not-initialized' });

  db.invites = db.invites.filter(x => x.expiresAt > Date.now());
  const invite = db.invites.find(x => x.code === String(code));
  if (!invite) return res.status(400).json({ error: 'bad-code' });

  const exists = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(400).json({ error: 'exists' });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    email: String(email),
    role,
    passwordHash,
  };
  db.users.push(user);
  db.invites = db.invites.filter(x => x !== invite);
  writeDB(db);

  res.json({ ok: true, user: publicUser(user) });
});

// 4) Логин / логаут / текущий пользователь
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(400).json({ error: 'bad-credentials' });

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'bad-credentials' });

  res.cookie(COOKIE_NAME, user.id, {
    httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.json({ ok: true, user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const id = req.cookies?.[COOKIE_NAME];
  if (!id) return res.json({ user: null });
  const db = readDB();
  const user = db.users.find(u => u.id === id);
  res.json({ user: publicUser(user) });
});

// 5) Управление администраторами
router.get('/admins', requireAuth, requireAdmin, (req, res) => {
  const db = readDB();
  res.json({ users: db.users.map(publicUser) });
});

router.patch('/admins/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  const db = readDB();

  const me = req.user;
  const u = db.users.find(x => x.id === id);
  if (!u) return res.status(404).json({ error: 'not-found' });

  // запрет снять у единственного owner роль owner
  if (u.role === 'owner' && role !== 'owner') {
    const owners = db.users.filter(x => x.role === 'owner');
    if (owners.length <= 1) return res.status(400).json({ error: 'last-owner' });
  }

  u.role = role;
  writeDB(db);

  // если сам себе поменял на не-админа — разлогиним
  if (u.id === me.id && !['admin', 'owner'].includes(role)) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }
  res.json({ ok: true, user: publicUser(u) });
});

router.delete('/admins/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const u = db.users.find(x => x.id === id);
  if (!u) return res.status(404).json({ error: 'not-found' });

  if (u.role === 'owner') {
    const owners = db.users.filter(x => x.role === 'owner');
    if (owners.length <= 1) return res.status(400).json({ error: 'last-owner' });
  }

  db.users = db.users.filter(x => x.id !== id);
  writeDB(db);

  // если удалили себя — разлогиним
  if (req.user?.id === id) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }
  res.json({ ok: true });
});

module.exports = router;
