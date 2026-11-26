
const mongoose = require("mongoose");

const User = require("../models/user");
const Lead = require("../models/lead");

// Get all-time company dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const companyId = new mongoose.Types.ObjectId(
      req.user.companyId
    );

    const now = new Date();

    // All dashboard statistics are restricted to this company
    const [
      totalSalesExecutives,
      totalLeads,
      assignedLeads,
      qualifiedLeads,
      convertedLeads,
      notQualifiedLeads,
      notConnectedLeads,
      unassignedLeads,
      executives,
      executiveLeadStats,
      recentActivities,
      upcomingFollowUps,
    ] = await Promise.all([

      User.countDocuments({
        companyId,
        role: "sales",
        status: "active",
      }),

      Lead.countDocuments({ companyId }),

      Lead.countDocuments({
        companyId,
        assignedTo: { $ne: null },
      }),

      Lead.countDocuments({
        companyId,
        status: "qualified",
      }),

      Lead.countDocuments({
        companyId,
        status: "converted",
      }),

      Lead.countDocuments({
        companyId,
        status: "not_qualified",
      }),

      Lead.countDocuments({
        companyId,
        status: "not_connected",
      }),

      Lead.countDocuments({
        companyId,
        $or: [
          { assignedTo: null },
          { assignedTo: { $exists: false } },
        ],
      }),

      User.find({
        companyId,
        role: "sales",
        status: "active",
      })
        .select("_id name email employeeId")
        .sort({ name: 1 })
        .lean(),

      // Executive-wise all-time lead statistics
      Lead.aggregate([
        {
          $match: {
            companyId,
            assignedTo: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$assignedTo",
            assignedCount: { $sum: 1 },
            qualifiedCount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "qualified"] },
                  1,
                  0,
                ],
              },
            },
            convertedCount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "converted"] },
                  1,
                  0,
                ],
              },
            },
            notQualifiedCount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "not_qualified"] },
                  1,
                  0,
                ],
              },
            },
            notConnectedCount: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "not_connected"] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Latest 8 lead activities across this company
      Lead.aggregate([
        { $match: { companyId } },
        { $unwind: "$activityHistory" },
        {
          $sort: {
            "activityHistory.updatedAt": -1,
          },
        },
        { $limit: 8 },
        {
          $lookup: {
            from: "users",
            localField: "activityHistory.updatedBy",
            foreignField: "_id",
            as: "updatedByUser",
          },
        },
        {
          $unwind: {
            path: "$updatedByUser",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            leadId: "$_id",
            leadName: "$leadData.full_name",
            status: "$activityHistory.status",
            remarks: "$activityHistory.remarks",
            updatedAt: "$activityHistory.updatedAt",
            employeeName: "$updatedByUser.name",
          },
        },
      ]),

      // Upcoming follow-ups across this company
      Lead.find({
        companyId,
        nextFollowUpDate: { $gte: now },
        status: { $nin: ["converted"] },
      })
        .select(
          "leadData.full_name status nextFollowUpDate assignedTo"
        )
        .populate("assignedTo", "name employeeId")
        .sort({ nextFollowUpDate: 1 })
        .limit(8)
        .lean(),
    ]);

    // Combine executive records with their lead statistics
    const executiveStatsMap = new Map(
      executiveLeadStats.map((item) => [
        String(item._id),
        item,
      ])
    );

    const executivePerformance = executives.map((executive) => {
      const stats = executiveStatsMap.get(
        String(executive._id)
      ) || {};

      return {
        id: executive._id,
        name: executive.name,
        email: executive.email,
        employeeId: executive.employeeId,
        assignedCount: stats.assignedCount || 0,
        qualifiedCount: stats.qualifiedCount || 0,
        convertedCount: stats.convertedCount || 0,
        notQualifiedCount: stats.notQualifiedCount || 0,
        notConnectedCount: stats.notConnectedCount || 0,
      };
    });

    return res.status(200).json({
      success: true,

      summary: {
        totalSalesExecutives,
        totalLeads,
        assignedLeads,
        qualifiedLeads,
        convertedLeads,
        notQualifiedLeads,
        notConnectedLeads,
        unassignedLeads,
      },

      executivePerformance,
      recentActivities,
      upcomingFollowUps,
    });

  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics.",
    });
  }
};

module.exports = {
  getDashboardStats,
};
