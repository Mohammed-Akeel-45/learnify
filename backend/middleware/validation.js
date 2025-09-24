// middleware/validation.js
const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};

// Common validation rules
const authValidation = {
  register: [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
  ],
  login: [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ]
};

const quizValidation = {
  generate: [
    body('topic').notEmpty().withMessage('Topic required'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
    body('questionCount').isInt({ min: 3, max: 20 }).withMessage('Question count 3-20')
  ]
};

const roadmapValidation = {
  generate: [
    body('topic').notEmpty().withMessage('Topic required'),
    body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
    body('duration').isIn(['short', 'medium', 'long']).withMessage('Invalid duration')
  ]
};

module.exports = { validate, authValidation, quizValidation, roadmapValidation };

