require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Boots the server: connects to MongoDB first, then starts listening.
 * This ordering ensures the app never accepts traffic before the
 * database connection is established.
 */
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(
      `BizPilot AI backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });

  // Graceful shutdown & crash safety
  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
