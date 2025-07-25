const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

class Database {
  constructor() {
    this.db = null;
  }

  /**
   * Connects to the SQLite database and initializes tables and seeds data.
   * The promise resolves only after all initialization and seeding is complete.
   * @returns {Promise<sqlite3.Database>} A promise that resolves with the connected database instance.
   */
  connect() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '..', 'database.sqlite');

      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error connecting to SQLite database:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          // Chain the initialization and seeding promises to ensure sequential execution
          this.initializeTables()
            .then(() => this.seedData()) // seedData internally calls insertSeedData and generateAttendanceData
            .then(() => {
              console.log('✅ All database initialization and seeding complete.');
              resolve(this.db); // Resolve the main connect promise only after all is done
            })
            .catch(initErr => {
              console.error('Error during database initialization/seeding:', initErr.message);
              reject(initErr);
            });
        }
      });
    });
  }

  /**
   * Initializes all necessary tables in the database.
   * @returns {Promise<void>} A promise that resolves when all tables are created.
   */
  initializeTables() {
    return new Promise((resolve, reject) => {
      const createTables = `
        -- Departments table
        CREATE TABLE IF NOT EXISTS departments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          role VARCHAR(20) DEFAULT 'user', -- admin/user
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Employees table
        CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          department_id INTEGER,
          employee_code VARCHAR(50),
          position VARCHAR(100),
          hire_date DATE,
          status VARCHAR(20) DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (department_id) REFERENCES departments(id)
        );

        -- Attendance table
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          date DATE NOT NULL,
          clock_in TIME,
          clock_out TIME,
          status VARCHAR(20) DEFAULT 'present',
          is_weekend BOOLEAN DEFAULT 0,
          is_holiday BOOLEAN DEFAULT 0,
          hours_worked DECIMAL(4,2) DEFAULT 0,
          overtime_hours DECIMAL(4,2) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        );

        -- Leaves table
        CREATE TABLE IF NOT EXISTS leaves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          leave_type VARCHAR(50) NOT NULL,
          is_paid BOOLEAN DEFAULT 1,
          status VARCHAR(20) DEFAULT 'approved',
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        );

        -- Holidays table
        CREATE TABLE IF NOT EXISTS holidays (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          date DATE NOT NULL,
          is_recurring BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Work schedules table
        CREATE TABLE IF NOT EXISTS work_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL,
          day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          is_working_day BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
      `;

      this.db.exec(createTables, (err) => {
        if (err) {
          console.error('Error creating tables:', err.message);
          reject(err);
        } else {
          console.log('✅ Database tables initialized');
          resolve(); // Resolve this promise when tables are created
        }
      });
    });
  }

  /**
   * Clears existing data and then inserts seed data.
   * @returns {Promise<void>} A promise that resolves when data is cleared and seeded.
   */
  seedData() {
    return new Promise((resolve, reject) => {
      const clearData = `
        DELETE FROM attendance;
        DELETE FROM leaves;
        DELETE FROM work_schedules;
        DELETE FROM holidays;
        DELETE FROM employees;
        DELETE FROM departments;
        DELETE FROM users;
      `;

      this.db.exec(clearData, (err) => {
        if (err) {
          console.error('Error clearing data:', err.message);
          reject(err);
        } else {
          console.log('✅ Existing data cleared');
          this.insertSeedData()
            .then(() => resolve()) // Resolve after insertSeedData completes
            .catch(reject);
        }
      });
    });
  }

  /**
   * Inserts initial seed data into the database.
   * @returns {Promise<void>} A promise that resolves when all seed data is inserted.
   */
  insertSeedData() {
    return new Promise(async (resolve, reject) => {
      try {
        // Insert admin user first
        const adminPassword = bcrypt.hashSync('123@', 10);
        const insertAdminUser = `
          INSERT INTO users (name, email, password, role) VALUES
          ('Fred Tuyishime', 'fred@gmail.com', ?, 'admin');
        `;
        await new Promise((res, rej) => {
          this.db.run(insertAdminUser, [adminPassword], (err) => { // Pass password as parameter
            if (err) {
              console.error('❌ Error inserting admin user:', err.message);
              rej(err);
            } else {
              console.log('✅ Admin user seeded');
              res();
            }
          });
        });

        // Insert departments
        const insertDepartments = `
          INSERT INTO departments (id, name) VALUES
            (1, 'All Members'),
            (2, 'HR Department'),
            (3, 'IT Department'),
            (4, 'Marketing Department'),
            (5, 'Finance Department'),
            (6, 'Operations Department'),
            (7, 'Sales Department');
        `;
        await new Promise((res, rej) => {
          this.db.exec(insertDepartments, (err) => {
            if (err) {
              console.error('❌ Error inserting departments:', err.message);
              rej(err);
            } else {
              console.log('✅ Departments seeded');
              res();
            }
          });
        });

        // Insert employees
        const insertEmployees = `
          INSERT INTO employees (name, email, department_id, employee_code, position, hire_date, status) VALUES
            ('IT Supporter', 'leo@brilliantafrica.com', 3, 'EMP001', 'IT Support Specialist', '2023-01-15', 'active'),
            ('Mary Smith', 'maryh@brilliantafrica.com', 2, 'EMP002', 'HR Manager', '2022-03-10', 'active'),
            ('Fred Tuyishime', 'fred@brilliantafrica.com', 4, 'EMP003', 'Marketing Coordinator', '2023-06-01', 'active'),
            ('John Doe', 'john@brilliantafrica.com', 5, 'EMP004', 'Finance Analyst', '2022-11-20', 'active'),
            ('Sarah Johnson', 'sarah@brilliantafrica.com', 6, 'EMP005', 'Operations Manager', '2023-02-14', 'active'),
            ('Michael Brown', 'michael@brilliantafrica.com', 7, 'EMP006', 'Sales Representative', '2023-04-05', 'active'),
            ('Emily Davis', 'emily@brilliantafrica.com', 3, 'EMP007', 'Software Developer', '2023-07-12', 'active'),
            ('David Wilson', 'david@brilliantafrica.com', 2, 'EMP008', 'HR Assistant', '2023-08-20', 'active');
        `;
        await new Promise((res, rej) => {
          this.db.exec(insertEmployees, (err) => {
            if (err) {
              console.error('❌ Error inserting employees:', err.message);
              rej(err);
            } else {
              console.log('✅ Employees seeded');
              res();
            }
          });
        });

        // Insert holidays
        const insertHolidays = `
          INSERT INTO holidays (name, date, is_recurring) VALUES
            ('New Year Day', '2025-01-01', 1),
            ('Liberation Day', '2025-07-04', 1),
            ('Genocide Memorial Day', '2025-04-07', 1),
            ('Christmas Day', '2025-12-25', 1),
            ('Boxing Day', '2025-12-26', 1);
        `;
        await new Promise((res, rej) => {
          this.db.exec(insertHolidays, (err) => {
            if (err) {
              console.error('❌ Error inserting holidays:', err.message);
              rej(err);
            } else {
              console.log('✅ Holidays seeded');
              res();
            }
          });
        });

        // Now generate attendance data after all initial seeds are done
        await this.generateAttendanceData(); // This also returns a promise
        resolve(); // Resolve insertSeedData promise
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Generates and inserts random attendance and leave data.
   * @returns {Promise<void>} A promise that resolves when all attendance and leave data is inserted.
   */
  generateAttendanceData() {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const attendanceData = [];
      const leaveData = [];

      const employeeIds = [1, 2, 3, 4, 5, 6, 7, 8];

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dateStr = date.toISOString().split('T')[0];

        employeeIds.forEach(employeeId => {
          const attendanceChance = Math.random();
          let status = 'present';
          let clockIn = null;
          let clockOut = null;
          let hoursWorked = 0;

          if (isWeekend) {
            if (attendanceChance > 0.8) {
              status = 'present';
              clockIn = '09:00:00';
              clockOut = '13:00:00';
              hoursWorked = 4;
            } else {
              status = 'weekend';
            }
          } else {
            if (attendanceChance > 0.95) {
              status = 'absent';
            } else if (attendanceChance > 0.9) {
              status = 'half_day';
              clockIn = '09:00:00';
              clockOut = '13:00:00';
              hoursWorked = 4;
            } else {
              status = 'present';
              const clockInHour = 8 + Math.floor(Math.random() * 1.5);
              const clockInMinute = Math.floor(Math.random() * 60);
              clockIn = `${clockInHour.toString().padStart(2, '0')}:${clockInMinute.toString().padStart(2, '0')}:00`;

              const workHours = 8 + Math.random();
              const clockOutTime = new Date(`2000-01-01 ${clockIn}`);
              clockOutTime.setHours(clockOutTime.getHours() + Math.floor(workHours));
              clockOutTime.setMinutes(clockOutTime.getMinutes() + ((workHours % 1) * 60));
              clockOut = clockOutTime.toTimeString().split(' ')[0];
              hoursWorked = Math.round(workHours * 100) / 100;
            }
          }

          attendanceData.push([
            employeeId,
            dateStr,
            clockIn,
            clockOut,
            status,
            isWeekend ? 1 : 0,
            0, // is_holiday (we'll update this separately)
            hoursWorked,
            hoursWorked > 8 ? hoursWorked - 8 : 0 // overtime
          ]);
        });
      }

      employeeIds.forEach(employeeId => {
        const numLeaves = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numLeaves; i++) {
          const leaveStart = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
          const leaveDuration = Math.floor(Math.random() * 5) + 1;
          const leaveEnd = new Date(leaveStart);
          leaveEnd.setDate(leaveEnd.getDate() + leaveDuration - 1);

          const leaveTypes = ['sick', 'vacation', 'personal', 'emergency'];
          const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];

          leaveData.push([
            employeeId,
            leaveStart.toISOString().split('T')[0],
            leaveEnd.toISOString().split('T')[0],
            leaveType,
            leaveType !== 'sick' ? 1 : 0,
            'approved',
            `${leaveType} leave`
          ]);
        }
      });

      const insertAttendance = `
        INSERT INTO attendance (employee_id, date, clock_in, clock_out, status, is_weekend, is_holiday, hours_worked, overtime_hours)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertLeave = `
        INSERT INTO leaves (employee_id, start_date, end_date, leave_type, is_paid, status, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      // Use Promise.all to wait for all inserts to complete
      const attendancePromises = attendanceData.map(record => {
        return new Promise((res, rej) => {
          this.db.run(insertAttendance, record, (err) => {
            if (err) {
              console.error('Error inserting attendance record:', err.message);
              rej(err);
            } else {
              res();
            }
          });
        });
      });

      const leavePromises = leaveData.map(record => {
        return new Promise((res, rej) => {
          this.db.run(insertLeave, record, (err) => {
            if (err) {
              console.error('Error inserting leave record:', err.message);
              rej(err);
            } else {
              res();
            }
          });
        });
      });

      Promise.all([...attendancePromises, ...leavePromises])
        .then(() => {
          console.log('✅ Attendance and leave data generated');
          resolve();
        })
        .catch(err => {
          console.error('Error during attendance/leave data generation:', err.message);
          reject(err);
        });
    });
  }

  /**
   * Returns the connected database instance.
   * @returns {sqlite3.Database|null} The database instance.
   */
  getDatabase() {
    return this.db;
  }

  /**
   * Closes the database connection.
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = new Database();
