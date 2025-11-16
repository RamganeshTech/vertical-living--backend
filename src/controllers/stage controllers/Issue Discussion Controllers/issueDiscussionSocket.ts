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