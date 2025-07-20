const app = require('./app');
const database = require('./config/database');

const PORT = process.env.PORT || 3000;

console.log('🚀 Starting BrilliantAfrica Attendance System...');

// Graceful shutdown handler
const gracefulShutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  database.close();
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
database.connect()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🎉 BrilliantAfrica Attendance System Started Successfully!');
      console.log('='.repeat(60));
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 Database: SQLite (Connected & Initialized)`);
      console.log(`🕐 Started at: ${new Date().toLocaleString()}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      console.log('📋 Available Endpoints:');
      console.log('   GET  /                    - Main Dashboard');
      console.log('   GET  /health              - Health Check');
      console.log('   GET  /api/attendance      - Get Attendance Data');
      console.log('   POST /api/attendance      - Create Attendance Record');
      console.log('='.repeat(60));
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    console.error('💡 Please check your database configuration and try again.');
    process.exit(1);
  });