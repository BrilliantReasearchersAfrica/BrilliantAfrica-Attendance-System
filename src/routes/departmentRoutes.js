const express = require('express');
const router = express.Router();
const database = require('../config/database');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { search, status } = req.query;

    let query = `
      SELECT 
        d.*,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND d.name LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    if (status && status !== '') {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY d.id ORDER BY d.name`;

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching departments:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching departments',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Departments fetched successfully'
      });
    });
  } catch (error) {
    console.error('Department route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const db = database.getDatabase();
    const departmentId = req.params.id;

    const query = `SELECT * FROM departments WHERE id = ?`;

    db.get(query, [departmentId], (err, row) => {
      if (err) {
        console.error('Error fetching department:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching department',
          error: err.message
        });
      }

      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.json({
        success: true,
        data: row,
        message: 'Department fetched successfully'
      });
    });
  } catch (error) {
    console.error('Department route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get employees in a department
router.get('/:id/employees', async (req, res) => {
  try {
    const db = database.getDatabase();
    const departmentId = req.params.id;

    const query = `
      SELECT 
        e.id,
        e.name,
        e.email,
        e.employee_code,
        e.position,
        e.hire_date,
        e.status,
        d.name as department_name
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.department_id = ? AND e.status = 'active'
      ORDER BY e.name
    `;

    db.all(query, [departmentId], (err, rows) => {
      if (err) {
        console.error('Error fetching department employees:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching department employees',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Department employees fetched successfully'
      });
    });
  } catch (error) {
    console.error('Department employees route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Create new department
router.post('/', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    const query = `INSERT INTO departments (name) VALUES (?)`;

    db.run(query, [name.trim()], function(err) {
      if (err) {
        console.error('Error creating department:', err);
        return res.status(500).json({
          success: false,
          message: 'Error creating department',
          error: err.message
        });
      }

      res.status(201).json({
        success: true,
        data: {
          id: this.lastID,
          name: name.trim()
        },
        message: 'Department created successfully'
      });
    });
  } catch (error) {
    console.error('Create department route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const db = database.getDatabase();
    const departmentId = req.params.id;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    const query = `UPDATE departments SET name = ? WHERE id = ?`;

    db.run(query, [name.trim(), departmentId], function(err) {
      if (err) {
        console.error('Error updating department:', err);
        return res.status(500).json({
          success: false,
          message: 'Error updating department',
          error: err.message
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: departmentId,
          name: name.trim()
        },
        message: 'Department updated successfully'
      });
    });
  } catch (error) {
    console.error('Update department route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const db = database.getDatabase();
    const departmentId = req.params.id;

    // Check if department has employees
    const checkQuery = `SELECT COUNT(*) as count FROM employees WHERE department_id = ? AND status = 'active'`;
    
    db.get(checkQuery, [departmentId], (err, row) => {
      if (err) {
        console.error('Error checking department employees:', err);
        return res.status(500).json({
          success: false,
          message: 'Error checking department employees',
          error: err.message
        });
      }

      if (row.count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete department with active employees'
        });
      }

      // Delete department
      const deleteQuery = `DELETE FROM departments WHERE id = ?`;
      
      db.run(deleteQuery, [departmentId], function(err) {
        if (err) {
          console.error('Error deleting department:', err);
          return res.status(500).json({
            success: false,
            message: 'Error deleting department',
            error: err.message
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Department not found'
          });
        }

        res.json({
          success: true,
          message: 'Department deleted successfully'
        });
      });
    });
  } catch (error) {
    console.error('Delete department route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;