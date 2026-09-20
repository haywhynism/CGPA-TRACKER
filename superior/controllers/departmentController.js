const Department = require("../models/Department");
const Institution = require("../models/Institution");

// Create a department
const createDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      faculty,
      institutionId,
    } = req.body;

    // Check required fields
    if (!name || !code || !faculty || !institutionId) {
      return res.status(400).json({
        message:
          "Please provide department name, code, faculty and institution ID",
      });
    }

    // Check if institution exists
    const institution = await Institution.findById(institutionId);

    if (!institution) {
      return res.status(404).json({
        message: "Institution not found",
      });
    }

    // Check if department already exists in this institution
    const existingDepartment = await Department.findOne({
      $or: [
        { name, institution: institutionId },
        { code, institution: institutionId },
      ],
    });

    if (existingDepartment) {
      return res.status(400).json({
        message: "Department already exists in this institution",
      });
    }

    // Create department
    const department = await Department.create({
      name,
      code,
      faculty,
      institution: institutionId,
    });

    res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.error("Create department error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Get all departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("institution", "name code type gradingScale");

    res.status(200).json({
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Get one department
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("institution", "name code type gradingScale");

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.status(200).json({
      department,
    });
  } catch (error) {
    console.error("Get department error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
};