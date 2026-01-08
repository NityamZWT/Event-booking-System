// lib/multer-upload.js (or wherever your imageUploaderasync is)
const fs = require('fs');
const cloudinary = require('../lib/cloudinary');
const upload = require('../lib/multer');

const imageUploaderasync = (req, res, next) => {
    upload.array('images')(req, res, async (err) => {
        if (err) return next(err);

        try {
            const existingBody = { ...req.body };
            
            if (!req.files || req.files.length === 0) {
                req.body = existingBody;
                return next();
            }

            const uploader = (filePath) => cloudinary.uploads(filePath, 'Images');
            const uploaded = [];

            for (const file of req.files) {
                const { path } = file;
                const result = await uploader(path);
                uploaded.push({ url: result.url, public_id: result.id });
                try {
                    fs.unlinkSync(path);
                } catch (unlinkErr) {
                    console.warn('Could not delete temp file:', path);
                }
            }

            req.body = { 
                ...existingBody, 
                images: uploaded 
            };
            
            console.log('Uploaded image metadata:', uploaded);
            console.log('Preserved retain_images:', existingBody.retain_images);

            return next();
        } catch (error) {
            return next(error);
        }
    });
};

module.exports = imageUploaderasync;