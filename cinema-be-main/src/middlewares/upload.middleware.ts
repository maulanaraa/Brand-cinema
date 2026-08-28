import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD } from '../constants';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';

const uploadDir = path.join(process.cwd(), UPLOAD.POSTER_DIR);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof UPLOAD.ALLOWED_MIME_TYPES)[number])) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', HTTP_STATUS.BAD_REQUEST));
  }
};

export const uploadPoster = multer({
  storage,
  fileFilter,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE },
});
