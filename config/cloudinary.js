const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadToCloudinary = async (filePath, folder = 'swim-academy') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
    return {
      success: true,
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('فشل في رفع الملف إلى السحابة');
  }
};

exports.uploadBufferToCloudinary = async (buffer, folder = 'swim-academy') => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve({
            success: true,
            public_id: result.public_id,
            url: result.secure_url,
            format: result.format,
            bytes: result.bytes
          });
        }
      );
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Cloudinary buffer upload error:', error);
    throw new Error('فشل في رفع الملف إلى السحابة');
  }
};

exports.deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'تم حذف الملف بنجاح' : 'فشل في حذف الملف'
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('فشل في حذف الملف من السحابة');
  }
};

exports.getCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...options
  });
};

module.exports = cloudinary;