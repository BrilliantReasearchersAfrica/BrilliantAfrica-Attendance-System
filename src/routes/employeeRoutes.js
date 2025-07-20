const express = require('express');
const router = express.Router();
const database = require('../config/database');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { department, status, search } = req.query;

    let query = `
      SELECT 
        e.id,
        e.name,
        e.email,
        e.employee_code,
        e.position,
        e.hire_date,
        e.status,
        d.name as department_name,
        d.id as department_id
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;

    const params = [];

    if (department && department !== '') {
      query += ` AND e.department_id = ?`;
      params.push(department);
    }

    if (status && status !== '') {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    if (search && search.trim() !== '') {
      query += ` AND (e.name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ?)`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY e.name`;

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching employees:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching employees',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Employees fetched successfully'
      });
    });
  } catch (error) {
    console.error('Employee route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const db = database.getDatabase();
    const employeeId = req.params.id;

    const query = `
      SELECT 
        e.*,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `;

    db.get(query, [employeeId], (err, row) => {
      if (err) {
        console.error('Error fetching employee:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching employee',
          error: err.message
        });
      }

      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        data: row,
        message: 'Employee fetched successfully'
      });
    });
  } catch (error) {
    console.error('Employee route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get employee attendance summary
router.get('/:id/attendance-summary', async (req, res) => {
  try {
    const db = database.getDatabase();
    const employeeId = req.params.id;
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = month || (currentDate.getMonth() + 1);
    const targetYear = year || currentDate.getFullYear();

    const query = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_days,
        SUM(CASE WHEN is_weekend = 1 AND status = 'present' THEN 1 ELSE 0 END) as weekend_work,
        ROUND(AVG(hours_worked), 2) as avg_hours_worked,
        SUM(overtime_hours) as total_overtime
      FROM attendance 
      WHERE employee_id = ? 
        AND strftime('%m', date) = ? 
        AND strftime('%Y', date) = ?
    `;

    db.get(query, [employeeId, targetMonth.toString().padStart(2, '0'), targetYear.toString()], (err, row) => {
      if (err) {
        console.error('Error fetching attendance summary:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching attendance summary',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: row || {},
        message: 'Attendance summary fetched successfully'
      });
    });
  } catch (error) {
    console.error('Attendance summary route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { name, email, department_id, employee_code, position, hire_date } = req.body;

    // Validation
    if (!name || !email || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and department are required'
      });
    }

    const query = `
      INSERT INTO employees (name, email, department_id, employee_code, position, hire_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `;

    const params = [
      name.trim(),
      email.trim(),
      department_id,
      employee_code || null,
      position || null,
      hire_date || new Date().toISOString().split('T')[0]
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Error creating employee:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Error creating employee',
          error: err.message
        });
      }

      res.status(201).json({
        success: true,
        data: { id: this.lastID },
        message: 'Employee created successfully'
      });
    });
  } catch (error) {
    console.error('Employee creation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const db = database.getDatabase();
    const employeeId = req.params.id;
    const { name, email, department_id, employee_code, position, hire_date, status } = req.body;

    // Validation
    if (!name || !email || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and department are required'
      });
    }

    const query = `
      UPDATE employees 
      SET name = ?, email = ?, department_id = ?, employee_code = ?, 
          position = ?, hire_date = ?, status = ?
      WHERE id = ?
    `;

    const params = [
      name.trim(),
      email.trim(),
      department_id,
      employee_code || null,
      position || null,
      hire_date,
      status || 'active',
      employeeId
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Error updating employee:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Error updating employee',
          error: err.message
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        message: 'Employee updated successfully'
      });
    });
  } catch (error) {
    console.error('Employee update route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete employee (soft delete - set status to inactive)
router.delete('/:id', async (req, res) => {
  try {
    const db = database.getDatabase();
    const employeeId = req.params.id;

    const query = `UPDATE employees SET status = 'inactive' WHERE id = ?`;

    db.run(query, [employeeId], function(err) {
      if (err) {
        console.error('Error deleting employee:', err);
        return res.status(500).json({
          success: false,
          message: 'Error deleting employee',
          error: err.message
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      });
    });
  } catch (error) {
    console.error('Employee deletion route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get employee attendance records
router.get('/:id/attendance', async (req, res) => {
  try {
    const db = database.getDatabase();
    const employeeId = req.params.id;
    const { month, year, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        a.*,
        e.name as employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.employee_id = ?
    `;

    const params = [employeeId];

    if (month && year) {
      query += ` AND strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?`;
      params.push(month.toString().padStart(2, '0'), year.toString());
    }

    query += ` ORDER BY a.date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching employee attendance:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching employee attendance',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Employee attendance fetched successfully'
      });
    });
  } catch (error) {
    console.error('Employee attendance route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
