// backend/src/lib/requireAdmin.js
const jwt = require('jsonwebtoken');

/**
 * Проверяет JWT токен из cookie "token" (или из Authorization: Bearer ...)
 * Если валиден — кладёт payload в req.user и пропускает дальше
 */
module.exports = (req, res, next) => {
  const bearer = req.headers.authorization || '';
  const headerToken = bearer.startsWith('Bearer ') ? bearer.slice(7) : null;
  const cookieToken = req.cookies && req.cookies.token;
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
};
