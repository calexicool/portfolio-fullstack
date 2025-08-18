// backend/src/middleware/auth.js
const fs = require('fs');
const path = require('path');

const COOKIE_NAME = 'uid'; // та же кука, что в routes/auth.js
const DB_PATH = path.join(__dirname, '../storage/admins.json');

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { users: [], invites: [] }; }
}
function normalizeRole(u) {
  return (u && u.role ? String(u.role) : '').trim().toLowerCase();
}

function optionalAuth(req, _res, next) {
  const id = req.cookies?.[COOKIE_NAME];
  if (id) {
    const db = readDB();
    const user = db.users.find(u => u.id === id) || null;
    if (user) req.user = user;
  }
  next();
}

function authRequired(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    next();
  });
}

// для модерации: owner/admin/editor
function requireModerator(req, res, next) {
  optionalAuth(req, res, () => {
    const role = normalizeRole(req.user);
    if (!role) return res.status(401).json({ error: 'unauthorized' });
    if (!['owner', 'admin', 'editor'].includes(role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  });
}

module.exports = { optionalAuth, authRequired, requireModerator };
