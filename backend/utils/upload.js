const multer = require('multer');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

// Store files in memory, then stream to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|pdf|doc|docx/;
  const ext = allowed.test(file.originalname.toLowerCase());
  if (ext) return cb(null, true);
  cb(new Error('Unsupported file type. Allowed: images, PDF, DOC/DOCX'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

const uploadToCloudinary = (fileBuffer, folder = 'skillsphere') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

module.exports = { upload, uploadToCloudinary };
