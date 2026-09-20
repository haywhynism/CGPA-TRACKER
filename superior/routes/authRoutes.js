const express = require("express");

const {
  requestActivation,
  activateStudentAccount,
} = require("../controllers/authController");

const router = express.Router();

router.post("/request-activation", requestActivation);

router.post("/activate", activateStudentAccount);

module.exports = router;