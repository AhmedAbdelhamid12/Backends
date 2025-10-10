const i18n = require('i18n');

i18n.configure({
  locales: ['ar', 'en'],
  directory: __dirname + '/../locales',
  defaultLocale: 'ar',
  autoReload: true,
  syncFiles: true,
  cookie: 'lang',
  queryParameter: 'lang',
  objectNotation: true
});

const localeMiddleware = (req, res, next) => {
  i18n.init(req, res);
  
  const lang = req.query.lang || req.cookies?.lang || req.get('Accept-Language')?.substring(0, 2) || 'ar';
  
  if (['ar', 'en'].includes(lang)) {
    req.setLocale(lang);
    res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
  }
  
  next();
};

const getLocale = (req) => {
  return req.getLocale();
};

const translate = (key, options = {}) => {
  return i18n.__(key, options);
};

module.exports = {
  i18n,
  localeMiddleware,
  getLocale,
  translate
};