const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        courseUnit: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
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

        semester: {
            type: String,
            required: true,
            enum: ["first", "second"],
        },

        academicSession: {
            type: String,
            required: true,
            trim: true,
        },

        courseType: {
            type: String,
            required: true,
            enum: ["compulsory", "elective"],
            default: "compulsory",
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

courseSchema.index(
    {
        code: 1,
        department: 1,
        level: 1,
        semester: 1,
        academicSession: 1
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model("Course", courseSchema);