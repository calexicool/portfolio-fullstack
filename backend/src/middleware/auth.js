// backend/src/middleware/auth.js
const fs = require('fs');
const path = require('path');

const COOKIE_NAME = 'uid'; // <-- как в routes/auth.js
const DB_PATH = path.join(__dirname, '../storage/admins.json');

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { users: [], invites: [] }; }
}

// кладём user в req, если есть валидная кука
function optionalAuth(req, _res, next) {
  const id = req.cookies?.[COOKIE_NAME];
  if (id) {
    const db = readDB();
    const user = db.users.find(u => u.id === id) || null;
    if (user) req.user = user;
  }
  next();
}

// 401, если не залогинен
function authRequired(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    next();
  });
}

// 403, если не admin/owner/editor (используем в местах, где нужна модерация)
function requireModerator(req, res, next) {
  optionalAuth(req, res, () => {
    const ok = req.user && ['owner', 'admin', 'editor'].includes(req.user.role);
    if (!ok) return res.status(403).json({ error: 'forbidden' });
    next();
  });
}

module.exports = { optionalAuth, authRequired, requireModerator };
