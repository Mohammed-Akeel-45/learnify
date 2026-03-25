const mongoose = require('mongoose');

const weekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  title: { type: String, required: true },
  topics: [{ type: String }],
  objectives: [{ type: String }],
  resources: [{ type: String }]
}, { _id: false });

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    required: true
  },
  totalWeeks: {
    type: Number,
    required: true,
    min: 1,
    max: 52
  },
  weeks: [weekSchema],
  status: {
    type: String,
    enum: ['draft', 'approved'],
    default: 'draft'
  }
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', roadmapSchema);
