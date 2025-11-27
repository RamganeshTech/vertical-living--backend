import { Request, Response } from 'express';
import { BillNewModel, IBillComponent, IBillSection, TemplateBillModel } from '../../../../models/Department Models/Accounting Model/Bill_New_Accounts_controllers/billNewAccounting.model';
import mongoose from 'mongoose';
import { uploadToS3 } from '../../../stage controllers/ordering material controller/pdfOrderHistory.controller';
import { generateBillPdf } from './pdfGeneratorBillNewAccounts';

const resolveLayoutFiles = (layoutJson: string, uploadedFiles: any[]) => {
  let layoutString = layoutJson;

  // The frontend will send placeholders like "__FILE_0__", "__FILE_1__"
  // We replace them with the actual S3 URLs.
  uploadedFiles.forEach((file, index) => {
    const placeholder = `__FILE_${index}__`;
    // Replace all occurrences (though usually just one)
    layoutString = layoutString.replace(new RegExp(placeholder, 'g'), file.location);
  });

  return JSON.parse(layoutString);
};


// =========================================================
// 1. SEED DEFAULT TEMPLATE 
// (Run this once to create the initial Master Template)
// =========================================================
export const seedDefaultTemplate = async (req: Request, res: Response): Promise<any> => {
  try {

    const { organizationId } = req.params
    // Define the initial structure (The "Easier than Word" default)
    // const defaultLayout: IBillSection[] = [
    //   {
    //     id: 'sec_header',
    //     name: 'Header Section',
    //     order: 0,
    //     style: { 
    //         fontSize: 12, color: '#000', backgroundColor: 'transparent', fontWeight: 'normal', textAlign: 'left',
    //         marginTop: 0, marginBottom: 20, marginLeft: 0, marginRight: 0, padding: 0 
    //     },
    //     components: [
    //       {
    //         id: 'comp_company',
    //         type: 'text',
    //         label: 'Company Details',
    //         value: 'Your Company Name\nAddress Line 1',
    //         isVisible: true,
    //         order: 0,
    //         style: { 
    //             fontSize: 18, color: '#000', backgroundColor: 'transparent', fontWeight: 'bold', textAlign: 'left',
    //             marginTop: 0, marginBottom: 10, marginLeft: 0, marginRight: 0, padding: 0 
    //         }
    //       },
    //       {
    //         id: 'comp_date',
    //         type: 'date',
    //         label: 'Date',
    //         value: new Date(),
    //         isVisible: true,
    //         order: 1,
    //         style: { 
    //             fontSize: 12, color: '#555', backgroundColor: 'transparent', fontWeight: 'normal', textAlign: 'right',
    //             marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, padding: 0 
    //         }
    //       }
    //     ]
    //   },
    //   {
    //     id: 'sec_items',
    //     name: 'Bill Items',
    //     order: 1,
    //     style: { 
    //         fontSize: 12, color: '#000', backgroundColor: 'transparent', fontWeight: 'normal', textAlign: 'left',
    //         marginTop: 0, marginBottom: 30, marginLeft: 0, marginRight: 0, padding: 0 
    //     }, // 30px default space below items
    //     components: [
    //       {
    //         id: 'comp_table',
    //         type: 'table',
    //         label: 'Item Table',
    //         value: [], // Placeholder for table data
    //         isVisible: true,
    //         order: 0,
    //         style: { 
    //             fontSize: 12, color: '#000', backgroundColor: 'transparent', fontWeight: 'normal', textAlign: 'left',
    //             marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, padding: 0 
    //         }
    //       }
    //     ]
    //   },
    //   {
    //     id: 'sec_totals',
    //     name: 'Totals Section',
    //     order: 2,
    //     style: { 
    //         fontSize: 12, color: '#000', backgroundColor: 'transparent', fontWeight: 'normal', textAlign: 'left',
    //         marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, padding: 0 
    //     },
    //     components: [
    //         {
    //             id: 'comp_tax',
    //             type: 'calc-field',
    //             label: 'Tax Amount',
    //             value: 0,
    //             isVisible: true,
    //             order: 0,
    //             style: { 
    //                 fontSize: 12, color: '#000', backgroundColor: 'transparent', fontWeight: 'normal', textAlign: 'right',
    //                 marginTop: 0, marginBottom: 5, marginLeft: 0, marginRight: 0, padding: 0 
    //             }
    //         },
    //         {
    //             id: 'comp_total',
    //             type: 'calc-field',
    //             label: 'Grand Total',
    //             value: 0,
    //             isVisible: true,
    //             order: 1,
    //             style: { 
    //                 fontSize: 16, color: '#000', backgroundColor: 'transparent', fontWeight: 'bold', textAlign: 'right',
    //                 marginTop: 5, marginBottom: 0, marginLeft: 0, marginRight: 0, padding: 0 
    //             }
    //         }
    //     ]
    //   }
    // ];

    const defaultLayout: any = []
    const newTemplate = await TemplateBillModel.create({
      organizationId,
      templateName: 'Standard Invoice Template',
      isDefault: true,
      layout: defaultLayout,
      pdfData: null
    });

    res.status(201).json({ message: 'Default Template Created', data: newTemplate });
  } catch (error: any) {
    res.status(500).json({ message: 'Error seeding template', error: error.message });
  }
};

