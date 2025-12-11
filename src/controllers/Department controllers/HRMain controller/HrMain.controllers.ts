import { Response, Router } from "express";
import { EmployeeModel, HREmployeeModel } from "../../../models/Department Models/HR Model/HRMain.model";

import { Types } from "mongoose"
import UserModel from "../../../models/usermodel/user.model";
import StaffModel, { IStaff } from "../../../models/staff model/staff.model";
import CTOModel from "../../../models/CTO model/CTO.model";
import { WorkerModel } from "../../../models/worker model/worker.model";
import { RoleBasedRequest } from "../../../types/types";
import redisClient from "../../../config/redisClient";
import { getRoleByModel } from "../../../constants/BEconstants";
import { arch } from "os";
import { uploadToS3 } from "../../stage controllers/ordering material controller/pdfOrderHistory.controller";



interface SyncEmployeeParams {
  organizationId: Types.ObjectId | string
  empId: Types.ObjectId | string;
  employeeModel: any;
  empRole: string;
  name: string;
  phoneNo: string | number;
  email: string;
  role: string | null
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
export const syncEmployee = async ({ organizationId, empId, employeeModel, empRole, name, phoneNo, email, role }: SyncEmployeeParams) => {
  // console.log("empId", empId, "employeeModel", employeeModel,)
  if (!empId || !employeeModel || !organizationId) {
    console.log("no empId or employeeModel or organiiaotnID is provided ")
    return
  }

  // pick the correct source model dynamically
  const SourceModel = sourceModels[employeeModel];

  if (!SourceModel) {
    console.log("no model is created")
    return
  }
  // const sourceData = await SourceModel.findById(empId).lean();
  // if (!sourceData) {
  //   return 
  // }

  // auto-generate preview fields (you can map more)
  let newEmployee;
  const isCreated = await EmployeeModel.findOne({ "personalInfo.email": email })
  
  if (!isCreated) {
    newEmployee = await EmployeeModel.create({
      organizationId,
      empId,
      employeeModel: employeeModel,
      empRole: empRole || "organization_staff",
      personalInfo: {
        empName: name,
        email,
        phoneNo: phoneNo,
      },
      role:role,
      employment: {
        department: null
      }
    });
  }
  else {
    // newEmployee = await EmployeeModel.findOneAndUpdate({ "personalInfo.email": email }, {
    //   empId: empId,
    //   employeeModel: employeeModel,
    //   empRole: empRole || "organization_staff",
    //   employment: {
    //     department: specificRole || null
    //   }
    // })

    // console.log("getting into the else condition")
    // console.log("email", email)
    // console.log("pjoneNo", phoneNo)
    // console.log("name", name)

    newEmployee = await EmployeeModel.findOneAndUpdate(
      { "personalInfo.email": email },
      {
        $set: {
          empId: empId,
          employeeModel: employeeModel,
          empRole: empRole || "organization_staff",
          // "employment.department": empSpecificRole ? empSpecificRole : isCreated?.employment?.department || null,
          "personalInfo.email": email ? email : isCreated?.personalInfo?.email || null,
          "personalInfo.phoneNo": phoneNo ? phoneNo : isCreated?.personalInfo?.phoneNo || null,
          "personalInfo.empName": name ? name : isCreated?.personalInfo?.empName || null
        }
      },
      { new: true }
    );

  }

  await HREmployeeModel.findOneAndUpdate(
    { organizationId }, 
    {
      $addToSet: { employeeDetails: newEmployee!._id }, // avoids duplicates
    },
    { upsert: true, new: true }
  );


  console.log("newEdmployee", newEmployee)

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


export const updateEmployee = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { empId } = req.params;
    if (!empId) {
      return res.status(400).json({ ok: false, message: "Employee ID is required" });
    }

    // Convert nested object to dot-notation
    const updates = flattenObject(req.body);

    const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
      empId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ ok: false, message: "Employee not found" });
    }

    res.status(200).json({
      message: "Employee updated successfully",
      data: updatedEmployee,
      ok: true,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};


export const addEmployeeByHR = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    // // Convert nested object to dot-notation
    // // const updates = flattenObject(req.body);

    // const newEmployee = await EmployeeModel.create(req.body);


    // if (!newEmployee) {
    //   return res.status(404).json({ ok: false, message: "Employee not found" });
    // }

    // res.status(200).json({
    //   message: "Employee created successfully",
    //   data: newEmployee,
    //   ok: true,
    // });

    // Extract text data from form
    const employeeData = JSON.parse(req.body.employeeData);
    
    // Process uploaded files
    const documents: any[] = [];
    
    // Process each document type
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Process each file field
      Object.entries(files).forEach(([fieldName, fileArray]) => {
        fileArray.forEach((file:any) => {
          // The file now has a 'location' property added by processUploadFiles
          if (file.location) {
            documents.push({
              type: fieldName,
              fileName: file.originalname,
              fileUrl: file.location,
              uploadedAt: new Date()
            });
          }
        });
      });
    }
    
    // Add documents to employee data
    employeeData.documents = documents;
    
    // Create employee
    const newEmployee = await EmployeeModel.create(employeeData);

    if (!newEmployee) {
      return res.status(404).json({ ok: false, message: "Employee not found" });
    }

    res.status(200).json({
      message: "Employee created successfully",
      data: newEmployee,
      ok: true,
    });


  }
  catch (error: any) {
    console.error("Error updating employee:", error);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
}



