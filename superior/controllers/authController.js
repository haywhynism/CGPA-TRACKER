const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



const Student = require("../models/Student");
const User = require("../models/User")
const Lecturer = require("../models/Lecturer");
const { sendActivationEmail } = require("../config/email");

// Request account activation
const requestActivation = async (req, res) => {
    try {
        const { matricNumber, email } = req.body;

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

// Login user
const login = async (req, res) => {
    try {
        const {
            matricNumber,
            staffId,
            email,
            password,
        } = req.body;

        if (!password) {
            return res.status(400).json({
                message: "Please provide password",
            });
        }

        if (matricNumber) {
            const normalizedMatricNumber =
                matricNumber.toUpperCase().trim();

            const user = await User.findOne({
                matricNumber: normalizedMatricNumber,
                role: "student",
            });

            if (!user) {
                return res.status(401).json({
                    message: "Invalid login credentials",
                });
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return res.status(401).json({
                    message: "Invalid login credentials",
                });
            }

            if (!user.isActive) {
                return res.status(403).json({
                    message: "Your account is inactive",
                });
            }

            const token = jwt.sign(
                {
                    userId: user._id,
                    role: user.role,
                    matricNumber: user.matricNumber,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h",
                }
            );

            return res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    matricNumber: user.matricNumber,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                },
            });
        }

        if (staffId) {
            const normalizedStaffId =
                staffId.toUpperCase().trim();

            const user = await User.findOne({
                staffId: normalizedStaffId,
                role: {
                    $in: ["lecturer", "hod"],
                },
            });

            if (!user) {
                return res.status(401).json({
                    message: "Invalid login credentials",
                });
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return res.status(401).json({
                    message: "Invalid login credentials",
                });
            }

            if (!user.isActive) {
                return res.status(403).json({
                    message: "Your account is inactive",
                });
            }

            const token = jwt.sign(
                {
                    userId: user._id,
                    role: user.role,
                    staffId: user.staffId,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h",
                }
            );

            return res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    staffId: user.staffId,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                },
            });
        }

        if (email) {
            const normalizedEmail =
                email.toLowerCase().trim();

            const user = await User.findOne({
                email: normalizedEmail,
                role: "admin",
            });

            if (!user) {
                return res.status(401).json({
                    message: "Invalid login credentials",
                });
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return res.status(401).json({
                    message: "Invalid login credentials",
                });
            }

            if (!user.isActive) {
                return res.status(403).json({
                    message: "Your account is inactive",
                });
            }

            const token = jwt.sign(
                {
                    userId: user._id,
                    role: user.role,
                    email: user.email,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "24h",
                }
            );

            return res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                },
            });
        }

        return res.status(400).json({
            message:
                "Please provide matric number, staff ID, or email with password",
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};

// Get currently logged-in user
const getMe = async (req, res) => {
    try {
        res.status(200).json({
            message: "Authentication successful",
            user: req.user,
        });
    } catch (error) {
        console.error("Get current user error:", error);

        res.status(500).json({
            message: "Server error",
        });
    }
};

// Create the first admin account
const setupAdmin = async (req, res) => {
    try {
        // Check if an admin already exists
        const existingAdmin = await User.findOne({
            role: "admin",
        });

        if (existingAdmin) {
            return res.status(403).json({
                message: "Admin account already exists",
            });
        }

        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check whether email is already being used
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(400).json({
                message: "A user with this email already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin
        const admin = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "admin",
            department: null,
            isActive: true,
        });

        return res.status(201).json({
            message: "Admin account created successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error("Setup admin error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

// Request lecturer account activation
const requestLecturerActivation = async (req, res) => {
    try {
        const { staffId, email } = req.body;

        if (!staffId || !email) {
            return res.status(400).json({
                message: "Please provide staff ID and email",
            });
        }

        const normalizedStaffId = staffId.toUpperCase().trim();
        const normalizedEmail = email.toLowerCase().trim();

        // Find lecturer using BOTH staff ID and registered email
        const lecturer = await Lecturer.findOne({
            staffId: normalizedStaffId,
            email: normalizedEmail,
        });

        // Do not reveal whether the lecturer exists
        if (!lecturer) {
            return res.status(200).json({
                message:
                    "If the details are valid, an activation code has been sent to the registered email.",
            });
        }

        // Don't allow activation if already activated
        if (lecturer.accountActivated) {
            return res.status(400).json({
                message: "Lecturer account has already been activated",
            });
        }

        // Generate activation code
        const activationCode = crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

        // Expire after 20 minutes
        const activationCodeExpires = new Date(
            Date.now() + 20 * 60 * 1000
        );

        lecturer.activationCode = activationCode;
        lecturer.activationCodeExpires =
            activationCodeExpires;

        await lecturer.save();

        // Send email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"CGPA Tracker" <${process.env.EMAIL_USER}>`,
            to: lecturer.email,
            subject: "Lecturer Account Activation",
            text: `Hello ${lecturer.name},

                Your lecturer account activation code is:

                ${activationCode}

                This code will expire in 20 minutes.

                If you did not request this activation, please ignore this email.

                CGPA Tracker`,
        });

        return res.status(200).json({
            message:
                "If the details are valid, an activation code has been sent to the registered email.",
        });
    } catch (error) {
        console.error(
            "Request lecturer activation error:",
            error
        );

        return res.status(500).json({
            message: "Server error",
        });
    }
};

const activateLecturerAccount = async (req, res) => {
    try {
        const { staffId, activationCode, password } = req.body;

        if (!staffId || !activationCode || !password) {
            return res.status(400).json({
                message: "Please provide staff ID, activation code and password",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        const normalizedStaffId = staffId.toUpperCase().trim();
        const normalizedActivationCode =
            activationCode.toUpperCase().trim();

        // Find lecturer
        const lecturer = await Lecturer.findOne({
            staffId: normalizedStaffId,
        });

        // Don't reveal whether the staff ID exists
        if (!lecturer) {
            return res.status(400).json({
                message: "Invalid activation details",
            });
        }

        // Check if already activated
        if (lecturer.accountActivated) {
            return res.status(400).json({
                message: "Lecturer account has already been activated",
            });
        }

        // Check activation code
        if (
            !lecturer.activationCode ||
            lecturer.activationCode !== normalizedActivationCode
        ) {
            return res.status(400).json({
                message: "Invalid activation details",
            });
        }

        // Check expiration
        if (
            !lecturer.activationCodeExpires ||
            lecturer.activationCodeExpires < new Date()
        ) {
            return res.status(400).json({
                message: "Activation code has expired",
            });
        }

        // Check whether a User already exists
        const existingUser = await User.findOne({
            $or: [
                { staffId: normalizedStaffId },
                { email: lecturer.email.toLowerCase().trim() },
            ],
        });

        if (existingUser) {
            return res.status(400).json({
                message: "An account already exists for this lecturer",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create User account
        const user = await User.create({
            name: lecturer.name.trim(),
            staffId: normalizedStaffId,
            email: lecturer.email.toLowerCase().trim(),
            password: hashedPassword,
            role: lecturer.role,
            department: lecturer.department,
            isActive: false,
        });

        // Activate lecturer record
        lecturer.accountActivated = true;
        lecturer.activationCode = null;
        lecturer.activationCodeExpires = null;
        lecturer.user = user._id;

        await lecturer.save();

        return res.status(200).json({
            message:
                `${lecturer.role === "hod" ? "HOD" : "Lecturer"} account activated successfully`,
            user: {
                id: user._id,
                name: user.name,
                staffId: user.staffId,
                email: user.email,
                role: user.role,
                department: user.department,
            },
        });
    } catch (error) {
        console.error("Activate lecturer account error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};

module.exports = {
    requestActivation,
    activateStudentAccount,
    requestLecturerActivation,
    activateLecturerAccount,
    login,
    getMe,
    setupAdmin,

};