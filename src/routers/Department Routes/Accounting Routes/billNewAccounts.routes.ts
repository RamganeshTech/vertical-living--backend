import express from 'express';
import { seedDefaultTemplate, 
createNewTemplate, 
updateTemplateLayout,  
createBillNew,
updateBillNew,
getBillNewById,
deleteBillNew,
getAllBillsNew,
getAllTemplates,
getTemplateById} from '../../../controllers/Department controllers/Accounting Controller/Bill_New_controllers/billNewAccounts.controllers';
import { imageUploadToS3, processUploadFiles } from '../../../utils/s3Uploads/s3upload';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';

const BillNewAccountRoutes = express.Router();

BillNewAccountRoutes.use(multiRoleAuthMiddleware("owner", "staff", "CTO"));
// ==================================================================
// BASE PATH: /api/department/accounting/billnew
// ==================================================================

// 1. SEED DEFAULT
// Endpoint: POST /api/department/accounting/billnew/template/seed-default/:organizationId
// Description: Run this once per organization to generate the "Microsoft Word" style default
BillNewAccountRoutes.post('/template/seed-default/:organizationId', seedDefaultTemplate);


// 2. GET DEFAULT TEMPLATE
// Endpoint: GET /api/department/accounting/billnew/template/default/:organizationId
// Description: Used when user clicks "Create New Bill". Fetches the organization's default layout.
// Note: In the controller, 'id' will be undefined, triggering the default fetch logic.
BillNewAccountRoutes.get('/template/all', getAllTemplates);


// 3. GET SPECIFIC TEMPLATE
// Endpoint: GET /api/department/accounting/billnew/template/:id/:organizationId
// Description: Used to load a specific custom template or to view a previous design.
BillNewAccountRoutes.get('/template/:id/:organizationId', getTemplateById);


// 4. CREATE NEW CUSTOM TEMPLATE
// Endpoint: POST /api/department/accounting/billnew/template
// Description: Used when user clicks "Save As New Template".
// Body: { organizationId, templateName, layout: [...] }
BillNewAccountRoutes.post(
    '/template', 
    imageUploadToS3.array("files"), 
    processUploadFiles, 
    createNewTemplate
);



// 5. UPDATE TEMPLATE
// Endpoint: PUT /api/department/accounting/billnew/template/:id
// Description: Used when user modifies the Drag & Drop layout and saves changes to an existing template.
// Body: { organizationId, layout: [...] }
BillNewAccountRoutes.put(
    '/template/:id', 
    imageUploadToS3.array("files"), 
    processUploadFiles, 
    updateTemplateLayout
);


// BILL GENERATEION


BillNewAccountRoutes.post(
    '/bill', 
    imageUploadToS3.array("files"), // Handle multiple files
    processUploadFiles, 
    createBillNew
);

BillNewAccountRoutes.put(
    '/bill/:id', 
    imageUploadToS3.array("files"), 
    processUploadFiles, 
    updateBillNew
);


BillNewAccountRoutes.get('/billall/:organizationId', getAllBillsNew);

BillNewAccountRoutes.get('/bill/:id', getBillNewById);

BillNewAccountRoutes.delete('/bill/delete/:id/:organizationId', deleteBillNew);

export default BillNewAccountRoutes;