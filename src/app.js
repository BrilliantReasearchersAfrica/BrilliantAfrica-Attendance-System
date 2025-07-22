// app.js
const express = require('express');
const cors = require('cors');

module.exports = (db) => {
  if (!db) {
    console.error('Database connection not provided to app.js!');
  }

  const app = express();  // Create the app inside this function

  app.use(cors());
  app.use(express.json());

  // Import routes, passing the db instance
  const attendanceRoutes = require('./routes/attendanceRoutes')(db);
  const authRoutes = require('./routes/authRoutes')(db);
  const departmentRoutes = require('./routes/departmentRoutes')(db);
  const employeeRoutes = require('./routes/employeeRoutes')(db);

  // Mount routes
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/employees', employeeRoutes);

  return app; // Return the configured app
};
