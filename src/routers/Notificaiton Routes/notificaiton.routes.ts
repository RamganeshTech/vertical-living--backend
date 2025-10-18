// backend/routes/notification.routes.ts

import express from 'express';
// import {
//   getUserNotifications,
//   getUserUnreadNotifications,
//   getUserUnreadCount,
//   markAsRead,
//   markAllAsRead,
//   deleteUserNotification,
// } from '../..';
// import { authMiddleware } from '../middlewares/auth.middleware';
import { getUserNotifications, getUserUnreadNotifications,
getUserUnreadCount,
markAsRead,
markAllAsRead,
deleteUserNotification, } from '../../controllers/Notification Controller/notification.controller';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';

const notificaitonRoutes = express.Router();

// All routes require authentication
notificaitonRoutes.use(multiRoleAuthMiddleware("owner", "CTO", "staff"));

// Get all notifications for user
notificaitonRoutes.get('/getAllNotificaiton', getUserNotifications);

// Get unread notifications
notificaitonRoutes.get('/unread', getUserUnreadNotifications);

// Get unread count
notificaitonRoutes.get('/unread-count', getUserUnreadCount);

// Mark as read
notificaitonRoutes.patch('/:id/read', markAsRead);

// Mark all as read
notificaitonRoutes.patch('/mark-all-read', markAllAsRead);

// Delete notification
notificaitonRoutes.delete('/:id', deleteUserNotification);

export default notificaitonRoutes;