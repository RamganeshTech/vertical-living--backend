
// ===== 2. Socket Service Utility =====
// Create: services/socketService.ts

import { Server } from 'socket.io';
import ProjectModel from '../models/project model/project.model';
import { Types } from 'aws-sdk/clients/acm';
import { ObjectId } from 'mongoose';
import { getUnreadTicketCountUtil } from '../controllers/stage controllers/Issue Discussion Controllers/issueDiscussion.controller';

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



      console.log("Project ID:", projectId);
      console.log("Event:", event);
      console.log("Organization ID:", organizationId);
      console.log("Data keys:", Object.keys(data));
      console.log("Has conversation?", !!data.conversation);
      console.log("Has response?", !!data.response);
      console.log("ConvoId:", data.convoId);



      if (!organizationId) return;


      const roomName = `org_${organizationId}`;
      SocketService.io.to(roomName).emit(event, {
        ...data,
        projectId,
        organizationId,
        timestamp: new Date().toISOString()
      });

      console.log(`Emitted ${event} to room: ${roomName}`);
      console.log("=========================================");

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




  // TICKET DISCUSSIONS

  // ✨ NEW: Emit to specific organization discussion (if you already have orgId)
  static emitToOrgDiscussion(organizationId: string, event: string, data: any) {
    try {
      const discussionRoom = `org_discussion_${organizationId}`;

      // console.log(`📣 Emitting ${event} to room=${room} (members=${members})`);
      console.log("emitted in the organization", discussionRoom)
      SocketService.io.to(discussionRoom).emit(event, {
        ...data,
        organizationId,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Emitted ${event} to discussion room: ${discussionRoom}`);
    } catch (error) {
      console.error('❌ Org discussion emission error:', error);
    }
  }



  // send the unread ticket counts


  /**
   * Update unread count for user
   */
  // static updateUnreadTicketCount(userId: string, count: number) {
  //   this.emitToUser(userId, 'unread_ticket_count_update', { count });
  // }

  // static async emitTicketNotification(ticket: { _id: string; organizationId: string; assignedTo: string[] }) {
  //   for (const userId of ticket.assignedTo) {
  //     const userRoom = `user_issue_notification_${userId}`; // per-user room

  //     const unreadCount = await getUnreadTicketCountUtil(ticket.organizationId, userId);

  //     SocketService.io.to(userRoom).emit('unread_ticket_count_update', { count: unreadCount });
  //   }
  // }

  // ---------------------------
  // Emit to a per-user ticket room
  // ---------------------------
  static emitToUserTicketRoom(userId: string, event: string, data: any) {
    if (!this.io) {
      console.warn('SocketService.io not initialized');
      return;
    }
    
    const room = `user_issue_notification_${userId}`;
    this.io.to(room).emit(event, data);
    console.log("getting from the emitToUserTicketRoom")
    console.log(`✅ Emitted ${event} to user ${userId} in room ${room}`);
  }





   // ============================================
  // 🚗 LOCATION TRACKING METHODS
  // ============================================

  /**
   * Emit location update to organization room
   * Used when driver location updates
   */
  static async emitLocationUpdate(organizationId: string, locationData: {
    shipmentId: string;
    latitude: number;
    longitude: number;
    updatedAt: Date;
    shipmentStatus: string;
    vehicleDetails?: any;
    shipmentNumber?: string;
  }) {
    try {
      const roomName = `org_${organizationId}`;
      
      SocketService.io.to(roomName).emit('location_update', {
        ...locationData,
        organizationId,
        timestamp: new Date().toISOString()
      });

      console.log(`📍 Location update sent to ${roomName}:`, {
        shipmentId: locationData.shipmentId,
        lat: locationData.latitude,
        lng: locationData.longitude
      });
    } catch (error) {
      console.error('Location update emission error:', error);
    }
  }

  /**
   * Emit tracking started event
   * Called when driver starts a delivery
   */
  static async emitTrackingStarted(organizationId: string, trackingData: {
    shipmentId: string;
    // trackingId: string;
    shipmentNumber: string;
    vehicleDetails: any;
    destination?: any;
  }) {
    try {
      const roomName = `org_${organizationId}`;
      
      SocketService.io.to(roomName).emit('tracking_started', {
        ...trackingData,
        organizationId,
        timestamp: new Date().toISOString()
      });

      console.log(`🚀 Tracking started notification sent to ${roomName}`);
    } catch (error) {
      console.error('Tracking started emission error:', error);
    }
  }

  /**
   * Emit tracking stopped event
   * Called when shipment is delivered or cancelled
   */
  static async emitTrackingStopped(organizationId: string, trackingData: {
    shipmentId: string;
    shipmentNumber: string;
    status: string;
    finalLocation?: {
      latitude: number;
      longitude: number;
    };
  }) {
    try {
      const roomName = `org_${organizationId}`;
      
      SocketService.io.to(roomName).emit('tracking_stopped', {
        ...trackingData,
        organizationId,
        timestamp: new Date().toISOString()
      });

      console.log(`🛑 Tracking stopped notification sent to ${roomName}`);
    } catch (error) {
      console.error('Tracking stopped emission error:', error);
    }
  }

  /**
   * Emit driver connection status change
   * Used to show if driver's connection is active/stale/disconnected
   */
  static async emitDriverConnectionStatus(organizationId: string, statusData: {
    shipmentId: string;
    connectionStatus: 'active' | 'stale' | 'disconnected';
    lastLocationUpdate?: Date;
  }) {
    try {
      const roomName = `org_${organizationId}`;
      
      SocketService.io.to(roomName).emit('driver_connection_status', {
        ...statusData,
        organizationId,
        timestamp: new Date().toISOString()
      });

      console.log(`📶 Connection status sent to ${roomName}:`, statusData.connectionStatus);
    } catch (error) {
      console.error('Connection status emission error:', error);
    }
  }

  /**
   * Emit ETA update
   * Called when ETA is calculated/updated
   */
  static async emitETAUpdate(organizationId: string, etaData: {
    shipmentId: string;
    eta: number; // minutes
    estimatedArrival: Date;
  }) {
    try {
      const roomName = `org_${organizationId}`;
      
      SocketService.io.to(roomName).emit('eta_update', {
        ...etaData,
        organizationId,
        timestamp: new Date().toISOString()
      });

      console.log(`⏱️ ETA update sent to ${roomName}: ${etaData.eta} minutes`);
    } catch (error) {
      console.error('ETA update emission error:', error);
    }
  }

  /**
   * Get all active shipments in organization
   * Helper method to send bulk location data
   */
  static async emitBulkLocationUpdate(organizationId: string, shipments: Array<{
    shipmentId: string;
    currentLocation: {
      latitude: number;
      longitude: number;
      updatedAt: Date;
    };
    shipmentStatus: string;
    shipmentNumber: string;
  }>) {
    try {
      const roomName = `org_${organizationId}`;
      
      SocketService.io.to(roomName).emit('bulk_location_update', {
        shipments,
        organizationId,
        count: shipments.length,
        timestamp: new Date().toISOString()
      });

      console.log(`📦 Bulk location update sent to ${roomName}: ${shipments.length} shipments`);
    } catch (error) {
      console.error('Bulk location update emission error:', error);
    }
  }

}

