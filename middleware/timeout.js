const timeout = require('connect-timeout');

const timeoutConfig = {
  short: timeout('10s'),
  medium: timeout('30s'),
  long: timeout('60s'),
  veryLong: timeout('120s')
};

const haltOnTimedout = (req, res, next) => {
  if (!req.timedout) next();
};

const timeoutHandler = (req, res, next) => {
  if (req.timedout) {
    return res.status(503).json({
      success: false,
      message: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',
      code: 'REQUEST_TIMEOUT'
    });
  }
  next();
};

const routeTimeout = (duration) => {
  return [timeout(duration), timeoutHandler, haltOnTimedout];
};

module.exports = {
  timeoutConfig,
  routeTimeout,
  haltOnTimedout,
  timeoutHandler
};