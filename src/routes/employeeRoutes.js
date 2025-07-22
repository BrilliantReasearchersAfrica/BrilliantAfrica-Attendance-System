// employeeRoutes.js
const express = require('express');
const router = express.Router();

// Export a function that accepts the 'db' instance
module.exports = (db) => {
  if (!db) {
    console.error('Database connection not provided to employeeRoutes!');
    // In a real application, you might want to throw an error here
    // or return a router that always sends 500 errors for DB-related endpoints.
  }

  // GET /api/employees – List employees
  router.get('/', (req, res) => {
    let sql = `SELECT e.*, d.name AS department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id`;
    // Use the provided 'db' instance
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching employees:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch employees.' });
      }
      res.json({ success: true, data: rows });
    });
  });

  // GET /api/employees/:id – View specific employee
  router.get('/:id', (req, res) => {
    let sql = `SELECT e.*, d.name AS department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE e.id = ?`;
    // Use the provided 'db' instance
    db.get(sql, [req.params.id], (err, row) => {
      if (err) {
        console.error('Error fetching specific employee:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch employee.' });
      }
      if (!row) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }
      res.json({ success: true, data: row });
    });
  });

  // POST /api/employees – Add employee
  router.post('/', (req, res) => {
    const { name, email, department_id, employee_code, position, hire_date, status } = req.body;

    // Input validation (basic example)
    if (!name || !email || !department_id) {
      return res.status(400).json({ success: false, message: 'Name, email, and department ID are required.' });
    }

    let sql = `INSERT INTO employees (name, email, department_id, employee_code, position, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    // Use the provided 'db' instance
    db.run(sql, [name, email, department_id, employee_code, position, hire_date, status], function(err) {
      if (err) {
        console.error('Error adding employee:', err.message);
        // Check for unique constraint violation (e.g., email already exists)
        if (err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
          return res.status(409).json({ success: false, message: 'Employee with this email already exists.' });
        }
        return res.status(500).json({ success: false, message: 'Failed to add employee.' });
      }
      res.status(201).json({ success: true, id: this.lastID, message: 'Employee added successfully.' });
    });
  });

  // PUT /api/employees/:id - Update employee
  router.put('/:id', (req, res) => {
    const employeeId = req.params.id;
    const { name, email, department_id, employee_code, position, hire_date, status } = req.body;

    // Input validation
    if (!name || !email || !department_id) {
      return res.status(400).json({ success: false, message: 'Name, email, and department ID are required for update.' });
    }

    let sql = `UPDATE employees SET name = ?, email = ?, department_id = ?, employee_code = ?, position = ?, hire_date = ?, status = ? WHERE id = ?`;
    db.run(sql, [name, email, department_id, employee_code, position, hire_date, status, employeeId], function(err) {
      if (err) {
        console.error('Error updating employee:', err.message);
        if (err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
          return res.status(409).json({ success: false, message: 'Another employee with this email already exists.' });
        }
        return res.status(500).json({ success: false, message: 'Failed to update employee.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found or no changes made.' });
      }
      res.json({ success: true, message: 'Employee updated successfully.' });
    });
  });

  // DELETE /api/employees/:id - Delete employee
  router.delete('/:id', (req, res) => {
    const employeeId = req.params.id;
    let sql = `DELETE FROM employees WHERE id = ?`;
    db.run(sql, employeeId, function(err) {
      if (err) {
        console.error('Error deleting employee:', err.message);
        return res.status(500).json({ success: false, message: 'Failed to delete employee.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }
      res.json({ success: true, message: 'Employee deleted successfully.' });
    });
  });


  return router; // Return the configured router
};

