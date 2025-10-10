const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateWebSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      return next(new Error('رمز المصادقة مطلوب'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || user.status !== 'active') {
      return next(new Error('المستخدم غير نشط'));
    }

    socket.user = user;
    socket.userId = user._id;
    next();
  } catch (error) {
    next(new Error('مصادقة WebSocket فشلت'));
  }
};

const authorizeWebSocket = (roles = []) => {
  return (socket, next) => {
    if (!socket.user) {
      return next(new Error('غير مصرح بالوصول'));
    }

    if (roles.length > 0 && !roles.includes(socket.user.role)) {
      return next(new Error('صلاحيات غير كافية'));
    }

    next();
  };
};

const rateLimitWebSocket = (maxConnections = 3) => {
  const connections = new Map();

  return (socket, next) => {
    const userId = socket.userId?.toString();
    
    if (userId) {
      const userConnections = connections.get(userId) || 0;
      
      if (userConnections >= maxConnections) {
        return next(new Error('تم تجاوز الحد الأقصى للاتصالات'));
      }
      
      connections.set(userId, userConnections + 1);
      
      socket.on('disconnect', () => {
        const current = connections.get(userId) || 0;
        if (current > 1) {
          connections.set(userId, current - 1);
        } else {
          connections.delete(userId);
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticateWebSocket,
  authorizeWebSocket,
  rateLimitWebSocket
};