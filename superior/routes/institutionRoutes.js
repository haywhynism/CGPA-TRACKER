const express = require("express");

const router = express.Router();

const {
  createInstitution,
} = require("../controllers/institutionController");

router.post("/", createInstitution);

module.exports = router;