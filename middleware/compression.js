const compression = require('compression');
const zlib = require('zlib');

const compressionMiddleware = compression({
  level: zlib.constants.Z_BEST_COMPRESSION,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

const shouldCompress = (req, res) => {
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  return compression.filter(req, res);
};

module.exports = {
  compressionMiddleware,
  shouldCompress
};