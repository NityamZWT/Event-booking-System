// lib/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        cb(null, timestamp + '-' + file.originalname)
    }
});

const fileFilter = (req, file, cb) => {
    const allowImageType = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowImageType.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb({ message: 'Unsupported file format' }, false);
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Increased to 5MB
    fileFilter: fileFilter,
    // Preserve req.body fields
    preservePath: true
});

module.exports = upload;