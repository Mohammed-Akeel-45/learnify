const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  duration: { type: String, default: '30 mins' },
  completed: { type: Boolean, default: false }
}, { _id: true });

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  weekNumber: { type: Number, required: true },
  lessons: [lessonSchema]
}, { _id: true });

const courseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
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
  modules: [moduleSchema],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  completedLessons: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
