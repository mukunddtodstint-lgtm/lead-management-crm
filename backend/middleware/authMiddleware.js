
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Company = require("../models/company");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch current user details from database
    const user = await User.findById(decoded.userId).select(
      "_id companyId role status"
    );

    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is inactive or no longer exists.",
      });
    }

    // Verify company access for all company users
    if (user.role !== "super_admin") {
      if (!user.companyId) {
        return res.status(403).json({
          success: false,
          message: "User is not associated with a company.",
        });
      }

      const company = await Company.findOne({
        _id: user.companyId,
        status: "active",
      });

      if (!company) {
        return res.status(403).json({
          success: false,
          message: "Your company is inactive. Access denied.",
        });
      }
    }

    // Attach verified database information
    req.user = {
      userId: user._id,
      companyId: user.companyId || null,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

// Role-based access control
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
