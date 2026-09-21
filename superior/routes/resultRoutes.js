const express = require("express");

const {
  createResult,
  submitResult,
  approveResult,
  rejectResult,
} = require("../controllers/resultController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Lecturer/HOD can upload results
router.post(
  "/",
  protect,
  authorize("lecturer", "hod"),
  createResult
);

router.patch(
  "/:id/submit",
  protect,
  authorize("lecturer", "hod"),
  submitResult
);

// HOD/Admin approval
router.patch(
  "/:id/approve",
  protect,
  authorize("hod", "admin"),
  approveResult
);

// HOD/Admin rejection
router.patch(
  "/:id/reject",
  protect,
  authorize("hod", "admin"),
  rejectResult
);

module.exports = router;