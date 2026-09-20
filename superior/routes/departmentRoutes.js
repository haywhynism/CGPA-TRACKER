const express = require("express");

const router = express.Router();

const {
  createDepartment,
  getDepartments,
  getDepartmentById,
} = require("../controllers/departmentController");

// Create department
router.post("/", createDepartment);

// Get all departments
router.get("/", getDepartments);

// Get one department
router.get("/:id", getDepartmentById);

module.exports = router;