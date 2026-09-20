const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    faculty: {
      type: String,
      required: true,
      trim: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    hod: {
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

departmentSchema.index(
  {
    name: 1,
    institution: 1,
  },
  {
    unique: true,
  }
);

departmentSchema.index(
  {
    code: 1,
    institution: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Department", departmentSchema);