import { Router } from 'express';
import { createModule,
getAllModules,
getModuleById,
updateModule,
deleteModule,
createTab,
updateTab,
deleteTab,
createContentBlock,
updateContentBlock } from '../../../controllers/marketing_controllers/classRoom_controllers/classRoom.controller';
import { multiRoleAuthMiddleware } from '../../../middlewares/multiRoleAuthMiddleware';

const ClassRoomRoutes = Router();

// ==========================================
// MAIN MODULE ROUTES
// ==========================================

// Create a new module
ClassRoomRoutes.post('/:organizationId/modules', multiRoleAuthMiddleware("owner", "CTO", "staff"), createModule);

// Get all modules for an organization
ClassRoomRoutes.get('/:organizationId/modules', multiRoleAuthMiddleware("owner", "CTO", "staff"), getAllModules);

// Get a specific module by ID
ClassRoomRoutes.get('/:organizationId/modules/:moduleId', multiRoleAuthMiddleware("owner", "CTO", "staff"), getModuleById);

// Update a specific module
ClassRoomRoutes.put('/:organizationId/modules/:moduleId', multiRoleAuthMiddleware("owner", "CTO", "staff"), updateModule);

// Delete a specific module
ClassRoomRoutes.delete('/:organizationId/modules/:moduleId', multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteModule);


// ==========================================
// TAB ROUTES
// ==========================================

// Create a new tab inside a module
ClassRoomRoutes.post('/:organizationId/modules/:moduleId/tabs', multiRoleAuthMiddleware("owner", "CTO", "staff"), createTab);

// Update a specific tab
ClassRoomRoutes.put('/:organizationId/modules/:moduleId/tabs/:tabId', multiRoleAuthMiddleware("owner", "CTO", "staff"), updateTab);

// Delete a specific tab
ClassRoomRoutes.delete('/:organizationId/modules/:moduleId/tabs/:tabId', multiRoleAuthMiddleware("owner", "CTO", "staff"), deleteTab);


// ==========================================
// CONTENT BLOCK ROUTES
// ==========================================

// Add a new content block to a tab
ClassRoomRoutes.post('/:organizationId/modules/:moduleId/tabs/:tabId/content', multiRoleAuthMiddleware("owner", "CTO", "staff"), createContentBlock);

// Update a specific content block inside a tab
ClassRoomRoutes.put('/:organizationId/modules/:moduleId/tabs/:tabId/content/:contentId', multiRoleAuthMiddleware("owner", "CTO", "staff"), updateContentBlock);

export default ClassRoomRoutes;