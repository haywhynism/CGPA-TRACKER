const mongoose = require("mongoose");

const courseAssignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    academicSession: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: String,
      required: true,
      enum: ["first", "second"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same lecturer from being assigned
// to the same course twice in the same session/semester.
courseAssignmentSchema.index(
  {
    course: 1,
    lecturer: 1,
    academicSession: 1,
    semester: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "CourseAssignment",
  courseAssignmentSchema
);