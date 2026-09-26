const express = require("express");

const {
  startVerification,
  getVerificationStatus,
  veriffWebhook,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} = require("../controllers/verificationController");

// const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");


router.post(
  "/start",
  protect,
  authorize("lecturer", "hod"),
  startVerification
);

router.get(
  "/status",
  protect,
  getVerificationStatus
);


// Veriff webhook
// IMPORTANT:
// We will need the raw request body for
// cryptographic signature verification.
router.post(
  "/webhook",
  veriffWebhook
);


// Admin sees staff waiting for review
router.get(
  "/pending",
  protect,
  authorize("admin"),
  getPendingVerifications
);


// Admin approves
router.patch(
  "/:id/approve",
  protect,
  authorize("admin"),
  approveVerification
);


// Admin rejects
router.patch(
  "/:id/reject",
  protect,
  authorize("admin"),
  rejectVerification
);


module.exports = router;