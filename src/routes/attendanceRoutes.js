const express = require('express');

// This function now accepts 'db' as an argument
module.exports = (db) => {
  const router = express.Router();

  if (!db) {
    console.error('Database instance not provided to attendanceRoutes!');
    // You might want to throw an error or handle this more gracefully
    // depending on your application's error handling strategy.
    return router; // Return an empty router if db is not available
  }

  // GET /api/attendance/daily – Daily attendance
  router.get('/daily', (req, res) => {
    const { date, department } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date query parameter is required for daily attendance.' });
    }

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
      if (err) {
        console.error("Error fetching daily attendance:", err.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
      }
      res.json({ success: true, data: rows });
    });
  });

  // GET /api/attendance/monthly – Monthly summaries
  router.get('/monthly', (req, res) => {
    const { month, year, department } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year query parameters are required for monthly summaries.' });
    }
    // Basic validation for month and year format (can be enhanced)
    if (month.length !== 2 || year.length !== 4 || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
      return res.status(400).json({ success: false, message: 'Invalid month or year format. Use MM and YYYY.' });
    }


    let sql = `
      SELECT e.name, d.name AS department,
        SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) AS absent_days,
        SUM(CASE WHEN a.status='half_day' THEN 1 ELSE 0 END) AS half_days,
        SUM(CASE WHEN a.is_weekend=1 AND a.status='present' THEN 1 ELSE 0 END) AS weekend_work,
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
    sql += ' GROUP BY e.id, e.name, d.name'; // Group by all non-aggregated columns
    sql += ' ORDER BY e.name'; // Optional: order the results

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("Error fetching monthly summaries:", err.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
      }
      res.json({ success: true, data: rows });
    });
  });

  // GET /api/attendance/late-clockin – Late arrivals
  router.get('/late-clockin', (req, res) => {
    const { date, month, year, department } = req.query;

    if (!date && (!month || !year)) {
      return res.status(400).json({ success: false, message: 'Either a specific date or a combination of month and year are required for late clock-ins.' });
    }

    let sql = `
      SELECT a.date, e.name AS employee_name, d.name AS department_name, a.clock_in, a.hours_worked
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE a.clock_in IS NOT NULL AND time(a.clock_in) > '09:00:00'
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
    sql += ' ORDER BY a.date, a.clock_in'; // Optional: order the results

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("Error fetching late clock-ins:", err.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
      }

      // Calculate late_by in minutes for each row
      rows.forEach(row => {
        if (row.clock_in) {
          const [h, m, s] = row.clock_in.split(':').map(Number);
          const clockInMinutes = h * 60 + m;
          const nineAMInMinutes = 9 * 60;
          const lateMinutes = clockInMinutes - nineAMInMinutes;
          row.late_by = lateMinutes > 0 ? `${lateMinutes} min` : 'N/A';
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

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year query parameters are required for overtime logs.' });
    }
    // Basic validation for month and year format (can be enhanced)
    if (month.length !== 2 || year.length !== 4 || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
      return res.status(400).json({ success: false, message: 'Invalid month or year format. Use MM and YYYY.' });
    }

    let sql = `
      SELECT a.date, e.name AS employee_name, d.name AS department_name, a.hours_worked AS regular_hours, a.overtime_hours, (a.hours_worked + a.overtime_hours) AS total_hours
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
    sql += ' ORDER BY a.date, e.name'; // Optional: order the results

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("Error fetching overtime logs:", err.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
      }
      res.json({ success: true, data: rows });
    });
  });

  return router;
};