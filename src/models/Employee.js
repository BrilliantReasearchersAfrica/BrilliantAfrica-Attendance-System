
const database = require('../config/database');

class Employee {
  static getAll(departmentId = null) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      let query = `
        SELECT e.*, d.name as department_name 
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.status = 'active'
      `;
      
      const params = [];
      
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

  static getById(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = `
        SELECT e.*, d.name as department_name 
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id 
        WHERE e.id = ?
      `;
      
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static getMonthlyAttendance(month, year, departmentId = null) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const monthStr = month.toString().padStart(2, '0');
      const yearStr = year.toString();
      let query = `
        SELECT 
          e.id,
          e.name,
          d.name as department,
          SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) AS present_days,
          SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) AS absent_days,
          SUM(CASE WHEN a.status='half_day' THEN 1 ELSE 0 END) AS half_days,
          SUM(CASE WHEN a.is_weekend=1 AND a.status='present' THEN 1 ELSE 0 END) AS weekend_work,
          ROUND(AVG(a.hours_worked),2) AS avg_hours,
          ROUND(SUM(a.overtime_hours),2) AS total_overtime,
          ROUND(100.0 * SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) / COUNT(a.id),2) AS attendance_percent
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN attendance a ON e.id = a.employee_id
          AND strftime('%m', a.date) = ?
          AND strftime('%Y', a.date) = ?
        WHERE e.status = 'active'
      `;
      const params = [monthStr, yearStr];
      if (departmentId) {
        query += ' AND e.department_id = ?';
        params.push(departmentId);
      }
      query += ' GROUP BY e.id, e.name, d.name ORDER BY e.name';
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Employee;