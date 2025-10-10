const apicache = require('apicache');

const cache = apicache.middleware;

const cacheMiddleware = {
  short: cache('5 minutes'),
  medium: cache('15 minutes'),
  long: cache('1 hour'),
  veryLong: cache('12 hours')
};

const onlyStatus200 = (req, res) => res.statusCode === 200;

const cacheConfig = {
  short: cache('5 minutes', onlyStatus200),
  medium: cache('15 minutes', onlyStatus200),
  long: cache('1 hour', onlyStatus200)
};

const clearCache = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    apicache.clear();
  }
  next();
};

const cacheResponse = (duration) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${duration}`);
    next();
  };
};

module.exports = {
  cacheMiddleware,
  cacheConfig,
  clearCache,
  cacheResponse
};