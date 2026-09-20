const express = require("express");

const {
  createCourseAssignment,
  getCourseAssignments,
  getCourseAssignmentById,
} = require("../controllers/courseAssignmentController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Admin only
router.post(
  "/",
  protect,
  authorize("admin"),
  createCourseAssignment
);

// Admin only
router.get(
  "/",
  protect,
  authorize("admin"),
  getCourseAssignments
);

// Admin only
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getCourseAssignmentById
);

module.exports = router;