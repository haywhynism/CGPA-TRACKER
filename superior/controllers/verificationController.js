const axios = require("axios");
const crypto = require("crypto");

const Lecturer = require("../models/Lecturer");
const User = require("../models/User");

const VERIFF_BASE_URL =
    process.env.VERIFF_BASE_URL || "https://api.veriff.com";



const startVerification = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (!["lecturer", "hod"].includes(user.role)) {
            return res.status(403).json({
                message:
                    "Only lecturers and HODs can complete staff verification",
            });
        }

        const lecturer = await Lecturer.findOne({
            user: user._id,
        });

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
            });
        }

        if (lecturer.verificationStatus === "verified") {
            return res.status(400).json({
                message: "Your identity has already been verified",
            });
        }


        if (
            lecturer.verificationStatus === "processing"
        ) {
            return res.status(200).json({
                message: "A verification is already in progress",
                verification: {
                    id: lecturer.verificationId,
                    url: lecturer.verificationUrl,
                },
            });
        }

        if (
            lecturer.verificationStatus === "review"
        ) {
            return res.status(200).json({
                message: "Your verification is awaiting admin review",
                verification: {
                    id: lecturer.verificationId,
                },
            });
        }


        const verificationReference = crypto.randomUUID();
        console.log("Veriff API key exists:", !!process.env.VERIFF_API_KEY);
        console.log(
            "Veriff API key length:",
            process.env.VERIFF_API_KEY?.length
        );
        console.log(
            "Veriff API key format:",
            process.env.VERIFF_API_KEY
                ? "value loaded"
                : "MISSING"
        );

        const apiKey = process.env.VERIFF_API_KEY;

        console.log("API key length:", apiKey?.length);
        console.log(
            "API key UUID format:",
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(apiKey || "")
        );
        const response = await axios.post(
            `${VERIFF_BASE_URL}/v1/sessions`,
            {
                verification: {
                    callback: `${process.env.APP_URL}/api/verification/webhook`,

                    person: {
                        firstName: lecturer.name.trim(),
                    },

                    vendorData: lecturer._id.toString(),

                    timestamp: new Date().toISOString(),

                    endUserId: verificationReference,
                },
            },
            {
                headers: {
                    "X-AUTH-CLIENT": process.env.VERIFF_API_KEY,
                    "Content-Type": "application/json",
                },
            }
        );

        const verification =
            response.data.verification;

        lecturer.verificationId =
            verification.id;
        lecturer.verificationUrl = verification.url;

        lecturer.verificationStatus =
            "processing";

        lecturer.verificationResult = null;

        lecturer.verificationRejectedReason =
            null;

        await lecturer.save();

        return res.status(201).json({
            message:
                "Identity verification session created successfully",

            verification: {
                id: verification.id,
                url: verification.url,
            },
        });
    } catch (error) {
        console.error(
            "Start verification error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            message:
                "Unable to start identity verification",
        });
    }
};


const getVerificationStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const lecturer = await Lecturer.findOne({
            user: userId,
        })
            .populate(
                "verifiedBy",
                "name email role staffId"
            )
            .populate(
                "department",
                "name code faculty"
            )
            .populate(
                "institution",
                "name code type gradingScale"
            );

        if (!lecturer) {
            return res.status(404).json({
                message: "Lecturer profile not found",
            });
        }

        return res.status(200).json({
            verification: {
                status:
                    lecturer.verificationStatus,

                result:
                    lecturer.verificationResult,

                verificationId:
                    lecturer.verificationId,

                verifiedAt:
                    lecturer.verifiedAt,

                verifiedBy:
                    lecturer.verifiedBy,

                rejectionReason:
                    lecturer.verificationRejectedReason,
            },
        });
    } catch (error) {
        console.error(
            "Get verification status error:",
            error
        );

        return res.status(500).json({
            message: "Server error",
        });
    }
};








