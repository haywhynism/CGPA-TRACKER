const crypto = require("crypto");
const bcrypt = require("bcryptjs");


const Student = require("../models/Student");
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

module.exports = {
    requestActivation,
};