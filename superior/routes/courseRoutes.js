const express = require('express');

const {
    createCourse,
    getCourses,
    getCourseById,
} = require('../controllers/courseController');

const { protect, authorize, } = require("../middleware/authMiddleware");

const router = express.Router();
//Admin Only
router.post("/", protect, authorize("admin"), createCourse);



router.get("/", getCourses);

router.get("/:id", getCourseById);

module.exports = router;