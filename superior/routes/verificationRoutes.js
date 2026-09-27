const express = require("express");

const {
  startVerification,
  getVerificationStatus,
  veriffWebhook,
  getPendingVerifications,
    getVerificationDetails,
  approveVerification,
  rejectVerification,
    getApprovedStaff,
  getRejectedStaff,
   getVerificationStats,
} = require("../controllers/verificationController");

// const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const {
    protect,
    protectVerification,
    authorize,
} = require("../middleware/authMiddleware");


router.post(
    "/start",
    protectVerification,
    startVerification
);

router.get(
    "/status",
    protectVerification,
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


router.get(
  "/stats",
  protect,
  authorize("admin"),
  getVerificationStats
);

router.get(
  "/approved",
  protect,
  authorize("admin"),
  getApprovedStaff
);

router.get(
  "/rejected",
  protect,
  authorize("admin"),
  getRejectedStaff
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getVerificationDetails
);



module.exports = router;