const mongoose = require("mongoose");

const lecturerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    staffId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    accountActivated: {
      type: Boolean,
      default: false,
    },

    activationCode: {
      type: String,
      default: null,
    },

    activationCodeExpires: {
      type: Date,
      default: null,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

// Prevent duplicate staff ID
lecturerSchema.index(
  { staffId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "Lecturer",
  lecturerSchema
);