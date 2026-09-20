// const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");


const Student = require("../models/Student");
const User = require("../models/User")
const { sendActivationEmail } = require("../config/email");

// Request account activation
const requestActivation = async (req, res) => {
    try {
        const { matricNumber, email } = req.body;

        // Generic response for security
        const genericMessage =
            "If the information matches an eligible student record, an activation code has been sent to the registered email.";

        // Validate input
        if (!matricNumber || !email) {
            return res.status(200).json({
                message: genericMessage,
            });
        }

        // Find student using matric number and email
        const student = await Student.findOne({
            matricNumber: matricNumber.toUpperCase().trim(),
            email: email.toLowerCase().trim(),
        });

        // Do not reveal whether the student exists
        if (!student) {
            return res.status(200).json({
                message: genericMessage,
            });
        }

        // Do not allow activation if account is already activated
        if (student.accountActivated) {
            return res.status(200).json({
                message: genericMessage,
            });
        }

        // Generate a secure 8-character activation code
        const activationCode = crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

        // Hash the activation code before storing it
        const hashedCode = await bcrypt.hash(activationCode, 10);

        // Code expires in 15 minutes
        const expirationTime = new Date(Date.now() + 15 * 60 * 1000);

        // Save hashed code and expiration
        student.activationCode = hashedCode;
        student.activationCodeExpires = expirationTime;

        await student.save();


        await sendActivationEmail(
            student.email,
            student.name,
            activationCode
        );

        return res.status(200).json({
            message: genericMessage,

        });
    } catch (error) {
        console.error("Request activation error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};

// Activate student account
const activateStudentAccount = async (req, res) => {
    try {
        const {
            matricNumber,
            activationCode,
            password,
            confirmPassword,
        } = req.body;

        // Basic validation
        if (
            !matricNumber ||
            !activationCode ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                message:
                    "Please provide matric number, activation code, password and confirm password",
            });
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match",
            });
        }

        // Check minimum password length
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        // Find student
        const student = await Student.findOne({
            matricNumber: matricNumber.toUpperCase().trim(),
        });

        // Don't reveal whether the student exists
        if (!student) {
            return res.status(400).json({
                message: "Invalid activation details",
            });
        }

        // Check if already activated
        if (student.accountActivated) {
            return res.status(400).json({
                message: "Invalid activation details",
            });
        }

        // Check if activation code exists
        if (!student.activationCode) {
            return res.status(400).json({
                message: "Invalid or expired activation code",
            });
        }

        // Check expiration
        if (
            !student.activationCodeExpires ||
            student.activationCodeExpires < new Date()
        ) {
            return res.status(400).json({
                message: "Invalid or expired activation code",
            });
        }

        // Compare entered code with hashed code
        const isCodeValid = await bcrypt.compare(
            activationCode.toUpperCase().trim(),
            student.activationCode
        );

        if (!isCodeValid) {
            return res.status(400).json({
                message: "Invalid or expired activation code",
            });
        }

        // Check if a user already exists for this student
        const existingUser = await User.findOne({
            $or: [
                { matricNumber: student.matricNumber },
                { email: student.email },
            ],
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Unable to activate this account",
            });
        }

        // Hash student password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create User account
        const user = await User.create({
            name: student.name,
            matricNumber: student.matricNumber,
            email: student.email,
            password: hashedPassword,
            role: "student",
            department: student.department,
            student: student._id,
        });

        // Activate student account
        student.accountActivated = true;
        student.user = user._id;

        // Remove activation code after successful activation
        student.activationCode = null;
        student.activationCodeExpires = null;

        await student.save();

        return res.status(201).json({
            message: "Student account activated successfully",
            user: {
                id: user._id,
                name: user.name,
                matricNumber: user.matricNumber,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Activate student account error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};

module.exports = {
    requestActivation,
    activateStudentAccount,
};