// =========================================================
// 2. GET TEMPLATE
// (Used when user opens the "Template Editor" or "New Bill")
// =========================================================
// =========================================================
// 1. GET ALL TEMPLATES (INFINITE SCROLL & FILTERS)
// =========================================================  


export const getAllTemplates = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      organizationId,
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      createdFromDate,
      createdToDate
    } = req.query;

    // 1. Validate Organization ID
    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId as string)) {
      return res.status(400).json({ ok: false, message: "Valid Organization ID is required" });
    }

    // 2. Build Filter Object
    const filter: any = {
      organizationId: new mongoose.Types.ObjectId(organizationId as string)
    };

    // Search by Template Name (Case-insensitive)
    if (search) {
      filter.templateName = { $regex: search, $options: 'i' };
    }

    // Date Range Filtering
    if (createdFromDate || createdToDate) {
      const filterRange: any = {};
      if (createdFromDate) {
        const from = new Date(createdFromDate as string);
        if (!isNaN(from.getTime())) {
          from.setHours(0, 0, 0, 0);
          filterRange.$gte = from;
        }
      }
      if (createdToDate) {
        const to = new Date(createdToDate as string);
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          filterRange.$lte = to;
        }
      }
      if (Object.keys(filterRange).length > 0) {
        filter.createdAt = filterRange;
      }
    }

    // 3. Build Sort Object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // 4. Pagination Logic
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 5. Execute Query
    const [templates, totalCount] = await Promise.all([
      TemplateBillModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('templateName isDefault createdAt updatedAt layout'), // Select necessary fields for card view
      TemplateBillModel.countDocuments(filter)
    ]);

    // 6. Calculate Pagination Info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    const response = {
      ok: true,
      message: "Templates retrieved successfully",
      data: templates,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage,
      }
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error("Error getting templates:", error);
    res.status(500).json({ ok: false, message: "Error retrieving templates", error: error.message });
  }
};

// =========================================================
// 2. GET SINGLE TEMPLATE BY ID
// =========================================================
export const getTemplateById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, organizationId } = req.params;

    if (!id || !organizationId) {
      return res.status(400).json({ ok: false, message: "ID and Organization ID are required" });
    }

    const template = await TemplateBillModel.findOne({ _id: id, organizationId });

    if (!template) {
      return res.status(404).json({ ok: false, message: 'Template not found' });
    }

    return res.status(200).json({ ok: true, data: template, message: "single template fetched properly" });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: 'Error fetching template', error: error.message });
  }
};

