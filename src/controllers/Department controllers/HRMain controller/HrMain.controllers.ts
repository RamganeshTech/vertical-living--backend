import { Response, Router } from "express";
import { EmployeeModel, HREmployeeModel } from "../../../models/Department Models/HR Model/HRMain.model";

import { Types } from "mongoose"
import UserModel from "../../../models/usermodel/user.model";
import StaffModel from "../../../models/staff model/staff.model";
import CTOModel from "../../../models/CTO model/CTO.model";
import { WorkerModel } from "../../../models/worker model/worker.model";
import { RoleBasedRequest } from "../../../types/types";



interface SyncEmployeeParams {
    organizationId: Types.ObjectId | string
    empId: Types.ObjectId;
    employeeModel: any;
    empRole: string;
    name: string;
    phoneNo: string | number;
    email: string;
    specificRole:string | null
}

const sourceModels: any = {
    UserModel,
    StaffModel,
    CTOModel,
    WorkerModel,
};

/**
 * 1. Auto-generate HR Employee from existing model
 */
export const syncEmployee = async ({ organizationId, empId, employeeModel, empRole, name, phoneNo, email, specificRole }: SyncEmployeeParams) => {
    if (!empId || !employeeModel || organizationId) {
        return
    }

    // pick the correct source model dynamically
    const SourceModel = sourceModels[employeeModel];

    if (!SourceModel) {
        return
    }

    // const sourceData = await SourceModel.findById(empId).lean();
    // if (!sourceData) {
    //   return 
    // }

    // auto-generate preview fields (you can map more)

    const newEmployee = await EmployeeModel.create({
        organizationId,
        empId,
        employeeModel:employeeModel.modelName,
        empRole: empRole || "organization_staff",
        personalInfo: {
            empName:name,
            email,
            phoneNo: phoneNo,
        },
        employment:{
          specificRole: specificRole || null
        }
    });

    await HREmployeeModel.findOneAndUpdate(
        { organizationId },
        {
            $addToSet: { employeeDetails: newEmployee._id }, // avoids duplicates
        },
        { upsert: true, new: true }
    );

}




// utils/flattenObject.ts
export const flattenObject = (obj: any, parent = "", res: any = {}) => {
  for (let key in obj) {
    const newKey = parent ? `${parent}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key], newKey, res);
    } else {
      res[newKey] = obj[key];
    }
  }
  return res;
};


export const updateEmployee = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { empId } = req.params;
    if (!empId) {
      return res.status(400).json({  ok: false,message: "Employee ID is required" });
    }

    // Convert nested object to dot-notation
    const updates = flattenObject(req.body);

    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      empId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({  ok: false,message: "Employee not found" });
    }

    res.status(200).json({
      message: "Employee updated successfully",
      data: updatedEmployee,
       ok: true,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({  ok: false,message: "Internal server error" });
  }
};



// Get/Search/Filter Employees with Pagination
export const getAllEmployees = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { organizationId, name, email, phone, empRole, page = 1, limit = 10 } = req.query;

    if (!organizationId || !Types.ObjectId.isValid(organizationId as string)) {
      return res.status(400).json({  ok:false, message: "Invalid organizationId" });
    }

    // Base filter
    const filters: any = { organizationId };

    // Search filters
    if (name) filters["personalInfo.name"] = { $regex: name as string, $options: "i" };
    if (email) filters["personalInfo.email"] = { $regex: email as string, $options: "i" };
    if (phone) filters["personalInfo.phone"] = { $regex: phone as string, $options: "i" };

    // Role filter
    if (empRole) filters.empRole = empRole; 
    // empRole: "organization_staff" | "nonorganization_staff"

    // Pagination setup
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Query
    const [employees, total] = await Promise.all([
      HREmployeeModel.find(filters)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      HREmployeeModel.countDocuments(filters),
    ]);

    res.status(200).json({
      ok:true,
      data: employees,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    res.status(500).json({ ok:false,message: "Error fetching employees", error: err.message });
  }
};




// 2. Get Single Employee (by empId)
export const getSingleEmployee = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { empId } = req.params;

    if (!empId || !Types.ObjectId.isValid(empId)) {
      return res.status(400).json({  ok: false,message: "Invalid empId" });
    }

    const employee = await HREmployeeModel.findById(empId);
    if (!employee) {
      return res.status(404).json({  ok: false,message: "Employee not found", data:null });
    }

    res.status(200).json({data:employee, ok:true});
  } catch (err: any) {
    res.status(500).json({  ok: false,message: "Error fetching employee", error: err.message });
  }
};



// 3. Delete Employee
export const deleteEmployee = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { empId } = req.params;

    if (!empId || !Types.ObjectId.isValid(empId)) {
      return res.status(400).json({  ok: false,message: "Invalid empId" });
    }

    const deleted = await HREmployeeModel.findByIdAndDelete(empId);
    if (!deleted) {
      return res.status(404).json({  ok: false,message: "Employee not found" });
    }

    res.status(200).json({  ok: true,message: "Employee deleted successfully" });
  } catch (err: any) {
    res.status(500).json({  ok: false,message: "Error deleting employee", error: err.message });
  }
};



export const uploadEmployeeDocument = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { empId } = req.params;
    const { type } = req.body; // resume, aadhar, pan, etc.

    if (!empId || !Types.ObjectId.isValid(empId)) {
      return res.status(400).json({ ok: false, message: "Valid Employee ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, message: "No file uploaded" });
    }

    const { location, originalname } = req.file as any;

    const newDoc = {
      type,
      fileName: originalname,
      fileUrl: location,
      uploadedAt: new Date(),
    };

    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      empId,
      { $push: { documents: newDoc } },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ ok: false, message: "Employee not found" });
    }

    res.status(200).json({ ok: true, data: updatedEmployee });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


// 2. Delete Employee Document
export const deleteEmployeeDocument = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { empId, docId } = req.params;

    if (!empId || !Types.ObjectId.isValid(empId)) {
      return res.status(400).json({ ok: false, message: "Valid Employee ID is required" });
    }
    if (!docId || !Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ ok: false, message: "Valid Document ID is required" });
    }

    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      empId,
      { $pull: { documents: { _id: docId } } },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ ok: false, message: "Employee or document not found" });
    }

    res.status(200).json({ ok: true, data: updatedEmployee });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
};


