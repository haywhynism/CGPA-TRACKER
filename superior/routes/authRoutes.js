const express = require("express");

const {
  requestActivation,
} = require("../controllers/authController");

const router = express.Router();

router.post("/request-activation", requestActivation);

module.exports = router;