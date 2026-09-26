const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        matricNumber: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true,
        },

        staffId: {
            type: String,
            unique: true,
            sparse: true,
            uppercase: true,
            trim: true,
        },

        email: {
            type: String,
            required: function () {
                return ["student", "lecturer", "hod"].includes(
                    this.role
                );
            },
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        role: {
            type: String,
            required: true,
            enum: [
                "admin",
                "hod",
                "lecturer",
                "student",
            ],
            default: "student",
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null,
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        // Controls dashboard/login access
        isActive: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "User",
    userSchema
);