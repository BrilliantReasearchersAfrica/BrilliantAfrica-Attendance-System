const database = require('../config/database');

class Attendance {
  static getDailyAttendance(date, departmentId = null) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      let query = `
        SELECT 
          e.id,
          e.name,
          e.employee_code,
          d.name as department_name,
          a.clock_in,
          a.clock_out,
          a.status,
          a.hours_worked,
          a.overtime_hours,
          CASE 
            WHEN a.clock_in > '09:00:00' THEN 'Late'
            WHEN a.clock_in IS NULL AND a.status = 'absent' THEN 'Absent'
            ELSE 'On Time'
          END as punctuality
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = ?
        WHERE e.status = 'active'
      `;
      
      const params = [date];
      
      if (departmentId && departmentId > 1) {
        query += ` AND e.department_id = ?`;
        params.push(departmentId);
      }
      
      query += ` ORDER BY e.name`;
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getMonthlyInOut(month, year, employeeId = null) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      let query = `
        SELECT 
          e.name,
          a.date,
          a.clock_in,
          a.clock_out,
          a.hours_worked,
          a.status
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.employee_id
        WHERE e.status = 'active'
        AND strftime('%m', a.date) = ?
        AND strftime('%Y', a.date) = ?
      `;
      
      const params = [month.toString().padStart(2, '0'), year.toString()];
      
      if (employeeId) {
        query += ` AND e.id = ?`;
        params.push(employeeId);
      }
      
      query += ` ORDER BY a.date DESC, e.name`;
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getLateClockIn(month, year, departmentId = null) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      let query = `
        SELECT 
          e.name,
          e.employee_code,
          d.name as department_name,
          a.date,
          a.clock_in,
          TIME(a.clock_in, '-09:00:00') as late_by
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN attendance a ON e.id = a.employee_id
        WHERE e.status = 'active'
        AND a.clock_in > '09:00:00'
        AND strftime('%m', a.date) = ?
        AND strftime('%Y', a.date) = ?
      `;
      
      const params = [month.toString().padStart(2, '0'), year.toString()];
      
      if (departmentId && departmentId > 1) {
        query += ` AND e.department_id = ?`;
        params.push(departmentId);
      }
      
      query += ` ORDER BY a.date DESC, a.clock_in DESC`;
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getOvertime(month, year, departmentId = null) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      let query = `
        SELECT 
          e.name,
          e.employee_code,
          d.name as department_name,
          SUM(a.overtime_hours) as total_overtime,
          COUNT(CASE WHEN a.overtime_hours > 0 THEN 1 END) as overtime_days,
          AVG(a.overtime_hours) as avg_overtime
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN attendance a ON e.id = a.employee_id
        WHERE e.status = 'active'
        AND strftime('%m', a.date) = ?
        AND strftime('%Y', a.date) = ?
      `;
      
      const params = [month.toString().padStart(2, '0'), year.toString()];
      
      if (departmentId && departmentId > 1) {
        query += ` AND e.department_id = ?`;
        params.push(departmentId);
      }
      
      query += ` GROUP BY e.id, e.name, e.employee_code, d.name
                 HAVING total_overtime > 0
                 ORDER BY total_overtime DESC`;
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getSummary(month, year, departmentId = null) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      let query = `
        SELECT 
          COUNT(DISTINCT e.id) as total_employees,
          COUNT(DISTINCT CASE WHEN a.status = 'present' THEN e.id END) as active_employees,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present_days,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent_days,
          COUNT(CASE WHEN a.clock_in > '09:00:00' THEN 1 END) as total_late_arrivals,
          SUM(a.overtime_hours) as total_overtime_hours,
          AVG(a.hours_worked) as avg_hours_worked
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN attendance a ON e.id = a.employee_id
        WHERE e.status = 'active'
        AND strftime('%m', a.date) = ?
        AND strftime('%Y', a.date) = ?
      `;
      
      const params = [month.toString().padStart(2, '0'), year.toString()];
      
      if (departmentId && departmentId > 1) {
        query += ` AND e.department_id = ?`;
        params.push(departmentId);
      }
      
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static getHolidays(year) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = `
        SELECT * FROM holidays 
        WHERE strftime('%Y', date) = ? 
        ORDER BY date
      `;
      
      db.all(query, [year.toString()], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static clockIn(employeeId) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];
      
      const query = `
        INSERT OR REPLACE INTO attendance (employee_id, date, clock_in, status)
        VALUES (?, ?, ?, 'present')
      `;
      
      db.run(query, [employeeId, today, currentTime], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, clock_in: currentTime, date: today });
        }
      });
    });
  }

  static clockOut(employeeId) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];
      
      const query = `
        UPDATE attendance 
        SET clock_out = ?, 
            hours_worked = ROUND((julianday(datetime(date || ' ' || ?)) - julianday(datetime(date || ' ' || clock_in))) * 24, 2),
            overtime_hours = CASE 
              WHEN ROUND((julianday(datetime(date || ' ' || ?)) - julianday(datetime(date || ' ' || clock_in))) * 24, 2) > 8 
              THEN ROUND((julianday(datetime(date || ' ' || ?)) - julianday(datetime(date || ' ' || clock_in))) * 24, 2) - 8
              ELSE 0 
            END
        WHERE employee_id = ? AND date = ?
      `;
      
      db.run(query, [currentTime, currentTime, currentTime, currentTime, employeeId, today], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ clock_out: currentTime, date: today });
        }
      });
    });
  }
}

module.exports = Attendance;