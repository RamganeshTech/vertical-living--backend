// backend/services/notification.service.ts

import redisClient from "../../config/redisClient";
import { INotification, Notification } from "../../models/Notificaiton Model/notification.model";
import { CreateNotificationDTO } from "./notification.controller";
import { SocketService } from "../../config/socketService";
import mongoose from "mongoose";
import { RoleBasedRequest } from "../../types/types";
import { Response } from "express";

/**
 * Reusable function to create notification
 * Can be called after sending response
 */
export const createNotification = async (data: CreateNotificationDTO): Promise<INotification | null> => {
  try {
    const notification = new Notification({
      organizationId: data.organizationId || null,
      userId: data.userId,
      userModel: data.userModel,
      message: data.message,
      type: data.type,
      navigation: {
        url: data.navigation.url,
        label: data.navigation.label || 'Click here',
      },
      projectId: data.projectId || null,
      isRead: false,
    });

    await notification.save();

    // Invalidate cache for this user
    await invalidateUserCache(data.userId);

    // ✅ Emit real-time notification via SocketService
    SocketService.sendNotification(data.userId, notification.toObject());

    // ✅ Emit updated unread count
    const unreadCount = await getUnreadCount(data.userId);
    SocketService.updateUnreadCount(data.userId, unreadCount);

    console.log(`✅ Notification created and emitted for user: ${data.userId}`);
    return notification;

    // console.log(`✅ Notification created for user: ${data.userId}`);
    // return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null; // Don't throw error to avoid breaking main flow
  }
};

/**
 * Get all notifications for a user with Redis caching
 */
export const getNotificationsByUserId = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ notifications: INotification[]; total: number; page: number; totalPages: number }> => {
  try {
    console.log("im gettin caled form the notifiaiton")
    const skip = (page - 1) * limit;

    // Redis cache key
    const cacheKey = `notifications:user:${userId}:page:${page}:limit:${limit}`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    // await redisClient.del(cacheKey);
    if (cached) {
      console.log('📦 Fetched notifications from cache');
      return JSON.parse(cached);
    }

    // Fetch from database
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      // .populate('projectId', 'name')
      // .lean(),
      Notification.countDocuments({ userId }),
    ]);

    const response = {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 5 });

    return response;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications with caching
 */
export const getUnreadNotifications = async (userId: string): Promise<INotification[]> => {
  try {
    const cacheKey = `notifications:unread:${userId}`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('📦 Unread notifications from cache');
      return JSON.parse(cached);
    }

    const notifications = await Notification.find({ userId, isRead: false })
      .sort({ createdAt: -1 })
      .populate('projectId', 'name')
      .lean();

    // Cache for 2 minutes (shorter duration for unread)
    await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 2 });

    return notifications;
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw error;
  }
};

/**
 * Get unread count with caching
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const cacheKey = `notifications:unread:count:${userId}`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('📦 Unread count from cache');
      return parseInt(cached);
    }

    const count = await Notification.countDocuments({ userId, isRead: false });

    // Cache for 2 minutes
    await redisClient.set(cacheKey, count.toString(), { EX: 60 * 5 });

    // Emit socket update if requested
      SocketService.updateUnreadCount(userId, count);


    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<INotification | null> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId }, // Ensure user owns the notification
      { isRead: true },
      { new: true }
    );

    if (notification) {
      // Invalidate cache
      await invalidateUserCache(userId);

      // ✅ Emit socket event via SocketService
      SocketService.notifyNotificationRead(userId, notificationId);

      // ✅ Emit updated unread count
      const unreadCount = await getUnreadCount(userId);
      SocketService.updateUnreadCount(userId, unreadCount);
    }

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    // Invalidate cache
    await invalidateUserCache(userId);

    // ✅ Emit socket event via SocketService
    SocketService.notifyAllNotificationsRead(userId);

    // ✅ Emit updated unread count (should be 0)
    SocketService.updateUnreadCount(userId, 0);

  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string, userId: string): Promise<void> => {
  try {
    await Notification.findOneAndDelete({ _id: notificationId, userId });

    // Invalidate cache
    await invalidateUserCache(userId);

    // ✅ Emit socket event via SocketService
    SocketService.notifyNotificationDeleted(userId, notificationId);

    // ✅ Emit updated unread count
    const unreadCount = await getUnreadCount(userId);
    SocketService.updateUnreadCount(userId, unreadCount);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Invalidate all cache keys for a user
 */
const invalidateUserCache = async (userId: string): Promise<void> => {
  try {
    const pattern = `notifications:*:${userId}*`;
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await Promise.all(keys.map((key: any) => redisClient.del(key)));
      console.log(`🗑️ Invalidated ${keys.length} cache keys for user ${userId}`);
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
};





// ADVANCED TECHS



// Mark specific notifications as read (for visible items)
export const markNotificationsAsReadAdvanced = async (userId: string, notificationIds: string[]): Promise<any> => {
  try {
    // Convert string IDs to ObjectIds
    const objectIds = notificationIds.map(id => new mongoose.Types.ObjectId(id));

    // Update only the specified notifications
    const result = await Notification.updateMany(
      {
        _id: { $in: objectIds },
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    return result
  }
  catch (error) {
    console.error('Error mark as read adv:', error);
    throw error;
  }
}