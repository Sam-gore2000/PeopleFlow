import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import { PROFILE_PHOTO_DIR } from "../services/profileService.js";
import { httpError } from "../utils/httpError.js";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

fs.mkdirSync(PROFILE_PHOTO_DIR, { recursive: true });

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: PROFILE_PHOTO_DIR,
    filename: (req, file, done) => done(null, `${String(req.user?.empid || "user").replace(/[^\w-]/g, "")}-${crypto.randomBytes(6).toString("hex")}.${PHOTO_TYPES[file.mimetype]}`)
  }),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
  fileFilter: (req, file, done) => (PHOTO_TYPES[file.mimetype] ? done(null, true) : done(httpError(400, "Please choose a JPG, PNG or WebP image.")))
}).single("photo");

// Wraps multer so its errors (too large, wrong type) come back as friendly 400s.
export function uploadProfilePhoto(req, res, next) {
  photoUpload(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") return next(httpError(400, "The photo must be 2 MB or smaller."));
    return next(error.status ? error : httpError(400, error.message));
  });
}
