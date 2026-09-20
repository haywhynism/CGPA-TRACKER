

const Student = require("../models/Student");
const Department = require("../models/Department");
const Institution = require("../models/Institution");

// Create a student
const createStudent = async (req, res) => {
    try {
        const {
            matricNumber,
            name,
            email,
            departmentId,
            institutionId,
            level,
            academicSession,
        } = req.body;

        // Check required fields
        if (
            !matricNumber ||
            !name ||
            !email ||
            !departmentId ||
            !institutionId ||
            !level ||
            !academicSession
        ) {
            return res.status(400).json({
                message:
                    "Please provide matric number, name, department, institution, level and academic session",
            });
        }

        // Check institution
        const institution = await Institution.findById(institutionId);

        if (!institution) {
            return res.status(404).json({
                message: "Institution not found",
            });
        }

        // Check department
        const department = await Department.findById(departmentId);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        // Make sure department belongs to institution
        if (department.institution.toString() !== institutionId) {
            return res.status(400).json({
                message:
                    "This department does not belong to the selected institution",
            });
        }

        // Check if matric number already exists
        const existingStudent = await Student.findOne({
            matricNumber: matricNumber.toUpperCase(),
        });

        if (existingStudent) {
            return res.status(400).json({
                message: "A student with this matric number already exists",
            });
        }

      
        // Create student
        const student = await Student.create({
            matricNumber: matricNumber.toUpperCase(),
            name,
            email: email.toLowerCase(),
            department: departmentId,
            institution: institutionId,
            level,
            academicSession,
            
        });

        res.status(201).json({
            message: "Student created successfully",
            student,
        });
    } catch (error) {
        console.error("Create student error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};


// Get all students
const getStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .populate("department", "name code faculty")
            .populate("institution", "name code type gradingScale");

        res.status(200).json({
            count: students.length,
            students,
        });
    } catch (error) {
        console.error("Get students error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};


// Get one student
const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate("department", "name code faculty")
            .populate("institution", "name code type gradingScale");

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        res.status(200).json({
            student,
        });
    } catch (error) {
        console.error("Get student error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};


module.exports = {
    createStudent,
    getStudents,
    getStudentById,
};