const jwt    = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma    = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function signAdminToken(adminId, username) {
  return jwt.sign({ role: 'admin', adminId, username }, JWT_SECRET, { expiresIn: '24h' });
}

async function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (payload.role !== 'admin') throw new Error();
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { signAdminToken, requireAdmin };