// Get/Search/Filter Employees with Pagination
export const getAllEmployees = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { organizationId, name, email, phone, empRole, status, department, page = 1, limit = 10 } = req.query;

    if (!organizationId || !Types.ObjectId.isValid(organizationId as string)) {
      return res.status(400).json({ ok: false, message: "Invalid organizationId" });
    }


    //   const employeesToSync = [

    // {
    //   empId: "6880a17ea790362c9f19525a",
    //   name: "vivek",
    //   email: "workwithvivek6@gmail.com",
    //   phone: "6666666666",
    // }

    //   ];

    //   // Run syncEmployee in loop
    //   for (const emp of employeesToSync) {
    //     // await syncEmployee({
    //     //   organizationId: "684a57015e439b678e8f6918",
    //     //   empId: emp.empId,
    //     //   employeeModel: "StaffModel",
    //     //   empRole: "organization_staff",
    //     //   name: emp.name,
    //     //   phoneNo: emp.phone,
    //     //   email: emp.email,
    //     //   specificRole: ""
    //     // });
    //   }


    // Base filter
    const filters: any = { organizationId };

    // Search filters
    if (name) filters["personalInfo.empName"] = { $regex: name as string, $options: "i" };
    if (email) filters["personalInfo.email"] = { $regex: email as string, $options: "i" };
    if (phone) filters["personalInfo.phone"] = { $regex: phone as string, $options: "i" };

    // Role filter
    if (empRole) filters.empRole = empRole;

    if (status) filters.status = status
    if (department) filters["employment.department"] = department
    // empRole: "organization_staff" | "nonorganization_staff"



    console.log("filtes", filters)
    // Pagination setup
    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Query
    const [employees, total] = await Promise.all([
      EmployeeModel.find(filters)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      EmployeeModel.countDocuments(filters),
    ]);

    res.status(200).json({
      ok: true,
      data: employees,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: "Error fetching employees", error: err.message });
  }
};




// 2. Get Single Employee (by empId)
export const getSingleEmployee = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid id" });
    }

    const employee = await EmployeeModel.findById(id);
    if (!employee) {
      return res.status(404).json({ ok: false, message: "Employee not found", data: null });
    }


    console.log("employee", employee)
    res.status(200).json({ data: employee, ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: "Error fetching employee", error: err.message });
  }
};



// 3. Delete Employee
export const deleteEmployee = async (req: RoleBasedRequest, res: Response): Promise<any> => {
  try {
    const { empId } = req.params;
    console.log("empuid", empId)
    if (!empId || !Types.ObjectId.isValid(empId)) {
      return res.status(400).json({ ok: false, message: "Invalid empId" });
    }

    const deleted = await EmployeeModel.findByIdAndDelete(empId).populate<{ empId: IStaff }>("empId");


    if (!deleted) {
      return res.status(404).json({ ok: false, message: "Employee not found" });
    }



    // Step 2: Check if employeeModel exists
    if (deleted.employeeModel && deleted.empId && sourceModels[deleted.employeeModel]) {
      try {
        await sourceModels[deleted.employeeModel].findByIdAndDelete(deleted.empId);
        console.log(`Deleted from ${deleted.employeeModel} as well`);
      } catch (err: any) {
        console.warn(`Failed to delete from ${deleted.employeeModel}:`, err.message);
      }
    }


    if (deleted?.employeeModel && deleted.employeeModel in getRoleByModel) {
      const orgId = deleted?.empId?.organizationId?.[0]

      await redisClient.del(`getusers:${getRoleByModel[deleted.employeeModel] as string}:${orgId}}`)
    }

    res.status(200).json({ ok: true, message: "Employee deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: "Error deleting employee", error: err.message });
  }
};



export const uploadEmployeeDocument = async (req: RoleBasedRequest, res: Response): Promise<any> => {
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
export const deleteEmployeeDocument = async (req: RoleBasedRequest, res: Response): Promise<any> => {
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


