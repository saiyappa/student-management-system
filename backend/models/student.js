const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true
  },
  enrollmentStatus: {
    type: String,
    enum: ['Active', 'Graduated', 'Suspended', 'Withdrawn'],
    default: 'Active'
  },
  gradeOrGpa: {
    type: Number,
    required: [true, 'GPA is required'],
    min: [0, 'GPA cannot be less than 0.0'],
    max: [4, 'GPA cannot be greater than 4.0']
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
