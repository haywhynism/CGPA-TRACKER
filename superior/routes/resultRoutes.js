const express = require("express");

const {
  createResult,
  submitResult,
  approveResult,
  rejectResult,
  resubmitResult,
   getResultStatistics,
    getApprovedResults,
      getRejectedResults,
       updateRejectedResult,
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
  authorize("hod"),
  approveResult
);


// HOD/Admin rejection
router.patch(
  "/:id/reject",
  protect,
  authorize("hod", "admin"),
  rejectResult
);

router.get(
  "/statistics",
  protect,
  authorize("admin", "hod"),
  getResultStatistics
);

router.get(
  "/approved",
  protect,
  authorize("admin", "hod"),
  getApprovedResults
);

router.get(
  "/rejected",
  protect,
  authorize("admin", "hod"),
  getRejectedResults
);

router.patch(
  "/:id/resubmit",
  protect,
  authorize("lecturer"),
  resubmitResult
);

router.patch(
  "/:id/edit-rejected",
  protect,
  authorize("lecturer"),
  updateRejectedResult
);


module.exports = router;