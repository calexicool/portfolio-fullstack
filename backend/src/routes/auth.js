// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs/promises');

const router = express.Router();

// Код инициализации: можно задать ENV INIT_CODE, иначе по умолчанию "72405"
const INIT_CODE = process.env.INIT_CODE || '72405';

// Хранилище пользователей (файлик на диске)
const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage');
const USERS_PATH  = path.join(STORAGE_DIR, 'users.json');

async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  try { await fs.access(USERS_PATH); }
  catch { await fs.writeFile(USERS_PATH, '[]', 'utf-8'); }
}

async function readUsers() {
  await ensureStorage();
  const s = await fs.readFile(USERS_PATH, 'utf-8').catch(() => '[]');
  try { return JSON.parse(s); } catch { return []; }
}

async function writeUsers(users) {
  await ensureStorage();
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

// Простейшая cookie-сессия (без внешней БД)
function setSession(res, user) {
  const payload = Buffer.from(JSON.stringify({ email: user.email, role: user.role })).toString('base64');
  res.cookie('sid', payload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}
function clearSession(res){ res.clearCookie('sid'); }

// ---------- API ----------

// Первичная инициализация (создание первого админа)
router.post('/seed', async (req, res) => {
  const { code, email, password } = req.body || {};

  if (!code || !email || !password) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }
  if (code !== INIT_CODE) {
    return res.status(403).json({ message: 'Неверный код' });
  }

  const users = await readUsers();
  const hasAdmin = users.some(u => u.role === 'admin');

  if (hasAdmin) {
    return res.status(409).json({ message: 'Администратор уже создан. Войдите справа.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(36), email, hash, role: 'admin' };

  users.push(user);
  await writeUsers(users);

  setSession(res, user);
  return res.json({ ok: true, isAdmin: true, email: user.email });
});

// Вход
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Заполните email и пароль' });

  const users = await readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: 'Неверные учётные данные' });

  const ok = await bcrypt.compare(password, user.hash);
  if (!ok) return res.status(401).json({ message: 'Неверные учётные данные' });

  setSession(res, user);
  return res.json({ ok: true, isAdmin: user.role === 'admin', email: user.email });
});

// Выход
router.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

// Текущий пользователь
router.get('/me', async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.json({ isAdmin: false });

  try {
    const obj = JSON.parse(Buffer.from(sid, 'base64').toString('utf-8'));
    return res.json({ isAdmin: obj.role === 'admin', email: obj.email });
  } catch {
    return res.json({ isAdmin: false });
  }
});

module.exports = router;
