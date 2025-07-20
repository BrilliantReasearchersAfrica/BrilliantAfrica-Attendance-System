const express = require('express');
const router = express.Router();
const database = require('../config/database');

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { employee_id, department_id, date, month, year, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        a.*,
        e.name as employee_name,
        e.employee_code,
        d.name as department_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;

    const params = [];

    if (employee_id) {
      query += ` AND a.employee_id = ?`;
      params.push(employee_id);
    }

    if (department_id) {
      query += ` AND e.department_id = ?`;
      params.push(department_id);
    }

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (month && year) {
      query += ` AND strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?`;
      params.push(month.toString().padStart(2, '0'), year.toString());
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY a.date DESC, e.name LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching attendance:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching attendance',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Attendance records fetched successfully'
      });
    });
  } catch (error) {
    console.error('Attendance route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get daily attendance
router.get('/daily', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { date, department } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT 
        a.*,
        e.name as employee_name,
        e.employee_code,
        d.name as department_name,
        CASE 
          WHEN a.check_in_time > '09:00:00' THEN 'Late'
          ELSE 'On Time'
        END as punctuality
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.date = ?
    `;

    const params = [targetDate];

    if (department) {
      query += ` AND e.department_id = ?`;
      params.push(department);
    }

    query += ` ORDER BY e.name`;

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching daily attendance:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching daily attendance',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Daily attendance fetched successfully'
      });
    });
  } catch (error) {
    console.error('Daily attendance route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get monthly attendance summary
router.get('/monthly', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { month, year, department } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month || (currentDate.getMonth() + 1);
    const targetYear = year || currentDate.getFullYear();

    let query = `
      SELECT 
        e.id,
        e.name as employee_name,
        e.employee_code,
        d.name as department_name,
        COUNT(a.id) as total_records,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN a.status = 'half_day' THEN 1 ELSE 0 END) as half_days,
        SUM(CASE WHEN a.is_weekend = 1 AND a.status = 'present' THEN 1 ELSE 0 END) as weekend_work,
        ROUND(AVG(a.hours_worked), 2) as avg_hours_worked,
        SUM(a.overtime_hours) as total_overtime,
        (SELECT COUNT(*) FROM (
          SELECT DISTINCT date FROM attendance 
          WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
        )) as total_working_days
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN attendance a ON e.id = a.employee_id 
        AND strftime('%m', a.date) = ? 
        AND strftime('%Y', a.date) = ?
      WHERE e.status = 'active'
    `;

    const params = [
      targetMonth.toString().padStart(2, '0'),
      targetYear.toString(),
      targetMonth.toString().padStart(2, '0'),
      targetYear.toString()
    ];

    if (department) {
      query += ` AND e.department_id = ?`;
      params.push(department);
    }

    query += ` GROUP BY e.id, e.name, d.name ORDER BY e.name`;

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching monthly attendance:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching monthly attendance',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Monthly attendance fetched successfully'
      });
    });
  } catch (error) {
    console.error('Monthly attendance route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get late clock-in report
router.get('/late-clockin', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { date, month, year, department } = req.query;

    let query = `
      SELECT 
        a.*,
        e.name as employee_name,
        e.employee_code,
        d.name as department_name,
        TIME(a.check_in_time, '-09:00:00') as late_by
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.check_in_time > '09:00:00' AND a.status = 'present'
    `;

    const params = [];

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }

    if (month && year) {
      query += ` AND strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?`;
      params.push(month.toString().padStart(2, '0'), year.toString());
    }

    if (department) {
      query += ` AND e.department_id = ?`;
      params.push(department);
    }

    query += ` ORDER BY a.date DESC, a.check_in_time DESC`;

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching late clock-in report:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching late clock-in report',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Late clock-in report fetched successfully'
      });
    });
  } catch (error) {
    console.error('Late clock-in route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get overtime report
router.get('/overtime', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { month, year, department } = req.query;

    let query = `
      SELECT 
        a.*,
        e.name as employee_name,
        e.employee_code,
        d.name as department_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.overtime_hours > 0
    `;

    const params = [];

    if (month && year) {
      query += ` AND strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?`;
      params.push(month.toString().padStart(2, '0'), year.toString());
    }

    if (department) {
      query += ` AND e.department_id = ?`;
      params.push(department);
    }

    query += ` ORDER BY a.date DESC, a.overtime_hours DESC`;

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching overtime report:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching overtime report',
          error: err.message
        });
      }

      res.json({
        success: true,
        data: rows,
        message: 'Overtime report fetched successfully'
      });
    });
  } catch (error) {
    console.error('Overtime route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Create attendance record
router.post('/', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { 
      employee_id, 
      date, 
      status, 
      check_in_time, 
      check_out_time, 
      hours_worked, 
      overtime_hours, 
      is_weekend, 
      notes 
    } = req.body;

    if (!employee_id || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, date, and status are required'
      });
    }

    const query = `
      INSERT INTO attendance (
        employee_id, date, status, check_in_time, check_out_time, 
        hours_worked, overtime_hours, is_weekend, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      employee_id,
      date,
      status,
      check_in_time || null,
      check_out_time || null,
      hours_worked || 0,
      overtime_hours || 0,
      is_weekend || 0,
      notes || null
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Error creating attendance record:', err);
        return res.status(500).json({
          success: false,
          message: 'Error creating attendance record',
          error: err.message
        });
      }

      res.status(201).json({
        success: true,
        data: { id: this.lastID },
        message: 'Attendance record created successfully'
      });
    });
  } catch (error) {
    console.error('Attendance creation route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;