
const mongoose = require("mongoose");

const SalesTarget = require("../models/SalesTarget");
const User = require("../models/user");
const Lead = require("../models/Lead");

// Validate and convert YYYY-MM into month start/end dates
const getMonthRange = (month) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) {
    return null;
  }

  const [year, monthNumber] = month.split("-").map(Number);

  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));

  return { start, end };
};

// Get monthly sales performance and targets
const getMonthlyPerformance = async (req, res) => {
  try {
    const { month } = req.query;
    const monthRange = getMonthRange(month);

    if (!monthRange) {
      return res.status(400).json({
        success: false,
        message: "Please provide month in YYYY-MM format.",
      });
    }

    const { start, end } = monthRange;
    const companyId = req.user.companyId;

    // Only active Sales Executives of this company
    const executives = await User.find({
      companyId,
      role: "sales",
      status: "active",
    })
      .select("_id name email employeeId")
      .sort({ name: 1 })
      .lean();

    const executivePerformance = await Promise.all(
      executives.map(async (executive) => {
        const [target, qualifiedCount, convertedCount, assignedCount] =
          await Promise.all([
            SalesTarget.findOne({
              companyId,
              employeeId: executive._id,
              monthStart: start,
            }).lean(),

            Lead.countDocuments({
              companyId,
              assignedTo: executive._id,
              status: "qualified",
            }),

            Lead.countDocuments({
              companyId,
              assignedTo: executive._id,
              status: "converted",
              convertedAt: {
                $gte: start,
                $lt: end,
              },
            }),

            Lead.countDocuments({
              companyId,
              assignedTo: executive._id,
              assignedAt: {
                $gte: start,
                $lt: end,
              },
            }),
          ]);

        const targetCount = target?.targetCount || 0;

        const achievementPercentage =
          targetCount > 0
            ? Number(
                ((convertedCount / targetCount) * 100).toFixed(2)
              )
            : 0;

        return {
          executive: {
            id: executive._id,
            name: executive.name,
            email: executive.email,
            employeeId: executive.employeeId,
          },
          targetCount,
          qualifiedCount,
          convertedCount,
          assignedCount,
          achievementPercentage,
        };
      })
    );

    const totalQualified = executivePerformance.reduce(
      (total, item) => total + item.qualifiedCount,
      0
    );

    const totalConverted = executivePerformance.reduce(
      (total, item) => total + item.convertedCount,
      0
    );

    const totalAssigned = executivePerformance.reduce(
      (total, item) => total + item.assignedCount,
      0
    );

    const totalTarget = executivePerformance.reduce(
      (total, item) => total + item.targetCount,
      0
    );

    return res.status(200).json({
      success: true,
      month,
      summary: {
        totalSalesExecutives: executives.length,
        totalAssignedLeads: totalAssigned,
        totalQualifiedLeads: totalQualified,
        totalConvertedLeads: totalConverted,
        totalConversionTarget: totalTarget,
        overallAchievementPercentage:
          totalTarget > 0
            ? Number(((totalConverted / totalTarget) * 100).toFixed(2))
            : 0,
      },
      executives: executivePerformance,
    });
  } catch (error) {
    console.error("Get Monthly Performance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch monthly sales performance.",
    });
  }
};

// Create or update one executive's monthly conversion target
const setMonthlyTarget = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, targetCount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Sales Executive ID.",
      });
    }

    const monthRange = getMonthRange(month);

    if (!monthRange) {
      return res.status(400).json({
        success: false,
        message: "Please provide month in YYYY-MM format.",
      });
    }

    if (
      targetCount === undefined ||
      !Number.isInteger(Number(targetCount)) ||
      Number(targetCount) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Target must be a whole number greater than or equal to zero.",
      });
    }

    const companyId = req.user.companyId;

    // Verify executive belongs to the manager's own company
    const executive = await User.findOne({
      _id: employeeId,
      companyId,
      role: "sales",
      status: "active",
    });

    if (!executive) {
      return res.status(404).json({
        success: false,
        message: "Active Sales Executive not found in your company.",
      });
    }

    const target = await SalesTarget.findOneAndUpdate(
      {
        companyId,
        employeeId,
        monthStart: monthRange.start,
      },
      {
        $set: {
          targetCount: Number(targetCount),
        },
        $setOnInsert: {
          companyId,
          employeeId,
          monthStart: monthRange.start,
          createdBy: req.user.userId,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Monthly conversion target saved successfully.",
      target: {
        employeeId: target.employeeId,
        month: month,
        targetCount: target.targetCount,
      },
    });
  } catch (error) {
    console.error("Set Monthly Target Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save monthly conversion target.",
    });
  }
};

module.exports = {
  getMonthlyPerformance,
  setMonthlyTarget,
};
