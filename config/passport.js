const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('./environment');
const logger = require('../utils/logger');

// Google OAuth Strategy
if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  passport.use(new GoogleStrategy({
    clientID: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
    callbackURL: `${config.domain}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      logger.info(`Google OAuth attempt for: ${profile.emails[0].value}`);
      
      let user = await User.findOne({ 
        $or: [
          { email: profile.emails[0].value },
          { googleId: profile.id }
        ]
      });

      if (user) {
        if (!user.googleId) {
          user.googleId = profile.id;
          user.avatar = profile.photos[0].value;
          await user.save();
          logger.info(`Updated user with Google ID: ${user.email}`);
        }
        return done(null, user);
      }

      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
        emailVerified: true,
        provider: 'google',
        status: 'active'
      });

      logger.info(`New user created via Google: ${user.email}`);
      return done(null, user);
    } catch (error) {
      logger.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      logger.warn(`Failed login attempt - user not found: ${email}`);
      return done(null, false, { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    if (user.provider === 'google') {
      logger.warn(`Login attempt with password for Google user: ${email}`);
      return done(null, false, { message: 'يرجى استخدام تسجيل الدخول عبر جوجل' });
    }

    if (user.status !== 'active') {
      logger.warn(`Login attempt for inactive user: ${email}`);
      return done(null, false, { message: 'الحساب غير نشط. يرجى التواصل مع الدعم' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      logger.warn(`Failed login attempt - wrong password: ${email}`);
      return done(null, false, { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    user.lastLogin = new Date();
    await user.save();

    logger.info(`Successful login: ${email}`);
    return done(null, user);
  } catch (error) {
    logger.error('Local strategy error:', error);
    return done(error);
  }
}));

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.id);
    if (user && user.status === 'active') {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    logger.error('JWT strategy error:', error);
    return done(error, false);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error, null);
  }
});

logger.info('Passport strategies configured successfully');

module.exports = passport;