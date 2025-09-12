const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const routes = require('./routes');
const { connectDB } = require('./database');
const { errorHandler, notFound } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & middleware
app.use(helmet());

// Updated CORS configuration - Allow both ports
app.use(cors({
    origin: [
        'http://localhost:3000',  // For live-server
        'http://localhost:5173',  // For Vite
        'http://127.0.0.1:5173',  // Alternative Vite URL
        process.env.FRONTEND_URL  // From .env file
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
}));

// Connect to database
connectDB();

// Routes
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URLs allowed:`);
    console.log(`   - http://localhost:3000`);
    console.log(`   - http://localhost:5173`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;