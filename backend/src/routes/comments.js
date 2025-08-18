// backend/src/routes/comments.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');
const { files, readJSON, writeJSON, ensureInitialized } = require('../utils/store');

const router = express.Router();

// === авторизация (совместимо с routes/auth.js) ============================
const COOKIE_NAME = 'uid';
const DB_PATH = path.join(__dirname, '../storage/admins.json');

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { users: [], invites: [] }; }
}

// парсим cookie даже без cookie-parser
function readCookies(req) {
  if (req.cookies) return req.cookies;
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

function getUserFromReq(req) {
  const id = readCookies(req)[COOKIE_NAME];
  if (!id) return null;
  const db = readDB();
  return db.users.find(u => u.id === id) || null;
}
function isModerator(u) {
  const r = String(u?.role || '').trim().toLowerCase();
  return ['owner', 'admin', 'editor'].includes(r);
}

// === анти-спам для добавления =============================================
const addLimiter = rateLimit({ windowMs: 15_000, max: 3, standardHeaders: true, legacyHeaders: false });
function fp(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '0';
  const ua = req.headers['user-agent'] || '';
  const salt = process.env.SERVER_SALT || 'x';
  return crypto.createHash('sha256').update(ip + ua + salt).digest('hex');
}

// === маршруты =============================================================

// Публичный список: гостям — только approved; модераторам — все
router.get('/', async (req, res) => {
  await ensureInitialized();
  const list = await readJSON(files.comments, []);
  const user = getUserFromReq(req);
  const all = !!user && isModerator(user);
  res.json(all ? list : list.filter(c => c.approved === true));
});

// Добавить комментарий (публично)
router.post('/', addLimiter, async (req, res) => {
  await ensureInitialized();
  const { name, text, parentId = null } = req.body || {};
  const bad = (s = '') =>
    (s || '').toLowerCase().match(/(crypto|casino|viagra|xxx)/) ||
    ((s || '').match(/https?:\/\//g) || []).length > 2 ||
    (s || '').length > 2000;

  if (!text || bad(text)) return res.status(400).json({ ok: false, error: 'spam_or_empty' });

  const list = await readJSON(files.comments, []);
  const c = {
    id: nanoid(),
    parentId: parentId || null,
    name: (name || 'Гость').slice(0, 80),
    text: String(text).slice(0, 4000),
    createdAt: new Date().toISOString(),
    likes: 0,
    approved: false,
    voters: []
  };
  list.unshift(c);
  await writeJSON(files.comments, list);
  res.json({ ok: true, list });
});

// Лайк (публично)
router.post('/like', async (req, res) => {
  await ensureInitialized();
  const { id } = req.body || {};
  const list = await readJSON(files.comments, []);
  const i = list.findIndex(c => c.id === id);
  if (i < 0) return res.status(404).json({ ok: false });

  const mark = fp(req);
  if (!list[i].voters) list[i].voters = [];
  if (!list[i].voters.includes(mark)) {
    list[i].voters.push(mark);
    list[i].likes = (list[i].likes || 0) + 1;
    await writeJSON(files.comments, list);
  }
  res.json({ ok: true, list });
});

// Одобрить (owner/admin/editor)
router.post('/approve', async (req, res) => {
  await ensureInitialized();
  const user = getUserFromReq(req);
  if (!user) return res.status(401).send('unauthorized');
  if (!isModerator(user)) return res.status(403).send('forbidden');

  const { id } = req.body || {};
  const list = await readJSON(files.comments, []);
  const i = list.findIndex(c => c.id === id);
  if (i < 0) return res.status(404).json({ ok: false });

  list[i].approved = true;
  await writeJSON(files.comments, list);
  res.json({ ok: true, list });
});

// Удалить (owner/admin/editor)
router.post('/remove', async (req, res) => {
  await ensureInitialized();
  const user = getUserFromReq(req);
  if (!user) return res.status(401).send('unauthorized');
  if (!isModerator(user)) return res.status(403).send('forbidden');

  const { id } = req.body || {};
  let list = await readJSON(files.comments, []);
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of list) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) { ids.add(c.id); changed = true; }
    }
  }
  list = list.filter(c => !ids.has(c.id));
  await writeJSON(files.comments, list);
  res.json({ ok: true, list });
});

module.exports = router;