const veriffWebhook = async (req, res) => {
    
    try {
        const signature =
            req.headers["x-hmac-signature"];

               console.log("VERIFF WEBHOOK HEADERS:");
        console.log(req.headers);

        console.log("VERIFF WEBHOOK BODY:");
        console.log(req.body);

        if (!signature) {
            return res.status(401).json({
                message: "Missing webhook signature",
            });
        }

        const rawBody =
            JSON.stringify(req.body);

        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.VERIFF_SHARED_SECRET
                )
                .update(rawBody)
                .digest("hex");

        if (
            signature !== expectedSignature
        ) {
            return res.status(401).json({
                message: "Invalid webhook signature",
            });
        }

        const verification =
            req.body.verification;

        if (!verification) {
            return res.status(400).json({
                message:
                    "Invalid verification webhook",
            });
        }

        const verificationId =
            verification.id;

        const status =
            verification.status;

        const code =
            verification.code;

        const reason =
            verification.reason || null;

        const lecturer =
            await Lecturer.findOne({
                verificationId,
            });

        if (!lecturer) {
            console.error(
                "No lecturer found for Veriff verification:",
                verificationId
            );

            return res.status(404).json({
                message:
                    "Verification record not found",
            });
        }

        lecturer.verificationResult =
            code || status || null;


        if (
            status === "approved" ||
            code === "approved"
        ) {
            lecturer.verificationStatus =
                "review";
        }

        else if (
            status === "declined" ||
            code === "declined"
        ) {
            lecturer.verificationStatus =
                "rejected";

            lecturer.verificationRejectedReason =
                reason;
        }

        else {
            lecturer.verificationStatus =
                "processing";
        }

        await lecturer.save();

        return res.status(200).json({
            message: "Webhook received",
        });
    } catch (error) {
        console.error(
            "Veriff webhook error:",
            error
        );

        return res.status(500).json({
            message: "Webhook processing failed",
        });
    }
};

// Get staff verification records waiting for admin review
const getPendingVerifications = async (req, res) => {
    try {
        const lecturers = await Lecturer.find({
            verificationStatus: "review",
        })
            .populate("user", "name email role staffId isActive")
            .populate("department", "name code faculty")
            .populate("institution", "name code type")
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            count: lecturers.length,
            lecturers,
        });
    } catch (error) {
        console.error("Get pending verifications error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// Admin approves staff verification
const approveVerification = async (req, res) => {
    try {
        const { id } = req.params;

        const lecturer = await Lecturer.findById(id);

        if (!lecturer) {
            return res.status(404).json({
                message: "Staff verification record not found",
            });
        }

        if (lecturer.verificationStatus !== "review") {
            return res.status(400).json({
                message:
                    "Only verification records under review can be approved",
            });
        }

        if (!lecturer.user) {
            return res.status(400).json({
                message: "Staff user account not found",
            });
        }

        // Mark verification as approved
        lecturer.verificationStatus = "verified";
        lecturer.verifiedBy = req.user._id;
        lecturer.verifiedAt = new Date();
        lecturer.verificationRejectedReason = null;

        // Activate lecturer/HOD profile
        lecturer.isActive = true;

        await lecturer.save();

        // Activate login account
        const user = await User.findByIdAndUpdate(
            lecturer.user,
            {
                isActive: true,
            },
            { new: true }
        ).select(
            "name staffId email role department isActive"
        );

        if (!user) {
            return res.status(404).json({
                message: "User account not found",
            });
        }

        return res.status(200).json({
            message: "Staff verification approved successfully",
            lecturer: {
                id: lecturer._id,
                name: lecturer.name,
                staffId: lecturer.staffId,
                role: lecturer.role,
                verificationStatus:
                    lecturer.verificationStatus,
                verifiedBy: lecturer.verifiedBy,
                verifiedAt: lecturer.verifiedAt,
                isActive: lecturer.isActive,
            },
            user,
        });
    } catch (error) {
        console.error("Approve verification error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// Admin rejects staff verification
const rejectVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                message: "Please provide a rejection reason",
            });
        }

        const lecturer = await Lecturer.findById(id);

        if (!lecturer) {
            return res.status(404).json({
                message: "Staff verification record not found",
            });
        }

        if (lecturer.verificationStatus !== "review") {
            return res.status(400).json({
                message:
                    "Only verification records under review can be rejected",
            });
        }

        lecturer.verificationStatus = "rejected";
        lecturer.verificationRejectedReason =
            reason.trim();

        lecturer.verifiedBy = req.user._id;
        lecturer.verifiedAt = new Date();

        lecturer.isActive = false;

        await lecturer.save();

        // Make sure login remains disabled
        if (lecturer.user) {
            await User.findByIdAndUpdate(
                lecturer.user,
                {
                    isActive: false,
                }
            );
        }

        return res.status(200).json({
            message: "Staff verification rejected",
            lecturer: {
                id: lecturer._id,
                name: lecturer.name,
                staffId: lecturer.staffId,
                role: lecturer.role,
                verificationStatus:
                    lecturer.verificationStatus,
                rejectionReason:
                    lecturer.verificationRejectedReason,
                rejectedBy: lecturer.verifiedBy,
                rejectedAt: lecturer.verifiedAt,
                isActive: lecturer.isActive,
            },
        });
    } catch (error) {
        console.error("Reject verification error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


module.exports = {
    startVerification,
    getVerificationStatus,
    veriffWebhook,
    getPendingVerifications,
    approveVerification,
    rejectVerification,
};