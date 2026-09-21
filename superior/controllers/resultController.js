const Result = require("../models/Results");
const Student = require("../models/Student");
const Course = require("../models/Course");
const CourseAssignment = require("../models/CourseAssignment");
const Lecturer = require("../models/Lecturer");
const Institution = require("../models/Institution");
const { calculateGrade } = require("../utils/grading");




// Create result
const createResult = async (req, res) => {
    try {
        const {
            studentId,
            courseId,
            academicSession,
            semester,
            score,
        } = req.body;

        // Validate required fields
        if (
            !studentId ||
            !courseId ||
            !academicSession ||
            !semester ||
            score === undefined
        ) {
            return res.status(400).json({
                message:
                    "Please provide student, course, academic session, semester and score",
            });
        }

        // Validate score
        const numericScore = Number(score);

        if (
            Number.isNaN(numericScore) ||
            numericScore < 0 ||
            numericScore > 100
        ) {
            return res.status(400).json({
                message: "Score must be a number between 0 and 100",
            });
        }

        // Find logged-in lecturer profile
        const lecturer = await Lecturer.findOne({
            user: req.user._id,
            isActive: true,
        });

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
            });
        }

        // Verify lecturer is assigned to this course
        const assignment = await CourseAssignment.findOne({
            lecturer: lecturer._id,
            course: courseId,
            isActive: true,
            academicSession: academicSession.trim(),
            semester,
        });

        if (!assignment) {
            return res.status(403).json({
                message:
                    "You are not assigned to this course for this session and semester",
            });
        }

        // Find course
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        // Find course institution
        const institution = await Institution.findById(
            course.institution
        );

        if (!institution) {
            return res.status(404).json({
                message: "Course institution not found",
            });
        }

        // Make sure session matches course
        if (
            course.academicSession !==
            academicSession.trim()
        ) {
            return res.status(400).json({
                message:
                    "Academic session does not match the course",
            });
        }


        // Make sure semester matches course
        if (course.semester !== semester) {
            return res.status(400).json({
                message:
                    "Semester does not match the course",
            });
        }

        // Find student
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        // Student must be active
        if (!student.isActive) {
            return res.status(400).json({
                message: "Student account is inactive",
            });
        }

        // Student must belong to same department
        if (
            student.department.toString() !==
            course.department.toString()
        ) {
            return res.status(400).json({
                message:
                    "Student does not belong to the course department",
            });
        }

        // Student institution must match
        if (
            student.institution.toString() !==
            course.institution.toString()
        ) {
            return res.status(400).json({
                message:
                    "Student does not belong to the course institution",
            });
        }

        // Student level must match course level
        if (student.level !== course.level) {
            return res.status(400).json({
                message:
                    "Student level does not match the course level",
            });
        }

        // Student academic session must match
        if (
            student.academicSession !==
            academicSession.trim()
        ) {
            return res.status(400).json({
                message:
                    "Student academic session does not match",
            });
        }

        // Prevent duplicate result
        const existingResult = await Result.findOne({
            student: studentId,
            course: courseId,
            academicSession: academicSession.trim(),
            semester,
        });

        if (existingResult) {
            return res.status(400).json({
                message:
                    "A result already exists for this student and course",
            });
        }

        // Calculate grade
        const { grade, gradePoint } =
            calculateGrade(
                numericScore,
                institution.gradingRules
            );

        // Create result
        const result = await Result.create({
            student: studentId,
            course: courseId,
            academicSession: academicSession.trim(),
            semester,
            score: numericScore,
            grade,
            gradePoint,
            status: "draft",
            uploadedBy: req.user._id,
        });

        // Return populated result
        const populatedResult =
            await Result.findById(result._id)
                .populate(
                    "student",
                    "matricNumber name email department institution level academicSession"
                )
                .populate(
                    "course",
                    "code title courseUnit level semester academicSession"
                )
                .populate(
                    "uploadedBy",
                    "name email role staffId"
                );

        return res.status(201).json({
            message: "Result created successfully",
            result: populatedResult,
        });
    } catch (error) {
        console.error("Create result error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

const submitResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        message: "Result not found",
      });
    }

    // Only the lecturer who uploaded it can submit it
    if (
      result.uploadedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You can only submit results that you uploaded",
      });
    }

    if (result.status !== "draft") {
      return res.status(400).json({
        message:
          "Only draft results can be submitted",
      });
    }

    result.status = "submitted";

    await result.save();

    return res.status(200).json({
      message: "Result submitted successfully",
      result,
    });
  } catch (error) {
    console.error("Submit result error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Approve result
const approveResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        message: "Result not found",
      });
    }

    // Only submitted results can be approved
    if (result.status !== "submitted") {
      return res.status(400).json({
        message:
          "Only submitted results can be approved",
      });
    }

    // Prevent lecturer from approving their own result
    if (
      result.uploadedBy.toString() ===
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You cannot approve a result you uploaded",
      });
    }

    result.status = "approved";
    result.approvedBy = req.user._id;
    result.approvedAt = new Date();
    result.rejectionReason = null;

    await result.save();

    const populatedResult =
      await Result.findById(result._id)
        .populate(
          "student",
          "matricNumber name email"
        )
        .populate(
          "course",
          "code title courseUnit level semester academicSession"
        )
        .populate(
          "uploadedBy",
          "name email role staffId"
        )
        .populate(
          "approvedBy",
          "name email role staffId"
        );

    return res.status(200).json({
      message: "Result approved successfully",
      result: populatedResult,
    });
  } catch (error) {
    console.error("Approve result error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// Reject result
const rejectResult = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        message: "Please provide a rejection reason",
      });
    }

    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        message: "Result not found",
      });
    }

    // Only submitted results can be rejected
    if (result.status !== "submitted") {
      return res.status(400).json({
        message:
          "Only submitted results can be rejected",
      });
    }

    // Prevent lecturer from rejecting their own result
    if (
      result.uploadedBy.toString() ===
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You cannot reject a result you uploaded",
      });
    }

    result.status = "rejected";
    result.approvedBy = null;
    result.approvedAt = null;
    result.rejectionReason =
      rejectionReason.trim();

    await result.save();

    const populatedResult =
      await Result.findById(result._id)
        .populate(
          "student",
          "matricNumber name email"
        )
        .populate(
          "course",
          "code title courseUnit level semester academicSession"
        )
        .populate(
          "uploadedBy",
          "name email role staffId"
        );

    return res.status(200).json({
      message: "Result rejected successfully",
      result: populatedResult,
    });
  } catch (error) {
    console.error("Reject result error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
    createResult,
    submitResult,
    approveResult,
  rejectResult,
};