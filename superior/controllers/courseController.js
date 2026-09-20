const Course = require("../models/Course");
const Department = require("../models/Department");
const Institution = require("../models/Institution");

// Create course
const createCourse = async (req, res) => {
  try {
    const {
      code,
      title,
      courseUnit,
      departmentId,
      institutionId,
      level,
      semester,
      academicSession,
      courseType,
    } = req.body;

    // Validate required fields
    if (
      !code ||
      !title ||
      !courseUnit ||
      !departmentId ||
      !institutionId ||
      !level ||
      !semester ||
      !academicSession
    ) {
      return res.status(400).json({
        message:
          "Please provide code, title, course unit, department, institution, level, semester and academic session",
      });
    }

    // Check institution
    const institution = await Institution.findById(institutionId);

    if (!institution) {
      return res.status(404).json({
        message: "Institution not found",
      });
    }

    // Check department
    const department = await Department.findById(departmentId);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    // Make sure department belongs to institution
    if (department.institution.toString() !== institutionId.toString()) {
      return res.status(400).json({
        message: "Department does not belong to this institution",
      });
    }

    // Check for duplicate course
    const existingCourse = await Course.findOne({
      code: code.toUpperCase().trim(),
      department: departmentId,
      level,
      semester,
      academicSession: academicSession.trim(),
    });

    if (existingCourse) {
      return res.status(400).json({
        message:
          "This course already exists for this department, level, semester and academic session",
      });
    }

    // Create course
    const course = await Course.create({
      code: code.toUpperCase().trim(),
      title,
      courseUnit,
      department: departmentId,
      institution: institutionId,
      level,
      semester,
      academicSession: academicSession.trim(),
      courseType: courseType || "compulsory",
    });

    // Return populated course
    const populatedCourse = await Course.findById(course._id)
      .populate("department", "name code faculty")
      .populate("institution", "name code type gradingScale");

    return res.status(201).json({
      message: "Course created successfully",
      course: populatedCourse,
    });
  } catch (error) {
    console.error("Create course error:", error);

    // Handle MongoDB duplicate index
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "This course already exists for this department, level, semester and academic session",
      });
    }

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Get all courses
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("department", "name code faculty")
      .populate("institution", "name code type gradingScale")
      .sort({ level: 1, semester: 1, code: 1 });

    return res.status(200).json({
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Get courses error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Get one course
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("department", "name code faculty")
      .populate("institution", "name code type gradingScale");

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    return res.status(200).json({
      course,
    });
  } catch (error) {
    console.error("Get course error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
  createCourse,
  getCourses,
  getCourseById,
};