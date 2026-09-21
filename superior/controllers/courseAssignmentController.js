const CourseAssignment = require("../models/CourseAssignment");
const Course = require("../models/Course");
const User = require("../models/User");
const Department = require("../models/Department");
const Institution = require("../models/Institution");
const Lecturer = require("../models/Lecturer");


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

    // Check lecturer PROFILE
    const lecturer = await Lecturer.findById(lecturerId);

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer not found",
      });
    }

    // Lecturer must be active
    if (!lecturer.isActive) {
      return res.status(400).json({
        message: "Lecturer account is inactive",
      });
    }

    // Lecturer must have activated their account
    if (!lecturer.accountActivated || !lecturer.user) {
      return res.status(400).json({
        message:
          "Lecturer account has not been activated",
      });
    }

    // Check lecturer department
    if (!lecturer.department) {
      return res.status(400).json({
        message:
          "Lecturer is not assigned to a department",
      });
    }

    // Lecturer must belong to same department as course
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

    // Make sure academic session matches course
    if (
      course.academicSession !==
      academicSession.trim()
    ) {
      return res.status(400).json({
        message:
          "Academic session does not match the course academic session",
      });
    }

    // Make sure semester matches course
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
    const assignment =
      await CourseAssignment.create({
        course: courseId,
        lecturer: lecturerId,
        institution: course.institution,
        department: course.department,
        academicSession: academicSession.trim(),
        semester,
      });

    // Return populated assignment
    const populatedAssignment =
      await CourseAssignment.findById(
        assignment._id
      )
        .populate(
          "course",
          "code title courseUnit level semester academicSession"
        )
        .populate(
          "lecturer",
          "name email staffId department"
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
      message:
        "Course assigned to lecturer successfully",
      assignment: populatedAssignment,
    });
  } catch (error) {
    console.error(
      "Create course assignment error:",
      error
    );

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
          "code title courseUnit level semester academicSession"
        )
        .populate(
          "lecturer",
          "name email staffId department"
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
          "code title courseUnit level semester academicSession"
        )
        .populate(
          "lecturer",
          "name email staffId department"
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



const getMyCourses = async (req, res) => {
  try {
    // req.user is the logged-in User
    const userId = req.user._id;

    // Find the Lecturer profile connected to this User
    const lecturer = await Lecturer.findOne({
      user: userId,
      isActive: true,
    });

    if (!lecturer) {
      return res.status(404).json({
        message: "Lecturer profile not found",
      });
    }

    // Find courses assigned to this Lecturer
    const assignments = await CourseAssignment.find({
      lecturer: lecturer._id,
      isActive: true,
    })
      .populate(
        "course",
        "code title courseUnit department institution level semester academicSession courseType"
      )
      .populate(
        "lecturer",
        "name staffId email"
      );

    return res.status(200).json({
      count: assignments.length,
      courses: assignments,
    });
  } catch (error) {
    console.error("Get my courses error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports = {
  createCourseAssignment,
  getCourseAssignments,
  getCourseAssignmentById,
  getMyCourses,
};