const jwt = require('jsonwebtoken');

/**
 * adminMiddleware — verifies JWT and enforces admin role.
 * Returns 401 if no/invalid token, 403 if authenticated but not admin.
 */
function adminMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cakedelight-secret-key-2026');
        req.user = decoded;

        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = adminMiddleware;
