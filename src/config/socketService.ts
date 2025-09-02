
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
}

