const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const requireAdmin = require('../lib/requireAdmin'); // <-- путь корректный

const uploadsAbs = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsAbs),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok = /^image\/(jpe?g|png|webp|gif|svg\+xml)$/.test(file.mimetype);
  cb(ok ? null : new Error('bad-type'), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.post('/', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'no-file' });
  const url = '/uploads/' + req.file.filename;
  return res.json({ ok: true, url, filename: req.file.filename });
});

module.exports = router;
