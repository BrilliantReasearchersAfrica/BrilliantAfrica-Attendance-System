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
      
      // Calculate days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
      
      let query = `
        SELECT 
          e.id,
          e.name,
          e.employee_code,
          d.name as department_name,
          ${daysInMonth} as total_days_in_month,
          
          -- Calculate office days (weekdays - holidays)
          (SELECT COUNT(*) 
           FROM (
             WITH RECURSIVE dates(date) AS (
               SELECT '${startDate}'
               UNION ALL
               SELECT date(date, '+1 day')
               FROM dates
               WHERE date < '${endDate}'
             )
             SELECT date FROM dates 
             WHERE CAST(strftime('%w', date) AS INTEGER) NOT IN (0, 6)
             AND date NOT IN (SELECT date FROM holidays WHERE strftime('%Y', date) = '${year}'
      `;
      
      const params = [];
      
      if (departmentId && departmentId > 1) {
        query += ` WHERE e.department_id = ?`;
        params.push(departmentId);
      }
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Employee;