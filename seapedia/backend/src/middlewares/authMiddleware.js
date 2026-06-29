const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware factory to strictly check active roles
exports.requireRole = (requiredRole) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Strict check: Does the active session role match the required route role?
      if (decoded.activeRole !== requiredRole) {
        return res.status(403).json({ 
          error: `Access denied. Active role must be ${requiredRole}.` 
        });
      }

      req.user = decoded; // Contains userId and activeRole
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};