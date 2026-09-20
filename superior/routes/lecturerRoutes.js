const express = require("express");

const {
  createLecturer,
  getLecturers,
  getLecturerById,
} = require("../controllers/lecturerController");

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
  createLecturer
);

// Admin only
router.get(
  "/",
  protect,
  authorize("admin"),
  getLecturers
);

// Admin only
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getLecturerById
);

module.exports = router;