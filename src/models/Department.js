const database = require('../config/database');

class Department {
  static getAll() {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = 'SELECT * FROM departments ORDER BY id';
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Department;