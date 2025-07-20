const userModel = require('../models/userModel');

async function loginHandler(req, res) {
  try {
    const user = await userModel.findUserByEmail(req.body.email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // continue with password verification...
  } catch (error) {
    return res.status(500).json({ message: 'Database error', error: error.message });
  }
}
