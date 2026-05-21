const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const visitingCardsDir = path.join(uploadDir, 'visiting-cards');
const voiceNotesDir = path.join(uploadDir, 'voicenote');

fs.mkdirSync(visitingCardsDir, { recursive: true });
fs.mkdirSync(voiceNotesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, file, callback) => {
    if (file.fieldname === 'voiceNote' || file.fieldname === 'voiceNote2') {
      callback(null, voiceNotesDir);
      return;
    }

    callback(null, visitingCardsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    callback(null, `${Date.now()}-${baseName || file.fieldname}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (
      (file.fieldname === 'visitingCard' || file.fieldname === 'visitingCard2') &&
      !file.mimetype.startsWith('image/')
    ) {
      callback(new Error('Only image files are allowed for visiting cards.'));
      return;
    }

    if (
      (file.fieldname === 'voiceNote' || file.fieldname === 'voiceNote2') &&
      !file.mimetype.startsWith('audio/') &&
      !file.mimetype.startsWith('video/webm')
    ) {
      callback(new Error('Only audio files are allowed for voice notes.'));
      return;
    }

    callback(null, true);
  }
});

module.exports = upload;
