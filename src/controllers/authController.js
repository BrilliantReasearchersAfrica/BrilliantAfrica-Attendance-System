const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

const SECRET_KEY = '47fe60aa9c084b1cc3f84c646a34d97e8d8f9f5a33c8b07f9a36fa48f3f7b21c88b3e02b6e82e04b2045be23f70b88e1910a9b92c52a3eb60de49f7f8a5082fc'; // replace with env var

exports.login = (req, res) => {
  const { email, password } = req.body;

  userModel.findUserByEmail(email, (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid email or password' });

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Login successful', token, role: user.role });
  });
};
