// backend/types/notification.types.ts

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ASSIGNMENT = 'assignment',
}

export enum UserModelType {
  USER = 'UserModel',
  STAFF = 'StaffModel',
  CTO = 'CTOModel',
  WORKER = 'WorkerModel',
}

export interface CreateNotificationDTO {
  organizationId: string;
  userId: string;
  userModel: UserModelType;
  message: string;
  type: NotificationType;
  navigation: {
    url: string;
    label?: string;
  };
  projectId?: string;
}

export interface NotificationResponse {
  _id: string;
  organizationId: string;
  userId: string;
  userModel: string;
  message: string;
  type: string;
  isRead: boolean;
  navigation: {
    url: string;
    label?: string;
  };
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}


// backend/controllers/notification.controller.ts

import { Request, Response } from 'express';
import {
  getNotificationsByUserId,
  getUnreadNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from './notification.service';
import { RoleBasedRequest } from '../../types/types';

/**
 * Get all notifications for logged-in user
 * GET /api/notifications?page=1&limit=20
 */
export const getUserNotifications = async (req: RoleBasedRequest, res: Response) => {
  try {
    const userId = req.user?._id!; // From auth middleware
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getNotificationsByUserId(userId, page, limit);

    res.status(200).json({
      ok: true,
      message: 'Notifications fetched successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error fetching notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get unread notifications
 * GET /api/notifications/unread
 */
export const getUserUnreadNotifications = async (req: RoleBasedRequest, res: Response) => {
  try {
    const userId = req.user?._id!;

    const notifications = await getUnreadNotifications(userId);

    res.status(200).json({
      ok: true,
      message: 'Unread notifications fetched successfully',
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error fetching unread notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
export const getUserUnreadCount = async (req: RoleBasedRequest, res: Response) => {
  try {
    const userId = req.user?._id!;

    const count = await getUnreadCount(userId);

    res.status(200).json({
      ok: true,
      message: 'Unread count fetched successfully',
      count,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error fetching unread count',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req: RoleBasedRequest, res: Response):Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id!;

    const notification = await markNotificationAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({
        ok: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      ok: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error marking notification as read',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Mark all as read
 * PATCH /api/notifications/mark-all-read
 */
export const markAllAsRead = async (req: RoleBasedRequest, res: Response) => {
  try {
    const userId = req.user?._id!;

    await markAllNotificationsAsRead(userId);

    res.status(200).json({
      ok: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error marking all as read',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteUserNotification = async (req: RoleBasedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id!;

    await deleteNotification(id, userId);

    res.status(200).json({
      ok: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error deleting notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};