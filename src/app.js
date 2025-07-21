const express = require('express');
const cors = require('cors');
const attendanceRoutes = require('./routes/attendanceRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors()); // ✅ CORS enabled for frontend
app.use(express.json()); // ✅ Parse JSON body

// Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Catch all
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
