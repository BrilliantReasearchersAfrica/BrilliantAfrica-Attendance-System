const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('../config/database');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const db = database.getDatabase();
    
    // Find user by email (username is email in your case)
    const query = `SELECT * FROM users WHERE email = ?`;
    
    db.get(query, [username], async (err, user) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      try {
        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: user.role 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Return success response
        res.json({
          success: true,
          message: 'Login successful',
          token: token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });

      } catch (bcryptError) {
        console.error('Password comparison error:', bcryptError);
        return res.status(500).json({
          success: false,
          message: 'Authentication error'
        });
      }
    });

  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const db = database.getDatabase();
    const query = `SELECT id, name, email, role, created_at FROM users WHERE id = ?`;
    
    db.get(query, [req.user.id], (err, user) => {
      if (err) {
        console.error('Error fetching user profile:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching profile'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user,
        message: 'Profile fetched successfully'
      });
    });
  } catch (error) {
    console.error('Profile route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
