import { Request, Response } from "express";
import { OrderMaterialHistoryModel } from "../../models/Stage Models/Ordering Material Model/OrderMaterialHistory.model";
import ProjectModel from "../../models/project model/project.model";
import MaterialArrivalModel from "../../models/Stage Models/MaterialArrivalCheck Model/materialArrivalCheckNew.model";
import mongoose from "mongoose";
import { PaymentMainAccountModel } from "../../models/Department Models/Accounting Model/paymentMainAcc.model";
// import { ProjectModel } from "../models/ProjectModel"; // Adjust paths as needed
// import { OrderMaterialHistoryModel } from "../models/OrderMaterialHistoryModel";

export const getOrgOrderingReport = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        // 1. Get all project IDs belonging to this organization
        const projects = await ProjectModel.find({ organizationId }).select("_id");
        const projectIds = projects.map((p) => p._id);

        if (projectIds.length === 0) {
            return res.status(200).json({
                ok: true,
                data: {
                    summary: { activeProjects: 0, notYetPlaced: 0, totalPlaced: 0 },
                    procurementStatus: { sent: 0, pending: 0, syncRate: 0 },
                },
            });
        }

        // 2. Aggregate Data with double grouping to prevent project inflation
        const report = await OrderMaterialHistoryModel.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            {
                $project: {
                    projectId: 1,
                    // A draft exists if currentOrder.subItems has elements
                    isDraft: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ["$currentOrder.subItems", []] } }, 0] },
                            1,
                            0,
                        ],
                    },
                    orderedItems: 1,
                },
            },
            // Group by Project ID first to ensure unique project stats
            {
                $group: {
                    _id: "$projectId",
                    hasDraft: { $max: "$isDraft" }, // If any doc in project has a draft, project has a draft
                    projectOrderedItems: { $push: "$orderedItems" }, // Push arrays of orderedItems
                },
            },
            // Final group to sum up the entire Organization
            {
                $group: {
                    _id: null,
                    totalProjectsWithData: { $sum: 1 },
                    draftOrdersCount: { $sum: "$hasDraft" },
                    allPlacedOrders: { $push: "$projectOrderedItems" },
                },
            },
        ]);

        if (!report.length) {
            return res.status(200).json({
                ok: true,
                data: {
                    summary: { activeProjects: projectIds.length, notYetPlaced: 0, totalPlaced: 0 },
                    procurementStatus: { sent: 0, pending: 0, syncRate: 0 },
                },
            });
        }

        // 3. Flatten and Calculate Procurement Sync
        let totalPlacedOrders = 0;
        let sentToProcurement = 0;
        let pendingProcurement = 0;

        // report[0].allPlacedOrders is now [ [ [order1, order2], [order3] ], [ [order4] ] ]
        // Level 1: Projects -> Level 2: Documents -> Level 3: Individual Orders
        report[0].allPlacedOrders.forEach((projectDocs: any[][]) => {
            projectDocs.forEach((docOrders: any[]) => {
                docOrders.forEach((order: any) => {
                    totalPlacedOrders++;
                    if (order.isSyncWithProcurement === true) {
                        sentToProcurement++;
                    } else {
                        pendingProcurement++;
                    }
                });
            });
        });

        return res.status(200).json({
            ok: true,
            data: {
                summary: {
                    totalProjectsInOrg: projectIds.length,
                    projectsWithActiveData: report[0].totalProjectsWithData,
                    notYetPlacedCount: report[0].draftOrdersCount, // "Created but not placed"
                    totalPlacedCount: totalPlacedOrders,          // total confirmed orderedItems
                },
                procurementStatus: {
                    sent: sentToProcurement,
                    pending: pendingProcurement,
                    syncRate: totalPlacedOrders > 0
                        ? parseFloat(((sentToProcurement / totalPlacedOrders) * 100).toFixed(2))
                        : 0,
                },
            },
        });
    } catch (error: any) {
        console.error("Org Ordering Report Error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};



export const getOrgArrivalReport = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;
        const projectIds = await ProjectModel.find({ organizationId }).distinct("_id");

        const arrivalData = await MaterialArrivalModel.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            { $unwind: "$materialArrivalList" },
            { $unwind: "$materialArrivalList.subItems" },
            {
                $group: {
                    _id: null,
                    totalSubItems: { $sum: 1 },
                    fullyVerified: {
                        $sum: { $cond: [{ $eq: ["$materialArrivalList.subItems.isVerified", true] }, 1, 0] }
                    },
                    totalOrderedQty: { $sum: "$materialArrivalList.subItems.orderedQuantity" },
                    totalArrivedQty: { $sum: "$materialArrivalList.subItems.arrivedQuantity" },
                }
            }
        ]);

        const data = arrivalData[0] || { totalSubItems: 0 };

        return res.status(200).json({
            ok: true,
            data: {
                verificationRate: data.totalSubItems > 0 ? (data.fullyVerified / data.totalSubItems) * 100 : 0,
                arrivalEfficiency: data.totalOrderedQty > 0 ? (data.totalArrivedQty / data.totalOrderedQty) * 100 : 0,
                pendingVerification: data.totalSubItems - data.fullyVerified
            }
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, message: error.message });
    }
};


