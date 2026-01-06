// routes/layoutRoutes.js
import express from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { createToolRoom, deleteToolRoom, getAllToolRooms, getToolRoomById, updateToolRoom } from '../../controllers/tool_controllers/toolRoom.controller';
const toolRoomRoutes = express.Router();

// Create a new Tool Room
toolRoomRoutes.post(
    '/create', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    createToolRoom
);

// Update existing Tool Room details or In-charge person
toolRoomRoutes.patch(
    '/update/:id', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    updateToolRoom
);

// Fetch all Tool Rooms with pagination and name filter
toolRoomRoutes.get(
    '/getall', 
    multiRoleAuthMiddleware("owner", "staff", "CTO", "worker"), 
    getAllToolRooms

);

// Fetch single Tool Room details (populated with in-charge user details)
toolRoomRoutes.get(
    '/get/:id', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    getToolRoomById
);

// Remove a Tool Room from the system
toolRoomRoutes.delete(
    '/delete/:id', 
    multiRoleAuthMiddleware("owner", "staff", "CTO"), 
    deleteToolRoom
);

export default toolRoomRoutes;