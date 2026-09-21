const Lecturer = require("../models/Lecturer");
const Department = require("../models/Department");
const Institution = require("../models/Institution");

// Create lecturer
const createLecturer = async (req, res) => {
    try {
        const {
            name,
            email,
            staffId,
            departmentId,
            institutionId,
            role,
        } = req.body;

        // Validate required fields
        if (
            !name ||
            !email ||
            !staffId ||
            !departmentId ||
            !institutionId ||
            !role
        ) {
            return res.status(400).json({
                message:
                    "Please provide lecturer name, email, staff ID, department and institution",
            });
        }

        const accountRole = role || "lecturer";

        if (!["lecturer", "hod"].includes(accountRole)) {
            return res.status(400).json({
                message: "Role must be either lecturer or hod",
            });
        }


        const normalizedEmail = email.toLowerCase().trim();
        const normalizedStaffId = staffId.toUpperCase().trim();

        // Check institution
        const institution = await Institution.findById(
            institutionId
        );

        if (!institution) {
            return res.status(404).json({
                message: "Institution not found",
            });
        }

        // Check department
        const department = await Department.findById(
            departmentId
        );

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        // Make sure department belongs to institution
        if (
            department.institution.toString() !==
            institutionId.toString()
        ) {
            return res.status(400).json({
                message:
                    "Department does not belong to this institution",
            });
        }

        // Check duplicate email
        const existingEmail = await Lecturer.findOne({
            email: normalizedEmail,
        });

        if (existingEmail) {
            return res.status(400).json({
                message: "A lecturer with this email already exists",
            });
        }

        // Check duplicate staff ID
        const existingStaffId = await Lecturer.findOne({
            staffId: normalizedStaffId,
        });

        if (existingStaffId) {
            return res.status(400).json({
                message: "A lecturer with this staff ID already exists",
            });
        }

        // Create lecturer
        const lecturer = await Lecturer.create({
            name: name.trim(),
            email: normalizedEmail,
            staffId: normalizedStaffId,
            role: accountRole,
            department: departmentId,
            institution: institutionId,
        });

        // Populate response
        const populatedLecturer =
            await Lecturer.findById(lecturer._id)
                .populate(
                    "department",
                    "name code faculty"
                )
                .populate(
                    "institution",
                    "name code type gradingScale"
                );

        return res.status(201).json({
            message: "Account created successfully",
            role: accountRole,
            lecturer: populatedLecturer,
        });
    } catch (error) {
        console.error("Create lecturer error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                message:
                    "A lecturer with this email or staff ID already exists",
            });
        }

        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};


// Get all lecturers
const getLecturers = async (req, res) => {
    try {
        const lecturers = await Lecturer.find()
            .populate(
                "department",
                "name code faculty"
            )
            .populate(
                "institution",
                "name code type gradingScale"
            )
            .populate(
                "user",
                "name email role isActive"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: lecturers.length,
            lecturers,
        });
    } catch (error) {
        console.error("Get lecturers error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};


// Get one lecturer
const getLecturerById = async (req, res) => {
    try {
        const lecturer = await Lecturer.findById(
            req.params.id
        )
            .populate(
                "department",
                "name code faculty"
            )
            .populate(
                "institution",
                "name code type gradingScale"
            )
            .populate(
                "user",
                "name email role isActive"
            );

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer not found",
            });
        }

        return res.status(200).json({
            lecturer,
        });
    } catch (error) {
        console.error("Get lecturer error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};




module.exports = {
    createLecturer,
    getLecturers,
    getLecturerById,
};