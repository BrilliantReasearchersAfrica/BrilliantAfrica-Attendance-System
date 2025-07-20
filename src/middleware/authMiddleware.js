const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key';

exports.verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ message: 'Token required' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    req.user = decoded;
    next();
  });
};
