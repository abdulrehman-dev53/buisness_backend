const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

const authRoutes = require('./routes/authRoutes');
const businessRoutes = require('./routes/businessRoutes');
const productRoutes = require('./routes/productRoutes');
const competitorRoutes = require('./routes/competitorRoutes');
const aiRoutes = require('./routes/aiRoutes');
const contentRoutes = require('./routes/contentRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Trust the first proxy hop (needed for correct req.ip behind load
// balancers / reverse proxies, which express-rate-limit relies on).
app.set('trust proxy', 1);

// --- Security & core middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize()); // strips $ and . operators from user input to prevent NoSQL injection

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use(apiLimiter);

// --- Health check ---
// --- Root route ---
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BizPilot AI API is running 🚀'
  });
});

// --- Health check ---
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BizPilot AI backend is running'
  });
});
// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/products', productRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
