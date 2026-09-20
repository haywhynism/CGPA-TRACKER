const mongoose = require("mongoose");

const gradingRuleSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    minScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    maxScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    gradePoint: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["university", "polytechnic"],
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    gradingScale: {
      type: Number,
      required: true,
      enum: [4, 5],
    },

    gradingRules: {
      type: [gradingRuleSchema],
      required: true,
      validate: {
        validator: function (rules) {
          return rules.length > 0;
        },
        message: "At least one grading rule is required",
      },
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

module.exports = mongoose.model("Institution", institutionSchema);