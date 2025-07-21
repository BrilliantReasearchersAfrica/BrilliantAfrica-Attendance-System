const jwt = require('jsonwebtoken');
const SECRET_KEY = '47fe60aa9c084b1cc3f84c646a34d97e8d8f9f5a33c8b07f9a36fa48f3f7b21c88b3e02b6e82e04b2045be23f70b88e1910a9b92c52a3eb60de49f7f8a5082fc';

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
