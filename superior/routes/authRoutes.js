const express = require("express");

const {
  requestActivation,
  activateStudentAccount,
  login,
  getMe,
   setupAdmin,
} = require("../controllers/authController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/request-activation", requestActivation);

router.post("/activate", activateStudentAccount);

router.post("/login", login)
router.post("/setup-admin", setupAdmin);

router.get("/me", protect, getMe);

router.get(
  "/student-test",
  protect,
  authorize("student"),
  (req, res) => {
    res.json({
      message: "You have student access",
      user: req.user,
    });
  }
);

router.get(
  "/lecturer-test",
  protect,
  authorize("lecturer"),
  (req, res) => {
    res.json({
      message: "You have lecturer access",
      user: req.user,
    });
  }
);

module.exports = router;