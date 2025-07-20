const database = require('../config/database');

class Leave {
  static getLeaves(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      let query = `
        SELECT 
          l.*,
          e.name as employee_name,
          e.employee_code,
          d.name as department_name
        FROM leaves l
        LEFT JOIN employees e ON l.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filters.month && filters.year) {
        query += ` AND (
          (strftime('%m', l.start_date) = ? AND strftime('%Y', l.start_date) = ?) OR
          (strftime('%m', l.end_date) = ? AND strftime('%Y', l.end_date) = ?)
        )`;
        const monthStr = filters.month.toString().padStart(2, '0');
        const yearStr = filters.year.toString();
        params.push(monthStr, yearStr, monthStr, yearStr);
      }
      
      if (filters.department && filters.department > 1) {
        query += ` AND e.department_id = ?`;
        params.push(filters.department);
      }
      
      if (filters.employee) {
        query += ` AND e.id = ?`;
        params.push(filters.employee);
      }
      
      query += ` ORDER BY l.start_date DESC`;
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static apply(leaveData) {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = `
        INSERT INTO leaves (employee_id, start_date, end_date, leave_type, is_paid, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `;
      
      const { employee_id, start_date, end_date, leave_type, is_paid, reason } = leaveData;
      
      db.run(query, [employee_id, start_date, end_date, leave_type, is_paid, reason], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...leaveData });
        }
      });
    });
  }
}

module.exports = Leave;