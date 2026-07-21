const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Student = require('./models/student');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:Sai%4012345@cluster0.helqwnk.mongodb.net/student_management?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await seedDatabase();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Seed data function
async function seedDatabase() {
  try {
    const count = await Student.countDocuments();
    if (count === 0) {
      console.log('Database empty. Seeding mock student records...');
      const mockStudents = [
        {
          name: 'Sarah Connor',
          studentId: 'STU001',
          email: 'sarah.c@university.edu',
          dateOfBirth: new Date('2002-05-15'),
          course: 'Computer Science',
          enrollmentStatus: 'Active',
          gradeOrGpa: 3.85,
          enrollmentDate: new Date('2023-09-01')
        },
        {
          name: 'John Connor',
          studentId: 'STU002',
          email: 'john.c@university.edu',
          dateOfBirth: new Date('2003-08-27'),
          course: 'Information Technology',
          enrollmentStatus: 'Active',
          gradeOrGpa: 3.20,
          enrollmentDate: new Date('2023-09-01')
        },
        {
          name: 'Marcus Wright',
          studentId: 'STU003',
          email: 'marcus.w@university.edu',
          dateOfBirth: new Date('2000-11-12'),
          course: 'Mechanical Engineering',
          enrollmentStatus: 'Graduated',
          gradeOrGpa: 3.90,
          enrollmentDate: new Date('2020-09-01')
        },
        {
          name: 'Ellen Ripley',
          studentId: 'STU004',
          email: 'ripley.e@university.edu',
          dateOfBirth: new Date('2001-01-07'),
          course: 'Data Science',
          enrollmentStatus: 'Active',
          gradeOrGpa: 3.72,
          enrollmentDate: new Date('2022-09-01')
        },
        {
          name: 'Peter Parker',
          studentId: 'STU005',
          email: 'parker.p@university.edu',
          dateOfBirth: new Date('2004-10-14'),
          course: 'Computer Science',
          enrollmentStatus: 'Active',
          gradeOrGpa: 3.95,
          enrollmentDate: new Date('2024-09-01')
        },
        {
          name: 'Bruce Wayne',
          studentId: 'STU006',
          email: 'wayne.b@university.edu',
          dateOfBirth: new Date('1999-02-19'),
          course: 'Business Administration',
          enrollmentStatus: 'Suspended',
          gradeOrGpa: 2.50,
          enrollmentDate: new Date('2021-09-01')
        },
        {
          name: 'Diana Prince',
          studentId: 'STU007',
          email: 'diana.p@university.edu',
          dateOfBirth: new Date('2001-09-10'),
          course: 'Data Science',
          enrollmentStatus: 'Active',
          gradeOrGpa: 4.00,
          enrollmentDate: new Date('2022-09-01')
        },
        {
          name: 'Tony Stark',
          studentId: 'STU008',
          email: 'stark.t@university.edu',
          dateOfBirth: new Date('2000-05-29'),
          course: 'Mechanical Engineering',
          enrollmentStatus: 'Graduated',
          gradeOrGpa: 3.98,
          enrollmentDate: new Date('2020-09-01')
        }
      ];
      await Student.insertMany(mockStudents);
      console.log('Successfully seeded database with', mockStudents.length, 'students.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// REST APIs

// 1. Get stats
app.get('/api/students/stats', async (req, res) => {
  try {
    const totalCount = await Student.countDocuments();
    const activeCount = await Student.countDocuments({ enrollmentStatus: 'Active' });
    const graduatedCount = await Student.countDocuments({ enrollmentStatus: 'Graduated' });
    const suspendedCount = await Student.countDocuments({ enrollmentStatus: 'Suspended' });
    const withdrawnCount = await Student.countDocuments({ enrollmentStatus: 'Withdrawn' });

    // Average GPA
    const gpaAggregation = await Student.aggregate([
      {
        $group: {
          _id: null,
          avgGpa: { $avg: '$gradeOrGpa' }
        }
      }
    ]);
    const avgGpa = gpaAggregation.length > 0 ? parseFloat(gpaAggregation[0].avgGpa.toFixed(2)) : 0;

    // Course distribution
    const courseDistribution = await Student.aggregate([
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      totalCount,
      activeCount,
      graduatedCount,
      suspendedCount,
      withdrawnCount,
      avgGpa,
      courseDistribution
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error while fetching statistics' });
  }
});

// 2. Get all students (with search, filter, sort)
app.get('/api/students', async (req, res) => {
  try {
    const { search, course, status, sort } = req.query;
    let query = {};

    // Search query matches name, email, or student ID (case insensitive)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex }
      ];
    }

    // Exact match filters
    if (course) {
      query.course = course;
    }
    if (status) {
      query.enrollmentStatus = status;
    }

    // Sort setup
    let sortOption = { createdAt: -1 }; // default
    if (sort) {
      switch (sort) {
        case 'gpa_asc':
          sortOption = { gradeOrGpa: 1 };
          break;
        case 'gpa_desc':
          sortOption = { gradeOrGpa: -1 };
          break;
        case 'name_asc':
          sortOption = { name: 1 };
          break;
        case 'name_desc':
          sortOption = { name: -1 };
          break;
        case 'id_asc':
          sortOption = { studentId: 1 };
          break;
        case 'id_desc':
          sortOption = { studentId: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    const students = await Student.find(query).sort(sortOption);
    res.json(students);
  } catch (error) {
    console.error('Error listing students:', error);
    res.status(500).json({ error: 'Internal server error while listing students' });
  }
});

// 3. Get single student
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Create new student
app.post('/api/students', async (req, res) => {
  try {
    const { name, studentId, email, dateOfBirth, course, enrollmentStatus, gradeOrGpa, enrollmentDate } = req.body;

    // Check unique fields before inserting to give clean errors
    const existingId = await Student.findOne({ studentId });
    if (existingId) {
      return res.status(400).json({ error: `Student ID "${studentId}" is already registered.` });
    }

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: `Email address "${email}" is already registered.` });
    }

    const newStudent = new Student({
      name,
      studentId,
      email,
      dateOfBirth,
      course,
      enrollmentStatus,
      gradeOrGpa,
      enrollmentDate
    });

    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { name, studentId, email, dateOfBirth, course, enrollmentStatus, gradeOrGpa, enrollmentDate } = req.body;

    // Check unique fields constraints
    if (studentId) {
      const existingId = await Student.findOne({ studentId, _id: { $ne: req.params.id } });
      if (existingId) {
        return res.status(400).json({ error: `Student ID "${studentId}" is already in use by another student.` });
      }
    }

    if (email) {
      const existingEmail = await Student.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({ error: `Email "${email}" is already in use by another student.` });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        studentId,
        email,
        dateOfBirth,
        course,
        enrollmentStatus,
        gradeOrGpa,
        enrollmentDate
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Delete student
// Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

    if (!deletedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      message: 'Student successfully deleted',
      deletedStudent
    });

  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 👇 ADD THIS HERE
app.get("/", (req, res) => {
  res.send("🚀 Student Management Backend Running Successfully");
});

// Existing code
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});