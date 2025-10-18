
// ===== 2. Socket Service Utility =====
// Create: services/socketService.ts

import { Server } from 'socket.io';
import ProjectModel from '../models/project model/project.model';

export class SocketService {
  private static io: Server;
  
  static initialize(io: Server) {
    SocketService.io = io;
  }
  
  static async getOrganizationId(projectId: string): Promise<string | null> {
    try {
      const project = await ProjectModel.findById(projectId).populate('organizationId');
      return project?.organizationId?._id?.toString() || null;
    } catch (error) {
      console.error('Error getting organization ID:', error);
      return null;
    }
  }
  
  static async emitToProject(projectId: string, event: string, data: any) {
    try {
      const organizationId = await this.getOrganizationId(projectId);
      console.log("getti created then what si ", organizationId)
      if (!organizationId) return;
      
      
      const roomName = `org_${organizationId}`;
      SocketService.io.to(roomName).emit(event, {
        ...data,
        projectId,
        organizationId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Emitted ${event} to room: ${roomName}`);
    } catch (error) {
      console.error('Socket emission error:', error);
    }
  }
  
  static async emitToOrganization(organizationId: string, event: string, data: any) {
    try {
      // Emit to all projects in the organization
      const rooms = await SocketService.io.sockets.adapter.rooms;
      const orgRooms = Array.from(rooms.keys()).filter(room => 
        room.startsWith(`org_${organizationId}_`)
      );
      
      orgRooms.forEach(room => {
        SocketService.io.to(room).emit(event, {
          ...data,
          organizationId,
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Organization emission error:', error);
    }
  }





    // ===== NOTIFICATION METHODS =====

  /**
   * Emit notification to specific user
   */
  static emitToUser(userId: string, event: string, data: any) {
    try {
      const notificationRoom = `notifications_${userId}`;
      SocketService.io.to(notificationRoom).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Emitted ${event} to user: ${userId}`);
    } catch (error) {
      console.error('❌ Error emitting to user:', error);
    }
  }

  /**
   * Send new notification to user
   */
  static sendNotification(userId: string, notification: any) {
    this.emitToUser(userId, 'new_notification', { notification });
  }

  /**
   * Update unread count for user
   */
  static updateUnreadCount(userId: string, count: number) {
    this.emitToUser(userId, 'unread_count_update', { count });
  }

  /**
   * Notify user that notification was marked as read
   */
  static notifyNotificationRead(userId: string, notificationId: string) {
    this.emitToUser(userId, 'notification_read', { notificationId });
  }

  /**
   * Notify user that all notifications were marked as read
   */
  static notifyAllNotificationsRead(userId: string) {
    this.emitToUser(userId, 'all_notifications_read', {});
  }

  /**
   * Notify user that notification was deleted
   */
  static notifyNotificationDeleted(userId: string, notificationId: string) {
    this.emitToUser(userId, 'notification_deleted', { notificationId });
  }

  /**
   * Send notification to multiple users
   */
  static sendNotificationToMultipleUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.sendNotification(userId, notification);
    });
  }

  /**
   * Send notification to all users in organization
   */
  static async sendNotificationToOrganization(organizationId: string, notification: any) {
    try {
      const orgRoom = `org_${organizationId}`;
      SocketService.io.to(orgRoom).emit('new_notification', {
        notification,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Sent notification to organization: ${organizationId}`);
    } catch (error) {
      console.error('❌ Error sending notification to organization:', error);
    }
  }

}

