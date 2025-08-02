import { Server } from 'socket.io';
import { markMsgSeenRepo } from '../repositories/index.repository.js';

export const setupSocket = (server) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://devansh-ai-chat.vercel.app',
    process.env.CORS_ORIGIN
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Add connection stability settings
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Store user statuses and room memberships
  const userStatuses = new Map(); // userId -> { socketId, isOnline, currentRoom, lastSeen, lastStatusUpdate }
  const roomMembers = new Map(); // roomId -> Set of userIds
  const statusRequestCooldown = new Map(); // Track recent status requests

  io.on('connection', (socket) => {
    // Join user's personal room for notifications
    socket.on('join_user_room', ({ userId }) => {
      socket.join(`user_${userId}`);
      
      // Add debouncing for status updates - REDUCED from 2000ms to 1000ms
      const now = Date.now();
      const userStatus = userStatuses.get(userId);
      const lastUpdate = userStatus?.lastStatusUpdate || 0;
      
      if (now - lastUpdate > 1000) { // REDUCED: 1 second debounce instead of 2
        userStatuses.set(userId, {
          socketId: socket.id,
          isOnline: true,
          currentRoom: null,
          lastSeen: new Date(),
          lastStatusUpdate: now
        });
        
        // IMMEDIATE broadcast instead of 500ms delay
        socket.broadcast.emit('user_status_changed', {
          userId: userId,
          isOnline: true
        });
      } else {
        // Just update socket ID if recently updated
        if (userStatus) {
          userStatus.socketId = socket.id;
          userStatus.isOnline = true; // Ensure user is marked online
        }
      }
    });

    // Handle sending messages
    socket.on('send_message', async (messageData) => {
      const { senderId, receiverId, content, timestamp, messageId } = messageData;
      
      // Update sender's last seen
      const senderStatus = userStatuses.get(senderId);
      if (senderStatus) {
        senderStatus.lastSeen = new Date();
      }
      
      // Get current status of both users
      const receiverStatus = userStatuses.get(receiverId);
      
      // Check if both users are actively in the same chat room
      // Sender should be in receiverId's room AND receiver should be in senderId's room
      const senderInReceiverRoom = senderStatus && senderStatus.currentRoom === receiverId;
      const receiverInSenderRoom = receiverStatus && receiverStatus.currentRoom === senderId;
      const bothUsersInSameChat = senderInReceiverRoom && receiverInSenderRoom;
      
      // Determine if message should be marked as seen immediately
      // Only mark as seen if receiver is online AND in the same chat room
      const shouldMarkAsSeen = receiverStatus && receiverStatus.isOnline && bothUsersInSameChat;
      
      // Emit to specific chat participants only
      socket.to(`chat_${receiverId}_${senderId}`).emit('receive_message', {
        senderId,
        receiverId,
        content,
        timestamp,
        messageId,
        isSeen: shouldMarkAsSeen
      });
      
      socket.to(`chat_${senderId}_${receiverId}`).emit('receive_message', {
        senderId,
        receiverId,
        content,
        timestamp,
        messageId,
        isSeen: shouldMarkAsSeen
      });

      // Also emit to receiver's personal room for notifications
      socket.to(`user_${receiverId}`).emit('receive_message', {
        senderId,
        receiverId,
        content,
        timestamp,
        messageId,
        isSeen: shouldMarkAsSeen
      });

      // If message should be marked as seen, notify sender immediately
      if (shouldMarkAsSeen) {
        // Update database to mark message as seen
        try {
          await markMsgSeenRepo(receiverId, senderId);
        } catch (error) {
          console.error('Error marking message as seen in database:', error);
        }
        
        // Emit to sender that message was seen immediately
        socket.to(`user_${senderId}`).emit('messages_seen', {
          senderId: senderId,
          receiverId: receiverId,
          messageId: messageId,
          timestamp: Date.now()
        });
        
        // Also emit to sender's socket directly (in case they're in the same room)
        socket.emit('messages_seen', {
          senderId: senderId,
          receiverId: receiverId,
          messageId: messageId,
          timestamp: Date.now()
        });
      }
    });

    // Handle message seen notification
    socket.on('mark_messages_seen', async (data) => {
      const { senderId, receiverId } = data;
      
      // Update database to mark messages as seen
      try {
        await markMsgSeenRepo(receiverId, senderId);
      } catch (error) {
        console.error('Error marking messages as seen in database:', error);
      }
      
      // Notify sender that their messages have been seen
      socket.to(`user_${senderId}`).emit('messages_seen', {
        senderId: senderId,
        receiverId: receiverId,
        roomId: senderId
      });
    });

    // Join specific chat room
    socket.on('join_room', async ({ roomId, userId }) => {
      // Leave previous room if any
      const userStatus = userStatuses.get(userId);
      if (userStatus && userStatus.currentRoom) {
        const prevRoom = userStatus.currentRoom;
        socket.leave(`chat_${prevRoom}_${userId}`);
        
        // Remove from previous room members
        if (roomMembers.has(prevRoom)) {
          roomMembers.get(prevRoom).delete(userId);
          // Notify previous room that user left this specific chat
          socket.to(`user_${prevRoom}`).emit('user_status_changed', {
            userId: userId,
            isOnline: false,
            roomId: prevRoom
          });
        }
      }

      // Join new room
      socket.join(`chat_${roomId}_${userId}`);
      
      // Update user status - ensure we maintain the socket ID
      const currentStatus = userStatuses.get(userId) || {};
      userStatuses.set(userId, {
        ...currentStatus,
        socketId: socket.id,
        isOnline: true,
        currentRoom: roomId,
        lastSeen: new Date()
      });

      // Add to room members
      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set());
      }
      roomMembers.get(roomId).add(userId);

      // Notify the specific chat partner that this user is online in this chat
      socket.to(`user_${roomId}`).emit('user_status_changed', {
        userId: userId,
        isOnline: true,
        roomId: roomId
      });

      // Check if the other person is also online and in this chat
      const otherUserStatus = userStatuses.get(roomId);
      if (otherUserStatus && otherUserStatus.isOnline) {
        const otherUserInThisChat = otherUserStatus.currentRoom === userId;
        socket.emit('user_status_changed', {
          userId: roomId,
          isOnline: otherUserInThisChat,
          roomId: userId
        });
      }

      // Important: When both users are now in the same room after this join
      // Mark all unseen messages as seen since user opened the chat
      setTimeout(() => {
        const updatedUserStatus = userStatuses.get(userId);
        const updatedOtherUserStatus = userStatuses.get(roomId);
        
        const userInOtherRoom = updatedUserStatus && updatedUserStatus.currentRoom === roomId;
        const otherUserInUserRoom = updatedOtherUserStatus && updatedOtherUserStatus.currentRoom === userId;
        
        // When user joins a room, mark all messages from the other user as seen
        // This implements the requirement: "mark all messages of other user seen as soon as current user opens that user's chat"
        socket.to(`user_${roomId}`).emit('messages_seen', {
          senderId: roomId,
          receiverId: userId,
          timestamp: Date.now(),
          allMessages: true // Flag to indicate all messages should be marked as seen
        });
        
        // If both users are now in the same room, also mark user's messages to roomId as seen
        if (userInOtherRoom && otherUserInUserRoom) {
          socket.emit('messages_seen', {
            senderId: userId,
            receiverId: roomId,
            timestamp: Date.now(),
            allMessages: true
          });
        }
      }, 100); // Small delay to ensure status is updated
    });

    // Leave chat room
    socket.on('leave_room', ({ roomId, userId }) => {
      socket.leave(`chat_${roomId}_${userId}`);
      
      // Update user status
      const userStatus = userStatuses.get(userId);
      if (userStatus) {
        userStatus.currentRoom = null;
        userStatus.lastSeen = new Date();
      }

      // Remove from room members
      if (roomMembers.has(roomId)) {
        roomMembers.get(roomId).delete(userId);
      }

      // Notify the other person that this user left this specific chat
      socket.to(`user_${roomId}`).emit('user_status_changed', {
        userId: userId,
        isOnline: false,
        roomId: roomId
      });
    });

    // Handle message deletion - FIXED EVENT NAME
    socket.on('delete_message', (data) => {
      const { messageId, chatId, senderId, roomId } = data;
      
      // Broadcast to all users in the room
      socket.to(`chat_${chatId}_${senderId}`).emit('message_deleted', {
        messageId,
        chatId,
        senderId
      });
      
      socket.to(`chat_${senderId}_${chatId}`).emit('message_deleted', {
        messageId,
        chatId,
        senderId
      });

      // Also emit to both users' personal rooms for cross-chat updates
      socket.to(`user_${chatId}`).emit('message_deleted', {
        messageId,
        chatId,
        senderId
      });
      
      socket.to(`user_${senderId}`).emit('message_deleted', {
        messageId,
        chatId,
        senderId
      });

      // Emit back to sender for confirmation
      socket.emit('message_deleted', {
        messageId,
        chatId,
        senderId
      });
    });

    // Enhanced get_user_status with better cooldown
    socket.on('get_user_status', ({ userId }, callback) => {
      try {
        // Check cooldown - REDUCED from 3000ms to 1500ms
        const now = Date.now();
        const cooldownKey = `${socket.id}_${userId}`;
        const lastRequest = statusRequestCooldown.get(cooldownKey) || 0;
        
        if (now - lastRequest < 1500) { // REDUCED: 1.5 second cooldown instead of 3
          if (callback) {
            callback({ userId, isOnline: false, error: 'Rate limited' });
          }
          return;
        }
        
        statusRequestCooldown.set(cooldownKey, now);
        
        const userStatus = userStatuses.get(userId);
        const response = {
          userId: userId,
          isOnline: userStatus ? userStatus.isOnline : false,
          currentRoom: userStatus ? userStatus.currentRoom : null,
          lastSeen: userStatus ? userStatus.lastSeen : null
        };
        
        if (callback) {
          callback(response);
        }
        
        // Clean up old cooldown entries
        setTimeout(() => {
          statusRequestCooldown.delete(cooldownKey);
        }, 10000);
      } catch (error) {
        if (callback) {
          callback({ userId, isOnline: false, error: 'Internal error' });
        }
      }
    });

    // Handle user disconnection with REDUCED delay
    socket.on('disconnect', () => {
      // Find and update user status
      for (const [userId, status] of userStatuses.entries()) {
        if (status.socketId === socket.id) {
          // REDUCED: Mark user as offline with shorter delay to prevent flickering
          setTimeout(() => {
            if (userStatuses.has(userId) && userStatuses.get(userId).socketId === socket.id) {
              status.isOnline = false;
              status.lastSeen = new Date();
              
              // Broadcast to all users that this user is offline
              socket.broadcast.emit('user_status_changed', {
                userId: userId,
                isOnline: false
              });
              
              // Notify specific chat room if user was in one
              if (status.currentRoom) {
                socket.to(`user_${status.currentRoom}`).emit('user_status_changed', {
                  userId: userId,
                  isOnline: false,
                  roomId: status.currentRoom
                });
                
                // Remove from room members
                if (roomMembers.has(status.currentRoom)) {
                  roomMembers.get(status.currentRoom).delete(userId);
                }
              }
            }
          }, 1000); // REDUCED: 1 second delay instead of 2
          break;
        }
      }
    });

    // Periodic cleanup of old user statuses (optional)
    setInterval(() => {
      const now = new Date();
      let cleanedCount = 0;
      
      for (const [userId, status] of userStatuses.entries()) {
        if (!status.isOnline && status.lastSeen) {
          const timeDiff = now - new Date(status.lastSeen);
          // Remove user status after 1 hour of being offline
          if (timeDiff > 60 * 60 * 1000) {
            userStatuses.delete(userId);
            cleanedCount++;
          }
        }
      }
      
      // Clean up old cooldown entries
      const cooldownCutoff = now.getTime() - 300000; // 5 minutes ago
      for (const [key, timestamp] of statusRequestCooldown.entries()) {
        if (timestamp < cooldownCutoff) {
          statusRequestCooldown.delete(key);
        }
      }
    }, 30 * 60 * 1000); // Run every 30 minutes
  });
};