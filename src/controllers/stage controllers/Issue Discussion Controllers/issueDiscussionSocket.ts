// socket/discussionSocket.ts

import { Server, Socket } from 'socket.io';
// types/socket.types.ts

export interface CustomSocket extends Socket {
  userId?: string;
  userRole?: string;
  userModel?: string;
  currentRoom?: string;
  currentOrgId?: string;
  data: {
    userName?: string;
    discussionRooms?: string[];
    currentProjectId?: string;
    [key: string]: any;
  };
}


export function setupDiscussionSocket(io: Server) {

  // Discussion-specific namespace for better organization
  const discussionNamespace = io.of('/discussions');

  discussionNamespace.on('connection', (socket: CustomSocket) => {
    console.log(`User ${socket.userId} connected to discussions`);

    // Join project discussion room
    socket.on('join_project_discussion', async (data: {
      projectId: string,
      organizationId: string
    }) => {
      try {
        const { projectId, organizationId } = data;

        // Create room names
        const discussionRoom = `discussion_${projectId}`;
        const orgDiscussionRoom = `org_discussion_${organizationId}`;

        // Join both project and organization discussion rooms
        await socket.join(discussionRoom);
        await socket.join(orgDiscussionRoom);

        if (!socket.data.discussionRooms) {
          socket.data.discussionRooms = [];
        }


        socket.data.discussionRooms = [discussionRoom, orgDiscussionRoom];
        socket.data.currentProjectId = projectId;

        console.log(`User ${socket.userId} joined discussion rooms: ${discussionRoom}, ${orgDiscussionRoom}`);

        // Notify others in the room
        socket.to(discussionRoom).emit('user_joined_discussion', {
          userId: socket.userId,
          userRole: socket.userRole,
          userName: socket.data.userName,
          timestamp: new Date()
        });



        if (!socket.userId) {
          socket.emit('discussion_error', {
            message: 'User authentication required'
          });
          return;
        }

        // Send recent discussions to the joining user
        const { getRecentDiscussions } = await import('./issueDiscussion.controller.js');
        const recentDiscussions = await getRecentDiscussions(projectId, socket.userId);

        socket.emit('recent_discussions', recentDiscussions);

      } catch (error: any) {
        socket.emit('discussion_error', {
          message: 'Failed to join discussion room',
          error: error.message
        });
      }
    });

    // Handle new issue creation
    socket.on('create_issue', async (data: {
      projectId: string,
      issue: any
    }) => {
      try {
        const discussionRoom = `discussion_${data.projectId}`;

        // Emit to all users in the discussion room
        discussionNamespace.to(discussionRoom).emit('new_issue_created', {
          issue: data.issue,
          createdBy: {
            userId: socket.userId,
            userRole: socket.userRole,
            userName: socket.data.userName
          },
          timestamp: new Date()
        });

        // Also notify the assigned staff member personally
        const assignedStaffRoom = `notifications_${data.issue.selectStaff}`;
        io.to(assignedStaffRoom).emit('assigned_to_issue', {
          issue: data.issue,
          assignedBy: socket.data.userName,
          projectId: data.projectId
        });

      } catch (error: any) {
        socket.emit('discussion_error', {
          message: 'Failed to create issue',
          error: error.message
        });
      }
    });

    // Handle response submission
    socket.on('submit_response', async (data: {
      discussionId: string,
      convoId: string,
      response: any,
      projectId: string
    }) => {
      try {
        const discussionRoom = `discussion_${data.projectId}`;

        // Emit to all users in the discussion room
        discussionNamespace.to(discussionRoom).emit('new_response_added', {
          discussionId: data.discussionId,
          convoId: data.convoId,
          response: data.response,
          respondedBy: {
            userId: socket.userId,
            userRole: socket.userRole,
            userName: socket.data.userName
          },
          timestamp: new Date()
        });

      } catch (error: any) {
        socket.emit('discussion_error', {
          message: 'Failed to submit response',
          error: error.message
        });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: {
      projectId: string,
      isTyping: boolean,
      convoId?: string
    }) => {
      const discussionRoom = `discussion_${data.projectId}`;

      socket.to(discussionRoom).emit('user_typing', {
        userId: socket.userId,
        userName: socket.data.userName,
        isTyping: data.isTyping,
        convoId: data.convoId
      });
    });

    // Handle leaving discussion room
    socket.on('leave_project_discussion', (data: { projectId: string }) => {
      const discussionRoom = `discussion_${data.projectId}`;

      socket.leave(discussionRoom);
      socket.to(discussionRoom).emit('user_left_discussion', {
        userId: socket.userId,
        userName: socket.data.userName
      });

      // Clean up socket data
      socket.data.discussionRooms = socket.data.discussionRooms?.filter(
        room => room !== discussionRoom
      );
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Leave all discussion rooms
      if (socket.data.discussionRooms) {
        socket.data.discussionRooms.forEach(room => {
          socket.leave(room);
          socket.to(room).emit('user_left_discussion', {
            userId: socket.userId,
            userName: socket.data.userName
          });
        });
      }

      console.log(`User ${socket.userId} disconnected from discussions`);
    });
  });
}