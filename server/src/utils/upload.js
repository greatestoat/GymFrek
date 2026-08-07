const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

for (const sub of ['gym-logos', 'member-photos']) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, sub), { recursive: true });
}

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, subfolder)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
      cb(null, `${crypto.randomUUID()}${safeExt}`);
    },
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, or WEBP images are allowed.'));
  }
  cb(null, true);
}

const uploadGymLogo = multer({
  storage: makeStorage('gym-logos'),
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

const uploadMemberPhoto = multer({
  storage: makeStorage('member-photos'),
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

// Builds the public URL path stored in the DB / returned to the client.
function toPublicUrl(subfolder, filename) {
  return `/uploads/${subfolder}/${filename}`;
}

module.exports = { uploadGymLogo, uploadMemberPhoto, toPublicUrl, UPLOAD_ROOT };
