const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token
const protect = async (req, res, next) => {
    try {
        let token;

        // Check Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // No token
        if (!token) {
            return res.status(401).json({
                message: "Not authorized. Please log in.",
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User account no longer exists.",
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account is inactive.",
            });
        }

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(401).json({
            message: "Invalid or expired authentication token.",
        });
    }
};


// Check user role
const authorize = (...roles) => {
    return (req, res, next) => {

        // console.log("AUTHORIZE DEBUG");
        // console.log("User:", req.user);
        // console.log("Required roles:", roles);
        // console.log("User role:", req.user?.role);
        if (!req.user) {
            return res.status(401).json({
                message: "Not authorized.",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action.",
            });
        }

        next();
    };
};


module.exports = {
    protect,
    authorize,
};