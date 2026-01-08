const cloudinary = require('cloudinary').v2;
require('dotenv').config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

exports.uploads = (file, folder) => {
    return new Promise((resolve, reject) => {
        const options = {
            resource_type: 'auto',
            folder: folder
        };
        cloudinary.uploader.upload(file, options, (error, result) => {
            if (error) return reject(error);
            resolve({
                url: result.secure_url || result.url,
                id: result.public_id
            });
        });
    });
}

exports.destroy = (publicId, options = {}) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};
