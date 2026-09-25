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

    role: {
      type: String,
      enum: ["lecturer", "hod"],
      default: "lecturer",
    },

    // Account activation
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

    verificationStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "review",
        "verified",
        "rejected",
      ],
      default: "pending",
    },

    // Veriff verification/session ID
    verificationId: {
      type: String,
      default: null,
    },

    // Veriff's latest decision/status
    verificationResult: {
      type: String,
      default: null,
    },

    // Admin who approved/rejected the verification
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verificationRejectedReason: {
      type: String,
      default: null,
      trim: true,
    },

    // =====================================================
    // ACCOUNT ACCESS
    // =====================================================

    isActive: {
      type: Boolean,
      default: false,
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