// server.js or index.js
const database = require('./config/database'); // Your DB module with connect()
const appFactory = require('./app');           // Your app factory function

const PORT = process.env.PORT || 3000;

database.connect()
  .then((dbInstance) => {
    const app = appFactory(dbInstance);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