export const getOrgProjectsReport = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;
    const { status, priority, completion } = req.query;

    // --- Build Filter ---
    const filter: any = { 
      organizationId: new mongoose.Types.ObjectId(organizationId) 
    };

    if (status) filter["projectInformation.status"] = status;
    if (priority) filter["projectInformation.priority"] = priority;

    if (completion === "completed") {
      filter.completionPercentage = { $gte: 100 };
    } else if (completion === "in-progress") {
      filter.completionPercentage = { $gt: 0, $lt: 100 };
    } else if (completion === "not-started") {
      filter.completionPercentage = { $lte: 0 };
    }

    // --- Fetch Projects + Summary in parallel ---
    const [projects, summaryStats] = await Promise.all([
      ProjectModel.find(filter)
        .select("projectId projectName completionPercentage projectInformation materialsFullyApproved laboursFullyApproved createdAt")
        .sort({ createdAt: -1 })
        .lean(),

      // Summary always org-wide (no filters)
      ProjectModel.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            completedProjects: {
              $sum: { $cond: [{ $gte: ["$completionPercentage", 100] }, 1, 0] },
            },
            inProgressProjects: {
              $sum: {
                $cond: [
                  { $and: [{ $gt: ["$completionPercentage", 0] }, { $lt: ["$completionPercentage", 100] }] },
                  1, 0,
                ],
              },
            },
            notStartedProjects: {
              $sum: { $cond: [{ $lte: ["$completionPercentage", 0] }, 1, 0] },
            },
            avgCompletion: { $avg: "$completionPercentage" },
          },
        },
      ]),
    ]);

    const summary = summaryStats[0] || {
      totalProjects: 0,
      completedProjects: 0,
      inProgressProjects: 0,
      notStartedProjects: 0,
      avgCompletion: 0,
    };

    const formattedProjects = projects.map((p) => ({
      _id: p._id,
      projectId: p.projectId,
      projectName: p.projectName,
      status: p.projectInformation?.status || "Active",
      priority: p.projectInformation?.priority || "none",
      completionPercentage: p.completionPercentage ?? 0,
      materialsApproval: p.materialsFullyApproved,
      laboursApproval: p.laboursFullyApproved,
      createdAt: (p as any).createdAt,
      completionLabel:
        (p.completionPercentage ?? 0) >= 100
          ? "completed"
          : (p.completionPercentage ?? 0) > 0
          ? "in-progress"
          : "not-started",
    }));

    return res.status(200).json({
      ok: true,
      data: {
        summary: {
          totalProjects: summary.totalProjects,
          completedProjects: summary.completedProjects,
          inProgressProjects: summary.inProgressProjects,
          notStartedProjects: summary.notStartedProjects,
          avgCompletionRate: parseFloat((summary.avgCompletion ?? 0).toFixed(2)),
        },
        projects: formattedProjects,
      },
    });
  } catch (error: any) {
    console.error("Project Report Error:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};



export const getOrgPaymentReport = async (req: Request, res: Response): Promise<any> => {
    try {
        const { organizationId } = req.params;

        // 1. Get all projects belonging to this organization
        const projectIds = await ProjectModel.find({ organizationId }).distinct("_id");

        if (projectIds.length === 0) {
            return res.status(200).json({
                ok: true,
                data: {
                    summary: { totalGrandTotal: 0, totalTax: 0, totalDiscount: 0, settlementRate: 0 },
                    statusBreakdown: []
                }
            });
        }

        // 2. Aggregate Payment Data
        const report = await PaymentMainAccountModel.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            {
                $group: {
                    _id: null,
                    totalGrandTotal: { $sum: "$grandTotal" },
                    totalTax: { $sum: "$taxAmount" },
                    totalDiscount: { $sum: "$discountAmount" },
                    // Count by status
                    completedPayments: { 
                        $sum: { $cond: [{ $eq: ["$generalStatus", "completed"] }, 1, 0] } 
                    },
                    pendingPayments: { 
                        $sum: { $cond: [{ $eq: ["$generalStatus", "pending"] }, 1, 0] } 
                    },
                    totalRecords: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalGrandTotal: 1,
                    totalTax: 1,
                    totalDiscount: 1,
                    totalRecords: 1,
                    completedPayments: 1,
                    pendingPayments: 1,
                    settlementRate: {
                        $cond: [
                            { $gt: ["$totalRecords", 0] },
                            { $multiply: [{ $divide: ["$completedPayments", "$totalRecords"] }, 100] },
                            0
                        ]
                    }
                }
            }
        ]);

        const stats = report[0] || { totalGrandTotal: 0, totalTax: 0, totalDiscount: 0, settlementRate: 0 };

        return res.status(200).json({
            ok: true,
            data: stats
        });
    } catch (error: any) {
        console.error("Payment Report Error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
};