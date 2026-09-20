const Institution = require("../models/Institution");

// Create an institution
const createInstitution = async (req, res) => {
  try {
    const {
      name,
      type,
      code,
      gradingScale,
      gradingRules,
    } = req.body;

    // Check required fields
    if (
      !name ||
      !type ||
      !code ||
      !gradingScale ||
      !gradingRules ||
      gradingRules.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please provide name, type, code, grading scale and grading rules",
      });
    }

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({
      $or: [{ name }, { code }],
    });

    if (existingInstitution) {
      return res.status(400).json({
        message: "Institution already exists",
      });
    }

    // Create institution
    const institution = await Institution.create({
      name,
      type,
      code,
      gradingScale,
      gradingRules,
    });

    res.status(201).json({
      message: "Institution created successfully",
      institution,
    });
  } catch (error) {
    console.error("Create institution error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createInstitution,
};