// =========================================================
// 3. UPDATE TEMPLATE LAYOUT 
// (Crucial: Handles Drag & Drop, Spacing, and Styling)
// =========================================================
export const updateTemplateLayout = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { layout, templateName, organizationId } = req.body;
    const files = req.files as any[] || [];

    // `layout` is the Array<IBillSection> coming from Frontend State

    if (!layout) {
      return res.status(400).json({ message: 'Layout data is required' });
    }

    // --- LOGIC FOR CHATGPT SUGGESTION #1 (ORDER) ---
    // The frontend might send us an array that is visually reordered.
    // We must iterate through it and explicitly update the 'order' number
    // to match the array index. This ensures the DB stays perfectly synced.
    // 1. Resolve Files
    const resolvedLayout = resolveLayoutFiles(layout, files);

    // 2. Sanitize Order
    const sanitizedLayout = resolvedLayout.map((section: IBillSection, secIndex: number) => {
      // 1. Update Section Order
      section.order = secIndex;

      // 2. Update Components Order inside the section
      if (section.components && section.components.length > 0) {
        section.components = section.components.map((comp: IBillComponent, compIndex: number) => {
          comp.order = compIndex;
          return comp;
        });
      }
      return section;
    });

    // Update the database
    const updatedTemplate = await TemplateBillModel.findOneAndUpdate(
      { _id: id, organizationId },
      {
        layout: sanitizedLayout,
        ...(templateName && { templateName }) // Update name if provided
      },
      { new: true } // Return the updated document
    );

    if (!updatedTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // 4. Regenerate PDF Preview
    try {
      const pdfBytes = await generateBillPdf(updatedTemplate.toObject());
      const fileName = `bill-template-${Date.now()}.pdf`;

      const uploadResult = await uploadToS3(pdfBytes, fileName);

      updatedTemplate.pdfData = {
        type: "pdf",
        url: uploadResult.Location,
        originalName: fileName,
        uploadedAt: new Date(),
      };

      await updatedTemplate.save();

    } catch (pdfError) {
      console.error("Template PDF Update Error:", pdfError);
    }

    res.status(200).json({ message: 'Template updated successfully', data: updatedTemplate });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating template', error: error.message });
  }
};

// =========================================================
// 4. CREATE NEW CUSTOM TEMPLATE
// (If user modifies Default and clicks "Save As New Template")
// =========================================================
export const createNewTemplate = async (req: Request, res: Response): Promise<any> => {
  try {
    const { templateName, layout, organizationId } = req.body;
    const files = req.files as any[] || [];


    console.log("111111111111")
    if (!templateName || !layout || !organizationId) {
      return res.status(400).json({ message: 'Name, Layout, and Organization ID are required' });
    }
    // 1. Resolve Files in Layout
    const resolvedLayout = resolveLayoutFiles(layout, files);

    // 2. Sanitize Order
    const sanitizedLayout = resolvedLayout.map((section: IBillSection, secIndex: number) => {
      section.order = secIndex;
      section.components.forEach((comp: IBillComponent, compIndex: number) => {
        comp.order = compIndex;
      });
      return section;
    });

    const newTemplate = await TemplateBillModel.create({
      organizationId,
      templateName,
      isDefault: false, // New creations are usually not default unless specified
      layout: sanitizedLayout
    });


    try {
      const pdfBytes = await generateBillPdf(newTemplate.toObject());
      // const fileName = `invoices/${organizationId}/${updatedBill.billNumber}_v${Date.now()}.pdf`;
      const fileName = `bill-template-${Date.now()}.pdf`;


      const uploadResult = await uploadToS3(pdfBytes, fileName);

      newTemplate.pdfData = {
        type: "pdf",
        url: uploadResult.Location,
        originalName: fileName,
        uploadedAt: new Date(),
      };

      await newTemplate.save();

    } catch (pdfError) {
      console.error("PDF Regeneration failed during update:", pdfError);
    }


    return res.status(201).json({ message: 'New Template Saved', data: newTemplate });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
};





//  BILLL NEW CONTROLLERS (CUSTOMER DATA)



export const createBillNew = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId, projectId, customerName, customerId, templateId, layout } = req.body;
    // 'layout ' is an object like: { "comp_date": "2023-01-01", "comp_company": "My New Name" }


    const files = req.files as any[] || [];



    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    let finalLayout: IBillSection[] = [];

    if (layout) {
      // PARSE JSON AND INJECT S3 URLS
      finalLayout = resolveLayoutFiles(layout, files);
    }
    else {
      // A. FIND SOURCE TEMPLATE
      let sourceTemplate;
      if (templateId) {
        sourceTemplate = await TemplateBillModel.findOne({ _id: templateId, organizationId });
      } else {
        sourceTemplate = await TemplateBillModel.findOne({ organizationId });
      }

      if (!sourceTemplate) {
        return res.status(404).json({ message: 'No valid template found to initialize bill' });
      }



      // B. CREATE SNAPSHOT (Deep Copy)
      // We break the link with the template so edits don't change the master
      let finalLayout: IBillSection[] = JSON.parse(JSON.stringify(sourceTemplate.layout));

      // C. INJECT INITIAL VALUES (The Refactor)
      // If the frontend sent specific data to pre-fill, we map it into the layout now.
      if (layout && Object.keys(layout).length > 0) {
        finalLayout = finalLayout.map((section) => {
          if (section.components) {
            section.components = section.components.map((comp) => {
              // Check if there is a value sent for this component ID
              if (layout[comp.id]) {
                comp.value = layout[comp.id]; // Override default value
              }
              return comp;
            });
          }
          return section;
        });
      }
    }



    // D. GENERATE BILL NUMBER
    const billNumber = `INV-${Date.now()}`; // Replace with your counter logic if needed

    // E. SAVE TO DB
    const newBill = await BillNewModel.create({
      organizationId,
      projectId: projectId || null,
      billNumber,
      customerId: customerId || null,
      customerName: customerName || '',
      layout: finalLayout, // Saved with default structure + injected values
      pdfData: null
    });


    try {
      const pdfBytes = await generateBillPdf(newBill)

      const fileName = `bill-${Date.now()}.pdf`;

      const uploadResult = await uploadToS3(pdfBytes, fileName);

      newBill.pdfData = {
        type: "pdf",
        url: uploadResult.Location,
        originalName: fileName,
        uploadedAt: new Date(),
      }
    }
    catch (e) {
      console.log("error fom the bill new pdf generataion", e)
    }

    await newBill.save()

    return res.status(201).json({ message: 'Bill created successfully', data: newBill });

  } catch (error: any) {
    res.status(500).json({ message: 'Error creating bill', error: error.message });
  }
};


