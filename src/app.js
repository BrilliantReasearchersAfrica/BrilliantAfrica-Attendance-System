const express = require('express');
const cors = require('cors');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());  // To parse JSON bodies

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is healthy ✅' });
});

// Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);

// 404 route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
