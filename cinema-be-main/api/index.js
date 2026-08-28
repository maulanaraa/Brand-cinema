const { connectDatabase } = require('../dist/config/database');
const { createApp } = require('../dist/app');

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = createApp();
  }
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Database connection error:', err);
  }
  return app(req, res);
};