// =========================================================
// 2. REFACTORED UPDATE BILL
// Features:
// - Saves reordering (Drag & Drop).
// - Saves renamed Labels (e.g. "Tax" -> "VAT").
// - Saves new Values (e.g. 100 -> 200).
// - Saves Style changes (Colors, Margins).
// - Saves Visibility toggles.
// =========================================================
export const updateBillNew = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { organizationId, layout, customerName, projectId, billNumber } = req.body;
    const files = req.files as any[] || [];
    // layout: This is the FULL array coming from the frontend state.
    // It contains the new order, the new labels, the new values, everything.

    if (!organizationId || !layout) {
      return res.status(400).json({ message: 'Organization ID and Layout are required' });
    }

    // 1. Resolve Layout Files
    const resolvedLayout = resolveLayoutFiles(layout, files);



    // A. SANITIZE & PRESERVE DATA
    // We loop through the incoming layout to ensure the 'order' index is correct.
    // Crucially, we do NOT modify 'label', 'value', or 'style'. We keep what frontend sent.
    const sanitizedLayout = resolvedLayout.map((section: IBillSection, secIndex: number) => {

      // 1. Update Section Order (Macro Reorder)
      section.order = secIndex;

      if (section.components) {
        section.components = section.components.map((comp: IBillComponent, compIndex: number) => {

          // 2. Update Component Order (Micro Reorder)
          comp.order = compIndex;

          // 3. Explicitly Ensure Data Integrity (Optional but good for debugging)
          // We accept whatever the frontend sent for these fields:
          // comp.label = comp.label; 
          // comp.value = comp.value;
          // comp.style = comp.style;
          // comp.isVisible = comp.isVisible;

          return comp;
        });
      }
      return section;
    });

    // B. UPDATE DATABASE
    // We replace the entire 'layout' array in MongoDB with this new one.
    const updatedBill = await BillNewModel.findOneAndUpdate(
      { _id: id, organizationId }, // Security check
      {
        layout: sanitizedLayout, // <--- This saves ALL changes (Label, Value, Style, Order)
        ...(customerName && { customerName }),
        ...(projectId && { projectId }),
        ...(billNumber && { billNumber }),
        // ...(pdfData && { pdfData }), // Allow updating background if needed
        updatedAt: new Date()
      },
      { new: true } // Return the updated document
    );

    if (!updatedBill) {
      return res.status(404).json({ message: 'Bill not found or unauthorized' });
    }

    try {
      const pdfBytes = await generateBillPdf(updatedBill.toObject());
      // const fileName = `invoices/${organizationId}/${updatedBill.billNumber}_v${Date.now()}.pdf`;
      const fileName = `bill-${Date.now()}.pdf`;


      const uploadResult = await uploadToS3(pdfBytes, fileName);

      updatedBill.pdfData = {
        type: "pdf",
        url: uploadResult.Location,
        originalName: fileName,
        uploadedAt: new Date(),
      };

      console.log("updatedBill", updatedBill.pdfData)

      await updatedBill.save();

    } catch (pdfError) {
      console.error("PDF Regeneration failed during update:", pdfError);
    }

    res.status(200).json({ message: 'Bill saved successfully', data: updatedBill });

  } catch (error: any) {
    res.status(500).json({ message: 'Error updating bill', error: error.message });
  }
};



