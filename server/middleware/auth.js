import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Always read JWT_SECRET lazily (at call time, not at import time)
// This avoids the race where process.env is not yet populated when the
// module is first imported (before dotenv.config() runs in index.js).
function getSecret() {
  return process.env.JWT_SECRET || 'vastuvision_super_secret_jwt_key_2025';
}

function getExpiry() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

// Generate JWT token
export function generateToken(userId) {
  return jwt.sign({ id: String(userId) }, getSecret(), { expiresIn: getExpiry() });
}

// Middleware: protect routes
export async function protect(req, res, next) {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    // Verify token — read secret lazily
    let decoded;
    try {
      decoded = jwt.verify(token, getSecret());
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      console.error('JWT verify failed:', jwtErr.message, '| Secret:', getSecret().substring(0, 10) + '...');
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }

    // Get user from DB
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
}
