// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');   // ✅ keep only this one
require('dotenv').config();

const routes = require('./routes');
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const config = require('./config/config');

// Rate limit specifically for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 AI requests per window
  message: { message: 'Too many AI requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiting for all routes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: { message: 'Too many requests' }
}));

// Connect to database
connectDB();

// Routes
app.use('/api', routes);

// Apply AI-specific rate limiting
app.use('/api/quiz/generate', aiRateLimit);
app.use('/api/chat/message', aiRateLimit);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📱 Frontend URLs allowed: ${config.cors.origins.join(', ')}`);
  console.log(`⚡ Environment: ${config.nodeEnv}`);
});

module.exports = app;


// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// require('dotenv').config();

// const routes = require('./routes');
// const { connectDB } = require('./database');
// const { errorHandler, notFound } = require('./middleware');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Security & middleware
// app.use(helmet());

// // Updated CORS configuration - Allow both ports
// app.use(cors({
//     origin: [
//         'http://localhost:3000',  // For live-server
//         'http://localhost:5173',  // For Vite
//         'http://127.0.0.1:5173',  // Alternative Vite URL
//         process.env.FRONTEND_URL  // From .env file
//     ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(express.json({ limit: '10mb' }));

// // Rate limiting
// app.use(rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100
// }));

// // Connect to database
// connectDB();

// // Routes
// app.use('/api', routes);

// // Health check
// app.get('/api/health', (req, res) => {
//     res.json({ 
//         status: 'OK', 
//         timestamp: new Date().toISOString(),
//         uptime: process.uptime()
//     });
// });

// // Error handling
// app.use(notFound);
// app.use(errorHandler);

// app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📱 Frontend URLs allowed:`);
//     console.log(`   - http://localhost:3000`);
//     console.log(`   - http://localhost:5173`);
//     console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
// });

// module.exports = app;