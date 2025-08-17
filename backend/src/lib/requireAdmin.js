// backend/src/lib/requireAdmin.js
module.exports = function requireAdmin(req, res, next) {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const obj = JSON.parse(Buffer.from(sid, 'base64').toString('utf-8'));
    if (obj.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.user = obj;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
