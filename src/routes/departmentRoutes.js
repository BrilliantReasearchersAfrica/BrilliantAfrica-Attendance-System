const express = require('express');
const router = express.Router();
const db = require('../config/database').getDatabase();

// GET /api/departments – List all departments
router.get('/', (req, res) => {
  db.all('SELECT * FROM departments', [], (err, rows) => {
    if (err) return res.json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

module.exports = router;