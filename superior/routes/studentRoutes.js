const express = require("express");

const router = express.Router();

const {
  createStudent,
  getStudents,
  getStudentById,
} = require("../controllers/studentController");

// Create student
router.post("/", createStudent);

// Get all students
router.get("/", getStudents);

// Get one student
router.get("/:id", getStudentById);

module.exports = router;