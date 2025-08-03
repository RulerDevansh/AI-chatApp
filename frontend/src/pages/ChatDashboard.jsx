import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import UserProfile from '../components/UserProfile';
import InvitationManager from '../components/InvitationManager';
import FriendProfile from '../components/FriendProfile';
import socket from '../utils/socket';
import { useAuth } from '../context/useAuth';
import { connectionAPI, messageAPI } from '../utils/api';
import { Menu, X } from 'lucide-react';

const ChatDashboard = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showInvitationManager, setShowInvitationManager] = useState(false);
  const [invitationManagerTab, setInvitationManagerTab] = useState('received');
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [chats, setChats] = useState([]);
  const [currentChatMessages, setCurrentChatMessages] = useState([]);
  const [lastStatusUpdate, setLastStatusUpdate] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [userStatuses, setUserStatuses] = useState({});
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastNotificationUpdate, setLastNotificationUpdate] = useState({});
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  // Mobile drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);
  const [sidebarTranslateX, setSidebarTranslateX] = useState(-288); // -w-72 = -288px
  
  const sidebarRef = useRef(null);
  const chatsRef = useRef([]);
  const selectedChatRef = useRef(selectedChat);

  // Mobile drag handlers
  const handleTouchStart = (e) => {
    if (window.innerWidth >= 1024) return; // Only for mobile
    
    const touch = e.touches[0];
    const target = e.target;
    
    // Only start dragging if touching the drag handle or header area, not the chat list
    const isDragHandle = target.closest('.drag-handle');
    const isHeader = target.closest('.sidebar-header');
    const isChatList = target.closest('.chat-list-container');
    
    if (isChatList && !isDragHandle && !isHeader) {
      return; // Don't interfere with chat list scrolling
    }
    
    setIsDragging(true);
    setDragStartX(touch.clientX);
    setDragCurrentX(touch.clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || window.innerWidth >= 1024) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX;
    const currentTranslate = isSidebarOpen ? 0 : -288;
    const newTranslateX = Math.max(-288, Math.min(0, currentTranslate + deltaX));
    
    setSidebarTranslateX(newTranslateX);
    setDragCurrentX(touch.clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || window.innerWidth >= 1024) return;
    
    setIsDragging(false);
    const deltaX = dragCurrentX - dragStartX;
    const threshold = 100; // Minimum drag distance to trigger open/close
    
    if (isSidebarOpen) {
      // If sidebar is open, close it if dragged left significantly
      if (deltaX < -threshold || sidebarTranslateX < -144) { // Half width threshold
        setIsSidebarOpen(false);
        setSidebarTranslateX(-288);
      } else {
        // Snap back to open
        setSidebarTranslateX(0);
      }
    } else {
      // If sidebar is closed, open it if dragged right significantly
      if (deltaX > threshold || sidebarTranslateX > -144) { // Half width threshold
        setIsSidebarOpen(true);
        setSidebarTranslateX(0);
      } else {
        // Snap back to closed
        setSidebarTranslateX(-288);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (window.innerWidth >= 1024) return; // Only for mobile
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || window.innerWidth >= 1024) return;
    
    e.preventDefault();
    const deltaX = e.clientX - dragStartX;
    const currentTranslate = isSidebarOpen ? 0 : -288;
    const newTranslateX = Math.max(-288, Math.min(0, currentTranslate + deltaX));
    
    setSidebarTranslateX(newTranslateX);
    setDragCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging || window.innerWidth >= 1024) return;
    
    setIsDragging(false);
    const deltaX = dragCurrentX - dragStartX;
    const threshold = 100;
    
    if (isSidebarOpen) {
      if (deltaX < -threshold || sidebarTranslateX < -144) {
        setIsSidebarOpen(false);
        setSidebarTranslateX(-288);
      } else {
        setSidebarTranslateX(0);
      }
    } else {
      if (deltaX > threshold || sidebarTranslateX > -144) {
        setIsSidebarOpen(true);
        setSidebarTranslateX(0);
      } else {
        setSidebarTranslateX(-288);
      }
    }
  };

  // Mouse event listeners for desktop drag simulation
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStartX, dragCurrentX, isSidebarOpen, sidebarTranslateX]);

  // Add touch event listeners with proper options to prevent passive listener warning
  useEffect(() => {
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;

    // Get specific elements that should handle drag
    const dragHandle = sidebarElement.querySelector('.drag-handle');
    const sidebarHeader = sidebarElement.querySelector('.sidebar-header');

    // Add touch event listeners with non-passive option only to drag areas
    if (dragHandle) {
      dragHandle.addEventListener('touchstart', handleTouchStart, { passive: false });
      dragHandle.addEventListener('touchmove', handleTouchMove, { passive: false });
      dragHandle.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    if (sidebarHeader) {
      sidebarHeader.addEventListener('touchstart', handleTouchStart, { passive: false });
      sidebarHeader.addEventListener('touchmove', handleTouchMove, { passive: false });
      sidebarHeader.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (dragHandle) {
        dragHandle.removeEventListener('touchstart', handleTouchStart);
        dragHandle.removeEventListener('touchmove', handleTouchMove);
        dragHandle.removeEventListener('touchend', handleTouchEnd);
      }
      if (sidebarHeader) {
        sidebarHeader.removeEventListener('touchstart', handleTouchStart);
        sidebarHeader.removeEventListener('touchmove', handleTouchMove);
        sidebarHeader.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isDragging, isSidebarOpen, dragStartX, dragCurrentX, sidebarTranslateX]); // Add all necessary dependencies

  // Reset sidebar position when toggled via button
  useEffect(() => {
    if (window.innerWidth >= 1024) return;
    
    if (isSidebarOpen) {
      setSidebarTranslateX(0);
    } else {
      setSidebarTranslateX(-288);
    }
  }, [isSidebarOpen]);

  // Update refs when state changes
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Function to update chat's last message in sidebar
  const updateChatLastMessage = useCallback((chatId, lastMessage) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: lastMessage,
            time: lastMessage.time
          };
        }
        return chat;
      });
    });
  }, []);

  // Function to get last message from current chat messages
  const getLastMessageFromCurrentChat = useCallback((messages) => {
    if (!messages || messages.length === 0) {
      return {
        text: 'Start a conversation!',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: true,
        unread: 0
      };
    }

    // Filter out AI messages and loading messages for last message display
    const userMessages = messages.filter(msg => !msg.isAI && !msg.isLoading && !msg.isSending);
    
    if (userMessages.length === 0) {
      return {
        text: 'Start a conversation!',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: true,
        unread: 0
      };
    }

    const lastUserMessage = userMessages[userMessages.length - 1];
    
    return {
      text: lastUserMessage.text.length > 50 
        ? `${lastUserMessage.text.substring(0, 50)}...` 
        : lastUserMessage.text,
      time: lastUserMessage.time,
      isRead: lastUserMessage.sender === 'me', // Mark as read if sent by current user
      unread: 0
    };
  }, []);

  // Function to reorder chats based on unread messages
  const reorderChatsByUnread = useCallback((chats, notifications) => {
    // Separate chats into two groups: those with unread messages and those without
    const chatsWithUnread = chats.filter(chat => notifications[chat.id] > 0);
    const chatsWithoutUnread = chats.filter(chat => !notifications[chat.id] || notifications[chat.id] === 0);
    
    // Sort chats with unread by unread count (highest first) and then by time
    chatsWithUnread.sort((a, b) => {
      const aCount = notifications[a.id] || 0;
      const bCount = notifications[b.id] || 0;
      if (aCount !== bCount) {
        return bCount - aCount; // Higher unread count first
      }
      // If same unread count, sort by last message time
      return new Date(b.lastMessage?.time || 0) - new Date(a.lastMessage?.time || 0);
    });

    // Return reordered list: unread chats first, then others
    return [...chatsWithUnread, ...chatsWithoutUnread];
  }, []);

  // Function to load unread message counts
  const loadUnreadMessages = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await messageAPI.getUnreadMessages();
      const unreadData = response.data || [];
      
      // Convert unread data to notifications object for sidebar
      const newNotifications = {};
      unreadData.forEach(item => {
        newNotifications[item.senderId] = item.count;
      });
      
      // Always update notifications and reorder chats
      setNotifications(newNotifications);
      
      // Update chat list with unread counts and reorder
      setChats(prevChats => {
        const updatedChats = prevChats.map(chat => {
          const unreadCount = newNotifications[chat.id] || 0;
          return {
            ...chat,
            unread: unreadCount,
            lastMessage: {
              ...chat.lastMessage,
              isRead: unreadCount === 0
            }
          };
        });

        // Always reorder chats based on unread messages
        return reorderChatsByUnread(updatedChats, newNotifications);
      });
      
      // Mark initial data as loaded
      setInitialDataLoaded(true);
    } catch (error) {
      console.error('Error loading unread messages:', error);
      setInitialDataLoaded(true); // Still mark as loaded even on error
    }
  }, [user?.id, reorderChatsByUnread]);

  // Function to load connections
  const loadConnections = useCallback(async () => {
    setIsLoadingConnections(true);
    try {
      const response = await connectionAPI.getConnectionList();
      const userConnections = response.data || [];
    
      // Format connections as chats for the sidebar
      const formattedChats = userConnections.map((connection, index) => {
        const userName = connection.friendName || 'Unknown User';
        const friendId = connection.friendId || `connection-${index}`;
        
        // Check if this chat already exists to preserve last message and notifications
        const existingChat = chatsRef.current.find(chat => chat.id === friendId);
        
        return {
          id: friendId,
          name: userName,
          username: userName,
          friendId: connection.friendId,
          bio: connection.bio,
          profilePicture: connection.profilePicture,
          email: connection.email,
          avatar: connection.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
          online: false,
          time: existingChat?.time || new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          lastMessage: existingChat?.lastMessage || {
            text: 'Start a conversation!',
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isRead: true,
            unread: 0
          },
          unread: existingChat?.unread || 0
        };
      });
      
      // Only update chats if this is the initial load or if we have new connections
      setChats(prevChats => {
        // If we already have chats and the count is the same, don't update
        if (prevChats.length > 0 && prevChats.length === formattedChats.length) {
          // Check if all existing chats are still present
          const allExist = prevChats.every(prevChat => 
            formattedChats.some(newChat => newChat.id === prevChat.id)
          );
          if (allExist) {
            return prevChats; // Don't update if no changes
          }
        }
        return formattedChats;
      });
    } catch (error) {
      console.error('Load connections error:', error);
      // Only set empty array if we don't have existing chats
      setChats(prevChats => prevChats.length === 0 ? [] : prevChats);
    } finally {
      setIsLoadingConnections(false);
    }
  }, []);

  // Load connections only once when component mounts
  useEffect(() => {
    if (user?.id) {
      const loadInitialData = async () => {
        await loadConnections();
        await loadUnreadMessages(); // Load unread message counts
      };
      
      loadInitialData();
      
      // Set up periodic refresh of unread messages (every 60 seconds to reduce conflicts)
      const unreadRefreshInterval = setInterval(() => {
        loadUnreadMessages();
      }, 60000);

      return () => {
        clearInterval(unreadRefreshInterval);
      };
    }
  }, [user?.id, loadConnections, loadUnreadMessages]);

  // Reorder chats when both chats and notifications are available (for page reloads and initial loads)
  useEffect(() => {
    if (chats.length > 0) {
      // Check if we have any notifications
      const hasNotifications = Object.keys(notifications).length > 0;
      const hasUnreadChats = Object.values(notifications).some(count => count > 0);
      
      // If we have notifications with actual unread counts, reorder
      if (hasNotifications && hasUnreadChats) {
        setChats(prevChats => reorderChatsByUnread(prevChats, notifications));
      }
    }
  }, [chats.length, notifications, reorderChatsByUnread]);

  // Update current chat's last message when messages change
  useEffect(() => {
    if (selectedChat && currentChatMessages.length > 0) {
      const lastMessage = getLastMessageFromCurrentChat(currentChatMessages);
      updateChatLastMessage(selectedChat.id, lastMessage);
    }
  }, [selectedChat, currentChatMessages, getLastMessageFromCurrentChat, updateChatLastMessage]);

  // Debounced status update function - REDUCED debounce time
  const debouncedStatusUpdate = useCallback((userId, isOnline) => {
    const now = Date.now();
    const lastUpdate = lastStatusUpdate[userId] || 0;
    
    // REDUCED: Only update if enough time has passed (500ms debounce instead of 1000ms)
    if (now - lastUpdate > 500) {
      setLastStatusUpdate(prev => ({ ...prev, [userId]: now }));
      
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === userId) {
            return { ...chat, online: isOnline };
          }
          return chat;
        });
      });

      if (selectedChatRef.current && selectedChatRef.current.id === userId) {
        setSelectedChat(prevChat => ({
          ...prevChat,
          online: isOnline
        }));
      }
    }
  }, [lastStatusUpdate]);

  // Create stable refs for functions to avoid dependency issues
  const debouncedStatusUpdateRef = useRef();
  const loadConnectionsRef = useRef();
  const loadUnreadMessagesRef = useRef();
  const socketConnectedRef = useRef(socketConnected);

  // Update refs when functions change
  useEffect(() => {
    debouncedStatusUpdateRef.current = debouncedStatusUpdate;
  }, [debouncedStatusUpdate]);

  useEffect(() => {
    loadConnectionsRef.current = loadConnections;
  }, [loadConnections]);

  useEffect(() => {
    loadUnreadMessagesRef.current = loadUnreadMessages;
  }, [loadUnreadMessages]);

  useEffect(() => {
    socketConnectedRef.current = socketConnected;
  }, [socketConnected]);

  // Centralized socket handling -ONLY in ChatDashboard
  useEffect(() => {
    if (!user?.id) return;

    let hasConnected = false; // Flag to prevent multiple connections
    let isCleaningUp = false; // Flag to prevent operations during cleanup

    const handleConnect = () => {
      if (!hasConnected && !isCleaningUp) {
        setSocketConnected(true);
        socket.emit('join_user_room', { userId: user.id });
        hasConnected = true;
      }
    };

    const handleDisconnect = () => {
      if (!isCleaningUp) {
        setSocketConnected(false);
        hasConnected = false;
      }
    };

    // Centralized status change handler
    const handleSocketUserStatusChange = (data) => {
      if (isCleaningUp) return;
      
      const { userId, isOnline } = data;
      
      // Update central status tracking
      setUserStatuses(prev => ({
        ...prev,
        [userId]: isOnline
      }));
      
      // Update chats with debouncing using ref
      if (debouncedStatusUpdateRef.current) {
        debouncedStatusUpdateRef.current(userId, isOnline);
      }
    };

    // Handle room-specific events when user joins/leaves chat rooms
    const handleJoinChatRoom = (chatId) => {
      if (socketConnectedRef.current && !isCleaningUp) {
        socket.emit('join_room', { roomId: chatId, userId: user.id });
      }
    };

    const handleLeaveChatRoom = (chatId) => {
      if (socketConnectedRef.current && !isCleaningUp) {
        socket.emit('leave_room', { roomId: chatId, userId: user.id });
      }
    };

    // Enhanced global message handler
    const handleGlobalMessage = (data) => {
      if (isCleaningUp) return;
      
      const senderId = data.senderId || data.sender;
      const receiverId = data.receiverId || data.receiver;
      
      // Only handle if this user is the receiver
      if (receiverId === user.id) {
        // If it's for the currently active chat, pass to ChatArea via callback
        if (selectedChatRef.current?.id === senderId) {
          // Message for active chat - let ChatArea handle it via a callback
          if (window.chatAreaMessageHandler && !isCleaningUp) {
            window.chatAreaMessageHandler(data);
          }
        }
        // Note: Don't increment notifications here since we handle it via 'unread_message_notification' event
        
        // Update the chat list with the new message
        setChats(prevChats => {
          const existingChatIndex = prevChats.findIndex(chat => chat.id === senderId);
          
          if (existingChatIndex !== -1) {
            // Update existing chat
            const updatedChats = [...prevChats];
            const messageText = data.content || data.message || 'New message';
            const messageTime = new Date(data.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            updatedChats[existingChatIndex] = {
              ...updatedChats[existingChatIndex],
              lastMessage: {
                text: messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText,
                time: messageTime,
                isRead: selectedChatRef.current?.id === senderId, // Mark as read if it's the active chat
                unread: selectedChatRef.current?.id === senderId ? 0 : (updatedChats[existingChatIndex].lastMessage?.unread || 0) + 1
              },
              time: messageTime,
            };
            
            // Move updated chat to top
            const updatedChat = updatedChats.splice(existingChatIndex, 1)[0];
            return [updatedChat, ...updatedChats];
          } else {
            // If chat doesn't exist in current list, reload connections to get new contact
            if (!isCleaningUp && loadConnectionsRef.current) {
              setTimeout(() => {
                loadConnectionsRef.current();
                // Also reload unread messages to sync notifications
                setTimeout(() => {
                  if (!isCleaningUp && loadUnreadMessagesRef.current) {
                    loadUnreadMessagesRef.current();
                  }
                }, 200);
              }, 100);
            }
            return prevChats;
          }
        });
      }
    };

    // Enhanced message deletion handler
    const handleGlobalMessageDeleted = (data) => {
      if (isCleaningUp) return;
      
      const { messageId, chatId, senderId } = data;
      
      // If it's for the currently active chat, pass to ChatArea for animation
      if (selectedChatRef.current?.id === chatId || selectedChatRef.current?.id === senderId) {
        if (window.chatAreaDeleteHandler && !isCleaningUp) {
          window.chatAreaDeleteHandler(data);
        }
        
        // For active chat, delay the sidebar update to let animation complete
        setTimeout(() => {
          setChats(prevChats => {
            return prevChats.map(chat => {
              if (chat.id === chatId || chat.id === senderId) {
                return {
                  ...chat,
                  lastMessage: {
                    ...chat.lastMessage,
                    text: 'Message deleted',
                    time: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  }
                };
              }
              return chat;
            });
          });
        }, 800); // Match animation duration
      } else {
        // For non-active chats, update immediately
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat.id === chatId || chat.id === senderId) {
              return {
                ...chat,
                lastMessage: {
                  ...chat.lastMessage,
                  text: 'Message deleted',
                  time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                }
              };
            }
            return chat;
          });
        });
      }
    };

    // Handle message seen events
    const handleMessagesSeen = (data) => {
      if (isCleaningUp) return;
      
      const { senderId, receiverId } = data;
      
      // Clear notifications when messages are marked as seen
      if (senderId && receiverId === user.id) {
        setNotifications(prev => {
          const updated = { ...prev };
          delete updated[senderId];
          return updated;
        });
      }
      
      // Forward to ChatArea if it's for the current chat
      if (selectedChatRef.current?.id === senderId || selectedChatRef.current?.id === receiverId) {
        if (window.chatAreaSeenHandler && !isCleaningUp) {
          window.chatAreaSeenHandler(data);
        }
      }
    };

    // Handle unread message notifications
    const handleUnreadNotification = (data) => {
      if (isCleaningUp) return;
      
      const { senderId } = data;
      
      // Only update notification if it's not from the currently active chat
      if (selectedChatRef.current?.id !== senderId) {
        const now = Date.now();
        const lastUpdate = lastNotificationUpdate[senderId] || 0;
        
        // Debounce notifications to prevent double counting (500ms)
        if (now - lastUpdate > 500) {
          setLastNotificationUpdate(prev => ({ ...prev, [senderId]: now }));
          
          setNotifications(prev => {
            const currentCount = prev[senderId] || 0;
            return {
              ...prev,
              [senderId]: currentCount + 1
            };
          });
        }
      }
    };

    // Handle notifications cleared events
    const handleNotificationsCleared = (data) => {
      if (isCleaningUp) return;
      
      const { chatId } = data;
      
      setNotifications(prev => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });
    };

    // Set up socket event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_message', handleGlobalMessage);
    socket.on('message_deleted', handleGlobalMessageDeleted);
    socket.on('messages_seen', handleMessagesSeen);
    socket.on('unread_message_notification', handleUnreadNotification);
    socket.on('notifications_cleared', handleNotificationsCleared);
    socket.on('user_status_changed', handleSocketUserStatusChange);

    // Check if already connected
    if (socket.connected && !hasConnected) {
      handleConnect();
    }

    // Expose room management functions globally for child components
    window.chatSocketManager = {
      joinRoom: handleJoinChatRoom,
      leaveRoom: handleLeaveChatRoom,
      requestUserStatus: (userId, callback) => {
        if (socketConnectedRef.current && !isCleaningUp) {
          socket.emit('get_user_status', { userId }, callback);
        }
      },
      isConnected: () => socketConnectedRef.current && !isCleaningUp
    };

    // Expose message forwarding to ChatArea
    window.chatDashboardMessageForwarder = {
      forwardMessage: handleGlobalMessage,
      forwardDeletion: handleGlobalMessageDeleted,
      forwardSeen: handleMessagesSeen
    };

    // Cleanup function
    return () => {
      isCleaningUp = true;
      
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_message', handleGlobalMessage);
      socket.off('message_deleted', handleGlobalMessageDeleted);
      socket.off('messages_seen', handleMessagesSeen);
      socket.off('unread_message_notification', handleUnreadNotification);
      socket.off('notifications_cleared', handleNotificationsCleared);
      socket.off('user_status_changed', handleSocketUserStatusChange);
      
      // Clean up global manager
      delete window.chatSocketManager;
      delete window.chatDashboardMessageForwarder;
      
      hasConnected = false;
    };
  }, [user?.id]); // Only depend on user.id which is stable

  // Function to get user status
  const getUserStatus = useCallback((userId) => {
    return userStatuses[userId] || false;
  }, [userStatuses]);

  // Function to request user status updates
  const requestUserStatus = useCallback((userId) => {
    if (socketConnected && window.chatSocketManager) {
      window.chatSocketManager.requestUserStatus(userId, (response) => {
        if (response && !response.error) {
          setUserStatuses(prev => ({
            ...prev,
            [userId]: response.isOnline
          }));
          debouncedStatusUpdate(userId, response.isOnline);
        }
      });
    }
  }, [socketConnected, debouncedStatusUpdate]);

  // Clear notifications when a chat is selected
  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    setIsSidebarOpen(false);
    
    // Clear notifications for this chat
    if (notifications[chat.id]) {
      setNotifications(prev => {
        const updated = { ...prev };
        delete updated[chat.id];
        return updated;
      });

      // Mark messages as seen in the backend
      try {
        await messageAPI.markMessagesAsSeen(chat.id);
      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    }

    // Mark chat as read in sidebar
    setChats(prevChats => {
      return prevChats.map(c => {
        if (c.id === chat.id) {
          return {
            ...c,
            lastMessage: {
              ...c.lastMessage,
              isRead: true,
              unread: 0
            }
          };
        }
        return c;
      });
    });
  };

  // Add function to handle showing friend profile
  const handleShowUserProfile = (friendIdentifier) => {
    // If friendIdentifier is a string (username), find the chat data
    if (typeof friendIdentifier === 'string') {
      const chatData = chats.find(chat => 
        chat.username === friendIdentifier || 
        chat.name === friendIdentifier || 
        chat.id === friendIdentifier
      );
      
      if (chatData) {
        setSelectedFriend({
          ...chatData,
          username: chatData.username || chatData.name,
          name: chatData.name || chatData.username
        });
      } else {
        // Create basic friend data from identifier
        setSelectedFriend({
          username: friendIdentifier,
          name: friendIdentifier,
          id: `friend-${friendIdentifier}`
        });
      }
    } else {
      // If it's already an object, use it directly and include all profile data
      setSelectedFriend({
        ...friendIdentifier,
        username: friendIdentifier.username || friendIdentifier.name,
        name: friendIdentifier.name || friendIdentifier.username,
        bio: friendIdentifier.bio,
        profilePicture: friendIdentifier.profilePicture,
        email: friendIdentifier.email,
        online: friendIdentifier.online
      });
    }
    setShowFriendProfile(true);
  };

  // Callback function for sidebar status updates (used by Sidebar component)
  const handleChatOnlineStatusChange = useCallback((userId, isOnline) => {
    // Update the chats list with new online status
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === userId) {
          return { ...chat, online: isOnline };
        }
        return chat;
      });
    });

    // Also update selected chat if it matches
    setSelectedChat(prevChat => {
      if (prevChat && prevChat.id === userId) {
        return { ...prevChat, online: isOnline };
      }
      return prevChat;
    });
  }, []);

  // Callback function for ChatArea status updates (used by ChatArea component)
  const handleChatAreaUserStatusChange = useCallback((userId, isOnline) => {
    // Update the selected chat's online status
    setSelectedChat(prevChat => {
      if (prevChat && prevChat.id === userId) {
        return { ...prevChat, online: isOnline };
      }
      return prevChat;
    });
    
    // Also update in the chats list
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === userId) {
          return { ...chat, online: isOnline };
        }
        return chat;
      });
    });
  }, []);

  // Add state for sidebar refresh function
  const [sidebarRefreshFunction, setSidebarRefreshFunction] = useState(null);

  // Callback function to handle connection updates that should refresh sidebar
  const handleConnectionUpdateWithSidebarRefresh = useCallback(() => {
    loadConnections();
    
    // Also refresh sidebar connection requests
    if (sidebarRefreshFunction) {
      sidebarRefreshFunction();
    }
    
    if (selectedChat) {
      setCurrentChatMessages(prevMessages => {
        // Only keep messages that are not from the deleted connection
        return prevMessages.filter(msg => msg.sender !== selectedChat.friendId);
      });
    }
  }, [loadConnections, sidebarRefreshFunction, selectedChat]);

  // Add callback for profile updates
  const handleProfileUpdate = useCallback(() => {
    // Refresh user data in context
    if (user?.id) {
      // This will trigger a refresh of user data in the auth context
      window.location.reload(); // Simple approach to refresh user data
    }
  }, [user?.id]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200 relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden opacity-60 hover:opacity-100 fixed bottom-16 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {(isSidebarOpen || isDragging) && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          style={{
            opacity: window.innerWidth < 1024 ? Math.max(0, (sidebarTranslateX + 288) / 288 * 0.5) : isSidebarOpen ? 0.5 : 0
          }}
          onClick={() => {
            setIsSidebarOpen(false);
            setSidebarTranslateX(-288);
          }}
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`
          fixed lg:relative z-40 lg:z-auto
          w-72 lg:w-80 h-full
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          flex flex-col draggable-sidebar
          ${isDragging ? '' : 'transition-transform duration-300 ease-in-out'}
        `}
        style={{
          transform: window.innerWidth < 1024 
            ? `translateX(${sidebarTranslateX}px)` 
            : isSidebarOpen || window.innerWidth >= 1024 
              ? 'translateX(0)' 
              : 'translateX(-100%)'
        }}
        onMouseDown={handleMouseDown}
      >

        {/* Drag Handle - Only visible on mobile */}
        <div className="drag-handle lg:hidden absolute right-0 top-0 w-4 h-full bg-transparent cursor-grab active:cursor-grabbing z-10" />
        
        <Sidebar 
          selectedChat={selectedChat}
          setSelectedChat={handleChatSelect}
          setShowUserProfile={setShowUserProfile}
          setShowInvitationManager={setShowInvitationManager}
          setInvitationManagerTab={setInvitationManagerTab}
          notifications={notifications}
          chats={chats}
          onChatOnlineStatusChange={handleChatOnlineStatusChange}
          socketConnected={socketConnected}
          getUserStatus={getUserStatus}
          requestUserStatus={requestUserStatus}
          onRefreshReady={setSidebarRefreshFunction}
          isLoadingConnections={isLoadingConnections}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0 w-full lg:w-auto">
        {showUserProfile ? (
          <UserProfile 
            onClose={() => setShowUserProfile(false)} 
            onProfileUpdate={handleProfileUpdate}
          />
        ) : showInvitationManager ? (
          <InvitationManager 
            onClose={() => {
              setShowInvitationManager(false);
              setInvitationManagerTab('received');
            }}
            onSelectConnection={(chat) => {
              if (chat.showProfile) {
                setSelectedFriend({
                  username: chat.username,
                  name: chat.name,
                  id: `profile-${chat.username}`
                });
                setShowFriendProfile(true);
                setShowInvitationManager(false);
              } else {
                setSelectedChat(chat);
              }
            }}
            onConnectionUpdate={handleConnectionUpdateWithSidebarRefresh}
            tab={invitationManagerTab}
          />
        ) : showFriendProfile && selectedFriend ? (
          <FriendProfile 
            friendData={selectedFriend}
            username={selectedFriend?.username || selectedFriend?.name}
            onClose={() => setShowFriendProfile(false)}
            onStartChat={handleChatSelect}
            onChatSelect={handleChatSelect}
            currentUser={user}
          />
        ) : (
          <ChatArea 
            chat={selectedChat}
            onShowUserProfile={handleShowUserProfile}
            onMessagesUpdate={(messages) => {
              setCurrentChatMessages(messages);
            }}
            onUserStatusChange={handleChatAreaUserStatusChange}
            socketConnected={socketConnected}
            getUserStatus={getUserStatus}
            userStatuses={userStatuses}
          />
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;
