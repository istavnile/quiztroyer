const jwt    = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function signAdminToken(adminId, username) {
  return jwt.sign({ role: 'admin', adminId, username }, JWT_SECRET, { expiresIn: '24h' });
}

function signTotpPendingToken(adminId, username) {
  return jwt.sign({ role: 'admin', adminId, username, totpPending: true }, JWT_SECRET, { expiresIn: '5m' });
}

async function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('bad role');
    if (payload.totpPending) return res.status(401).json({ error: 'TOTP verification required' });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireTotpPending(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (payload.role !== 'admin' || !payload.totpPending) throw new Error();
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired pending token' });
  }
}

module.exports = { signAdminToken, signTotpPendingToken, requireAdmin, requireTotpPending };
