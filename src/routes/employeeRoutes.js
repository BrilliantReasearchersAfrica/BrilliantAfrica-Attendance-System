const express = require('express');
const router = express.Router();
const db = require('../config/database').getDatabase();

// GET /api/employees – List employees
router.get('/', (req, res) => {
  let sql = `SELECT e.*, d.name AS department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// GET /api/employees/:id – View specific employee
router.get('/:id', (req, res) => {
  let sql = `SELECT e.*, d.name AS department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE e.id = ?`;
  db.get(sql, [req.params.id], (err, row) => {
    if (err) return res.json({ success: false, message: err.message });
    res.json({ success: true, data: row });
  });
});

// POST /api/employees – Add employee
router.post('/', (req, res) => {
  const { name, email, department_id, employee_code, position, hire_date, status } = req.body;
  let sql = `INSERT INTO employees (name, email, department_id, employee_code, position, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [name, email, department_id, employee_code, position, hire_date, status], function(err) {
    if (err) return res.json({ success: false, message: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

module.exports = router;