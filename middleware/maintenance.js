const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    const allowedIPs = ['::1', '127.0.0.1', 'localhost'];
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (req.user?.role === 'admin' || allowedIPs.includes(clientIP)) {
      return next();
    }

    return res.status(503).json({
      success: false,
      message: 'النظام تحت الصيانة حالياً',
      estimatedRestoration: process.env.MAINTENANCE_UNTIL || 'قريباً',
      supportContact: process.env.SUPPORT_EMAIL || 'support@example.com'
    });
  }
  
  next();
};

const bypassMaintenance = (req, res, next) => {
  req.bypassMaintenance = true;
  next();
};

const scheduleMaintenance = (startTime, endTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now >= start && now <= end) {
    process.env.MAINTENANCE_MODE = 'true';
    process.env.MAINTENANCE_UNTIL = endTime;
  } else {
    process.env.MAINTENANCE_MODE = 'false';
  }
};

module.exports = {
  maintenanceMode,
  bypassMaintenance,
  scheduleMaintenance
};