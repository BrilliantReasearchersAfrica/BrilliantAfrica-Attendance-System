const express = require('express');
const router = express.Router();
const db = require('../config/database').getDatabase();

// GET /api/attendance/daily – Daily attendance
router.get('/daily', (req, res) => {
  const { date, department } = req.query;
  let sql = `
    SELECT a.*, e.name, d.name AS department
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE a.date = ?
  `;
  let params = [date];
  if (department) {
    sql += ' AND d.id = ?';
    params.push(department);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// GET /api/attendance/monthly – Monthly summaries
router.get('/monthly', (req, res) => {
  const { month, year, department } = req.query;
  let sql = `
    SELECT e.name, d.name AS department,
      SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) AS present_days,
      SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) AS absent_days,
      SUM(CASE WHEN a.status='half_day' THEN 1 ELSE 0 END) AS half_days,
      SUM(CASE WHEN a.is_weekend=1 THEN 1 ELSE 0 END) AS weekend_work,
      ROUND(AVG(a.hours_worked),2) AS avg_hours,
      ROUND(SUM(a.overtime_hours),2) AS total_overtime,
      ROUND(100.0 * SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) / COUNT(*),2) AS attendance_percent
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?
  `;
  let params = [month, year];
  if (department) {
    sql += ' AND d.id = ?';
    params.push(department);
  }
  sql += ' GROUP BY e.id';
  db.all(sql, params, (err, rows) => {
    if (err) return res.json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

// GET /api/attendance/late-clockin – Late arrivals
router.get('/late-clockin', (req, res) => {
  const { date, month, year, department } = req.query;
  let sql = `
    SELECT a.date, e.name AS employee, d.name AS department, a.clock_in, a.hours_worked,
      (strftime('%H:%M', a.clock_in) > '09:00') AS is_late,
      (strftime('%H:%M', a.clock_in) - '09:00') AS late_by
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1
  `;
  let params = [];
  if (date) {
    sql += ' AND a.date = ?';
    params.push(date);
  } else if (month && year) {
    sql += ' AND strftime(\'%m\', a.date) = ? AND strftime(\'%Y\', a.date) = ?';
    params.push(month, year);
  }
  if (department) {
    sql += ' AND d.id = ?';
    params.push(department);
  }
  sql += ' AND a.clock_in > "09:00:00"';
  db.all(sql, params, (err, rows) => {
    if (err) return res.json({ success: false, message: err.message });
    // Calculate late_by in minutes
    rows.forEach(row => {
      if (row.clock_in) {
        const [h, m] = row.clock_in.split(':');
        row.late_by = ((parseInt(h) * 60 + parseInt(m)) - 9 * 60) + ' min';
      } else {
        row.late_by = '-';
      }
    });
    res.json({ success: true, data: rows });
  });
});

// GET /api/attendance/overtime – Overtime logs
router.get('/overtime', (req, res) => {
  const { month, year, department } = req.query;
  let sql = `
    SELECT a.date, e.name AS employee, d.name AS department, a.hours_worked AS regular_hours, a.overtime_hours, (a.hours_worked + a.overtime_hours) AS total_hours
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?
      AND a.overtime_hours > 0
  `;
  let params = [month, year];
  if (department) {
    sql += ' AND d.id = ?';
    params.push(department);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.json({ success: false, message: err.message });
    res.json({ success: true, data: rows });
  });
});

module.exports = router;