// =========================================================
// 3. GET SINGLE BILL (VIEW/EDIT MODE)
// =========================================================
export const getBillNewById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;


    console.log("geting inside that ")
    // if (!organizationId) {
    //     return res.status(400).json({ message: 'Organization ID is required' });
    // }

    const bill = await BillNewModel.findOne({ _id: id });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.status(200).json({ data: bill, ok: true, message: "fetched single bill" });

  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching bill', error: error.message });
  }
};



// =========================================================
// 4. GET ALL BILLS (INFINITE SCROLL & FILTERS)
// =========================================================
export const getAllBillsNew = async (req: Request, res: Response): Promise<any> => {
  try {
    const { organizationId } = req.params;
    const {
      projectId,
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      createdFromDate,
      createdToDate
    } = req.query;

    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: 'Valid Organization ID is required' });
    }

    // 1. Build Filter Object
    const filter: any = {
      organizationId: new mongoose.Types.ObjectId(organizationId)
    };

    if (projectId && mongoose.Types.ObjectId.isValid(projectId as string)) {
      filter.projectId = new mongoose.Types.ObjectId(projectId as string);
    }

    // Search (Bill Number or Customer Name)
    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Date Range Filtering
    if (createdFromDate || createdToDate) {
      const filterRange: any = {};
      if (createdFromDate) {
        const from = new Date(createdFromDate as string);
        if (!isNaN(from.getTime())) {
          from.setHours(0, 0, 0, 0);
          filterRange.$gte = from;
        }
      }
      if (createdToDate) {
        const to = new Date(createdToDate as string);
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          filterRange.$lte = to;
        }
      }
      if (Object.keys(filterRange).length > 0) {
        filter.createdAt = filterRange;
      }
    }

    // 2. Sorting
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // 3. Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 4. Execute Query
    const [bills, totalCount] = await Promise.all([
      BillNewModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('billNumber customerName createdAt updatedAt projectId') // Optimize payload
        .populate('projectId', 'projectName'), // Assuming ProjectModel has 'projectName'
      BillNewModel.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;

    const response = {
      ok: true,
      message: "Bills retrieved successfully",
      data: bills,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage
      }
    };

    res.status(200).json(response);

  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching bills', error: error.message });
  }
};


// =========================================================
// 5. DELETE BILL (DRAFT)
// =========================================================
export const deleteBillNew = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, organizationId } = req.params;

    const deletedBill = await BillNewModel.findOneAndDelete({ _id: id, organizationId });

    if (!deletedBill) {
      return res.status(404).json({ message: 'Bill not found or unauthorized' });
    }

    res.status(200).json({ message: 'Bill deleted successfully' });

  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting bill', error: error.message });
  }
};
