// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs/promises');
const requireAdmin = require('../lib/requireAdmin');

const router = express.Router();

const INIT_CODE = process.env.INIT_CODE || '72405';

const STORAGE_DIR   = path.join(__dirname, '..', '..', 'storage');
const USERS_PATH    = path.join(STORAGE_DIR, 'users.json');
const INVITES_PATH  = path.join(STORAGE_DIR, 'invites.json');

async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  try { await fs.access(USERS_PATH);   } catch { await fs.writeFile(USERS_PATH,  '[]', 'utf-8'); }
  try { await fs.access(INVITES_PATH); } catch { await fs.writeFile(INVITES_PATH,'[]', 'utf-8'); }
}

async function readUsers()   { await ensureStorage(); return JSON.parse(await fs.readFile(USERS_PATH,  'utf-8').catch(()=> '[]')); }
async function writeUsers(u) { await ensureStorage(); return fs.writeFile(USERS_PATH,  JSON.stringify(u, null, 2), 'utf-8'); }
async function readInv()     { await ensureStorage(); return JSON.parse(await fs.readFile(INVITES_PATH,'utf-8').catch(()=> '[]')); }
async function writeInv(i)   { await ensureStorage(); return fs.writeFile(INVITES_PATH, JSON.stringify(i, null, 2), 'utf-8'); }

function setSession(res, user) {
  const payload = Buffer.from(JSON.stringify({ email: user.email, role: user.role })).toString('base64');
  res.cookie('sid', payload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
function clearSession(res){ res.clearCookie('sid'); }

// ---------- Первичная инициализация (только если админа ещё нет)
router.post('/seed', async (req, res) => {
  const { code, email, password } = req.body || {};
  if (!code || !email || !password) return res.status(400).json({ message: 'Все поля обязательны' });
  if (code !== INIT_CODE)         return res.status(403).json({ message: 'Неверный код' });

  const users = await readUsers();
  const hasAdmin = users.some(u => u.role === 'admin');
  if (hasAdmin) return res.status(409).json({ message: 'Администратор уже создан' });

  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(36), email, hash, role: 'admin' };
  users.push(user); await writeUsers(users);
  setSession(res, user);
  res.json({ ok: true, isAdmin: true, email: user.email });
});

// ---------- Приглашение (создаёт код, доступно только админу)
router.post('/invite', requireAdmin, async (req, res) => {
  const { role = 'admin' } = req.body || {};
  const code = Math.random().toString(36).slice(2, 8).toUpperCase(); // короткий код
  const invites = await readInv();
  const invite = { code, role, createdAt: Date.now(), expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 }; // 7 дней
  invites.push(invite);
  await writeInv(invites);
  res.json({ ok: true, code, role });
});

// ---------- Принять приглашение (добавление пользователя по коду)
router.post('/accept', async (req, res) => {
  const { code, email, password } = req.body || {};
  if (!code || !email || !password) return res.status(400).json({ message: 'Все поля обязательны' });

  const users = await readUsers();
  const invites = await readInv();

  // Если совсем нет админа — нужно сначала /seed
  if (!users.some(u => u.role === 'admin')) {
    return res.status(409).json({ message: 'Сначала выполните первичную инициализацию' });
  }

  const idx = invites.findIndex(i => i.code === code);
  if (idx === -1)                  return res.status(403).json({ message: 'Неверный код' });
  if (invites[idx].expiresAt < Date.now()) {
    invites.splice(idx, 1); await writeInv(invites);
    return res.status(403).json({ message: 'Код истёк' });
  }

  const role = invites[idx].role === 'editor' ? 'editor' : 'admin';
  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(36), email, hash, role };
  users.push(user); await writeUsers(users);
  invites.splice(idx, 1); await writeInv(invites);

  setSession(res, user);
  res.json({ ok: true, isAdmin: role === 'admin', email: user.email });
});

// ---------- Вход/Выход/Текущий пользователь
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Все поля обязательны' });
  const users = await readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: 'Неверные учётные данные' });
  const ok = await bcrypt.compare(password, user.hash);
  if (!ok)  return res.status(401).json({ message: 'Неверные учётные данные' });
  setSession(res, user);
  res.json({ ok: true, isAdmin: user.role === 'admin', email: user.email });
});

router.post('/logout', (_req, res) => { clearSession(res); res.json({ ok: true }); });

router.get('/me', (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.json({ isAdmin: false });
  try {
    const obj = JSON.parse(Buffer.from(sid, 'base64').toString('utf-8'));
    res.json({ isAdmin: obj.role === 'admin', email: obj.email, role: obj.role });
  } catch { res.json({ isAdmin: false }); }
});

module.exports = router;
