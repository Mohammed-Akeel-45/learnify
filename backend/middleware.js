const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.errors.map(e => ({ field: e.path, message: e.message }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            message: 'Resource already exists',
            field: err.errors[0]?.path
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
    }

    // Default error
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error'
    });
};

// 404 handler
const notFound = (req, res, next) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};

// Validation middleware
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        next();
    };
};

module.exports = {
    auth,
    errorHandler,
    notFound,
    validate
};