// departmentRoutes.js
const express = require('express');
const router = express.Router();

// Export a function that accepts the 'db' instance
module.exports = (db) => {
  if (!db) {
    console.error('Database connection not provided to departmentRoutes!');
  }

  // GET /api/departments – List all departments
  router.get('/', (req, res) => {
    // Use the provided 'db' instance
    db.all('SELECT * FROM departments', [], (err, rows) => {
      if (err) {
        console.error('Error fetching departments:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
      }
      res.json({ success: true, data: rows });
    });
  });

  return router; // Return the configured router
};
