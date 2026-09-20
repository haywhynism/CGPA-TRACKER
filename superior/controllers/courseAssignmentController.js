const CourseAssignment = require("../models/CourseAssignment");
const Course = require("../models/Course");
const User = require("../models/User");
const Department = require("../models/Department");
const Institution = require("../models/Institution");

// Create course assignment
const createCourseAssignment = async (req, res) => {
  try {
    const {
      courseId,
      lecturerId,
      academicSession,
      semester,
    } = req.body;

    // Validate required fields
    if (
      !courseId ||
      !lecturerId ||
      !academicSession ||
      !semester
    ) {
      return res.status(400).json({
        message:
          "Please provide course, lecturer, academic session and semester",
      });
    }

    // Check course
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Check lecturer
    const lecturer = await User.findById(lecturerId);

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer not found",
      });
    }

    // Make sure user is actually a lecturer
    if (lecturer.role !== "lecturer") {
      return res.status(400).json({
        message: "Selected user is not a lecturer",
      });
    }

    // Check lecturer is active
    if (!lecturer.isActive) {
      return res.status(400).json({
        message: "Lecturer account is inactive",
      });
    }

    // Check lecturer department
    if (!lecturer.department) {
      return res.status(400).json({
        message: "Lecturer is not assigned to a department",
      });
    }

    // Lecturer must belong to the same department as the course
    if (
      lecturer.department.toString() !==
      course.department.toString()
    ) {
      return res.status(400).json({
        message:
          "Lecturer does not belong to the course department",
      });
    }

    // Check department
    const department = await Department.findById(
      course.department
    );

    if (!department) {
      return res.status(404).json({
        message: "Course department not found",
      });
    }

    // Check institution
    const institution = await Institution.findById(
      course.institution
    );

    if (!institution) {
      return res.status(404).json({
        message: "Course institution not found",
      });
    }

    // Make sure assignment matches the course
    if (course.academicSession !== academicSession.trim()) {
      return res.status(400).json({
        message:
          "Academic session does not match the course academic session",
      });
    }

    if (course.semester !== semester) {
      return res.status(400).json({
        message:
          "Semester does not match the course semester",
      });
    }

    // Check duplicate assignment
    const existingAssignment =
      await CourseAssignment.findOne({
        course: courseId,
        lecturer: lecturerId,
        academicSession: academicSession.trim(),
        semester,
      });

    if (existingAssignment) {
      return res.status(400).json({
        message:
          "This lecturer is already assigned to this course",
      });
    }

    // Create assignment
    const assignment = await CourseAssignment.create({
      course: courseId,
      lecturer: lecturerId,
      institution: course.institution,
      department: course.department,
      academicSession: academicSession.trim(),
      semester,
    });

    // Return populated assignment
    const populatedAssignment =
      await CourseAssignment.findById(assignment._id)
        .populate(
          "course",
          "code title creditUnit level semester academicSession"
        )
        .populate(
          "lecturer",
          "name email matricNumber role department"
        )
        .populate(
          "department",
          "name code faculty"
        )
        .populate(
          "institution",
          "name code type gradingScale"
        );

    return res.status(201).json({
      message: "Course assigned to lecturer successfully",
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error(
      "Create course assignment error:",
      error
    );

    // Handle duplicate index
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "This lecturer is already assigned to this course",
      });
    }

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Get all course assignments
const getCourseAssignments = async (req, res) => {
  try {
    const assignments =
      await CourseAssignment.find()
        .populate(
          "course",
          "code title creditUnit level semester academicSession"
        )
        .populate(
          "lecturer",
          "name email matricNumber role"
        )
        .populate(
          "department",
          "name code faculty"
        )
        .populate(
          "institution",
          "name code type gradingScale"
        )
        .sort({ createdAt: -1 });

    return res.status(200).json({
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error(
      "Get course assignments error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Get one course assignment
const getCourseAssignmentById = async (req, res) => {
  try {
    const assignment =
      await CourseAssignment.findById(req.params.id)
        .populate(
          "course",
          "code title creditUnit level semester academicSession"
        )
        .populate(
          "lecturer",
          "name email matricNumber role"
        )
        .populate(
          "department",
          "name code faculty"
        )
        .populate(
          "institution",
          "name code type gradingScale"
        );

    if (!assignment) {
      return res.status(404).json({
        message: "Course assignment not found",
      });
    }

    return res.status(200).json({
      assignment,
    });
  } catch (error) {
    console.error(
      "Get course assignment error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
  createCourseAssignment,
  getCourseAssignments,
  getCourseAssignmentById,
};