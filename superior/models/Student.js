const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    matricNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

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

    level: {
      type: Number,
      required: true,
      enum: [100, 200, 300, 400, 500, 600],
    },

    academicSession: {
      type: String,
      required: true,
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

module.exports = mongoose.model("Student", studentSchema);