import React, { useState, useRef, useEffect } from 'react';
import socket from '../utils/socket';
import { useAuth } from '../context/useAuth';
import { messageAPI } from '../utils/api';
import { 
  Smile,
  Paperclip,
  Send,
  Brain,
  FileText,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  Image,
  Video,
  File,
  Download
} from 'lucide-react';

const ChatArea = ({ chat, onShowUserProfile, onMessagesUpdate, onUserStatusChange, socketConnected }) => {
  // ==================== STATE MANAGEMENT ====================
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showAIOptions, setShowAIOptions] = useState(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showChatSummaryOptions, setShowChatSummaryOptions] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);
  const [newMessage, setNewMessage] = useState(null);
  const [receivingMessage, setReceivingMessage] = useState(null);
  const [isUserOnline, setIsUserOnline] = useState(chat?.online || false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragTimeoutId, setDragTimeoutId] = useState(null);

  // ==================== REFS ====================
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  
  // Store latest values without causing re-renders
  const onUserStatusChangeRef = useRef(onUserStatusChange);
  const chatNameRef = useRef(chat?.name);
  const userUsernameRef = useRef(user?.username);

  // ==================== COMPUTED VALUES ====================
  const chatName = chat?.name || chat?.username || 'Unknown User';
  const chatAvatar = chat?.profilePicture || chat?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=random`;
  const chatId = chat?.id;

  // ==================== REF UPDATES ====================
  // Update refs when values change
  useEffect(() => {
    onUserStatusChangeRef.current = onUserStatusChange;
  }, [onUserStatusChange]);

  useEffect(() => {
    chatNameRef.current = chat?.name;
  }, [chat?.name]);

  useEffect(() => {
    userUsernameRef.current = user?.username;
  }, [user?.username]);

  // ==================== EMOJI CONFIGURATION ====================
  // Comprehensive emoji categories for picker
  const Emojis = {
    smileys: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️'
    ],
    gestures: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏'
    ],
    love: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌'
    ],
    animals: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒'
    ],
    food: [
      '🍎', '🍌', '🍊', '🍋', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥒'
    ]
  };

  // Frequently used emojis for quick access
  const frequentlyUsed = [
    '😀', '😂', '😍', '🥰', '😘', '😊', '😎', '🤩', '😭', '😤',
    '👍', '👎', '👏', '🙏', '❤️', '💕', '🔥', '💯', '🎉', '✨'
  ];

  // ==================== UTILITY FUNCTIONS ====================
  // Date formatting for message grouping
  const formatDateForDisplay = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const messageDateStart = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    const diffTime = todayStart - messageDateStart;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    return messageDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isDifferentDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getDate() !== d2.getDate() || 
           d1.getMonth() !== d2.getMonth() || 
           d1.getFullYear() !== d2.getFullYear();
  };

  const groupMessagesByDate = (messages) => {
    const grouped = [];
    let currentGroup = null;

    messages.forEach((msg, index) => {
      const prevMsg = index > 0 ? messages[index - 1] : null;
      
      if (!prevMsg || isDifferentDay(msg.timestamp, prevMsg.timestamp)) {
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        currentGroup = {
          dateLabel: formatDateForDisplay(msg.timestamp),
          messages: [msg]
        };
      } else {
        currentGroup.messages.push(msg);
      }
    });

    if (currentGroup) {
      grouped.push(currentGroup);
    }
    return grouped;
  };

  // ==================== FILE HANDLING FUNCTIONS ====================
  // Cloudinary link detection and parsing
  const parseCloudinaryContent = (text) => {
    // Regex to match Cloudinary URLs
    const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^\/]+\/[^\/]+\/upload\/[^\s]+/g;
    const matches = text.match(cloudinaryRegex);
    
    if (!matches) return { hasFile: false, text, fileUrl: null, fileType: null };
    
    const fileUrl = matches[0];
    
    // Determine file type based on extension
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    const videoExtensions = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i;
    const documentExtensions = /\.(pdf|doc|docx|txt|ppt|pptx|xls|xlsx)$/i;
    
    let fileType = 'document'; // default
    if (imageExtensions.test(fileUrl)) {
      fileType = 'image';
    } else if (videoExtensions.test(fileUrl)) {
      fileType = 'video';
    }
    
    // Remove the URL from text to get any remaining message
    const textWithoutUrl = text.replace(cloudinaryRegex, '').trim();
    
    return {
      hasFile: true,
      text: textWithoutUrl,
      fileUrl,
      fileType
    };
  };

  // Extract filename from Cloudinary URL
  const getFilenameFromUrl = (url) => {
    try {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const filenamePart = lastPart.split('.')[0];
      return filenamePart || 'file';
    } catch {
      return 'file';
    }
  };

  // Handle file download by opening in new tab
  const handleFileDownload = (url, filename) => {
    window.open(url, '_blank');
  };

  // ==================== DRAG & DROP HANDLERS ====================
  // Drag and drop functionality for file attachments
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any existing timeout
    if (dragTimeoutId) {
      clearTimeout(dragTimeoutId);
      setDragTimeoutId(null);
    }
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set a timeout to reset drag state as a fallback
    const timeoutId = setTimeout(() => {
      setIsDragOver(false);
      setDragTimeoutId(null);
    }, 100);
    setDragTimeoutId(timeoutId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear timeout if user is still dragging over
    if (dragTimeoutId) {
      clearTimeout(dragTimeoutId);
      setDragTimeoutId(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any timeouts
    if (dragTimeoutId) {
      clearTimeout(dragTimeoutId);
      setDragTimeoutId(null);
    }
    
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }

      // Determine file type and validate
      let fileType = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (!file.type.match(/\.(pdf|doc|docx|txt|ppt|pptx|xls|xlsx)$/i)) {
        // Check if it's a supported document type
        const supportedDocs = ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!supportedDocs.includes(fileExtension)) {
          alert('Unsupported file type. Please select an image, video, or document file.');
          return;
        }
      }

      setSelectedFile(file);
      setShowAttachmentMenu(false);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // ==================== COMPONENT LIFECYCLE ====================
  // Reset drag state when chat changes
  useEffect(() => {
    if (dragTimeoutId) {
      clearTimeout(dragTimeoutId);
    }
    setIsDragOver(false);
    setDragTimeoutId(null);
  }, [chat?.id]);

  // ==================== UI INTERACTION HANDLERS ====================
  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const maxHeight = 120;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      if (scrollHeight <= maxHeight) {
        textarea.style.height = scrollHeight + 'px';
        textarea.style.overflowY = 'hidden';
      } else {
        textarea.style.height = maxHeight + 'px';
        textarea.style.overflowY = 'auto';
      }
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setTimeout(adjustTextareaHeight, 0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAvatarClick = () => {
    if (onShowUserProfile) {
      // Pass more complete chat data including bio and profile information
      const friendData = {
        username: chat?.username || chat?.name,
        name: chat?.name || chat?.username,
        id: chat?.id || chat?.friendId,
        friendId: chat?.friendId,
        profilePicture: chat?.profilePicture,
        bio: chat?.bio,
        online: chat?.online || isUserOnline,
        avatar: chatAvatar
      };
      onShowUserProfile(friendData);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setDeletingMessage(messageId);
      
      // Call API to delete message
      await messageAPI.deleteMessage(messageId);
      
      // Emit socket event for real-time deletion
      socket.emit('delete_message', {
        messageId: messageId,
        chatId: chatId,
        senderId: user.id,
        roomId: chatId
      });
      
      // Keep the animation longer and handle removal after animation
      setTimeout(() => {
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
        setDeletingMessage(null);
        setShowMessageOptions(null);
      }, 800); // Increased from 300ms to 800ms for better animation visibility
      
    } catch (error) {
      console.error('Error deleting message:', error);
      setDeletingMessage(null);
    }
  };

  // Reset textarea height when message is sent
  useEffect(() => {
    if (message === '') {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
      }
    }
  }, [message]);

  // ==================== EVENT LISTENERS ====================
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close AI options
      if (showAIOptions !== null) {
        if (!event.target.closest('.ai-options-dropdown') && !event.target.closest('.ai-brain-button')) {
          setShowAIOptions(null);
        }
      }

      // Close emoji picker
      if (showEmojiPicker) {
        if (!event.target.closest('.emoji-picker') && !event.target.closest('button')) {
          setShowEmojiPicker(false);
        }
      }

      // Close message options
      if (showMessageOptions !== null) {
        if (!event.target.closest('.message-options-dropdown') && !event.target.closest('.message-options-button')) {
          setShowMessageOptions(null);
        }
      }

      // Close attachment menu
      if (showAttachmentMenu) {
        if (!event.target.closest('.attachment-menu') && !event.target.closest('.attachment-button')) {
          setShowAttachmentMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAIOptions, showEmojiPicker, showMessageOptions, showAttachmentMenu]);

  // Prevent default browser drag behavior globally
  useEffect(() => {
    const handleDocumentDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDocumentDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDocumentDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Reset drag state when dropping outside our drop zone
      if (dragTimeoutId) {
        clearTimeout(dragTimeoutId);
        setDragTimeoutId(null);
      }
      setIsDragOver(false);
    };

    const handleDocumentDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // If the drag leaves the entire document (e.target === document.body or null)
      if (e.target === document.body || e.target === document.documentElement || !e.target) {
        if (dragTimeoutId) {
          clearTimeout(dragTimeoutId);
          setDragTimeoutId(null);
        }
        setIsDragOver(false);
      }
    };

    // Add event listeners to prevent default drag behavior and handle edge cases
    document.addEventListener('dragenter', handleDocumentDragEnter);
    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('drop', handleDocumentDrop);
    document.addEventListener('dragleave', handleDocumentDragLeave);

    return () => {
      document.removeEventListener('dragenter', handleDocumentDragEnter);
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('drop', handleDocumentDrop);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
    };
  }, [dragTimeoutId]);

  // ==================== SOCKET MANAGEMENT ====================
  // Room management and socket connection handling
  useEffect(() => {
    if (!chat?.id || !socketConnected || !window.chatSocketManager) return;

    const chatId = chat.id;
    
    // Join room when component mounts or chat changes
    window.chatSocketManager.joinRoom(chatId);

    // Request initial status
    setTimeout(() => {
      window.chatSocketManager.requestUserStatus(chatId, (response) => {
        if (response && !response.error) {
          setIsUserOnline(response.isOnline);
          if (onUserStatusChange) {
            onUserStatusChange(chatId, response.isOnline);
          }
        }
      });
    }, 1000);

    return () => {
      // Leave room when component unmounts or chat changes
      if (window.chatSocketManager) {
        window.chatSocketManager.leaveRoom(chatId);
      }
    };
  }, [chat?.id, socketConnected, onUserStatusChange]);

  // Register real-time message handlers
  useEffect(() => {
    if (!chat?.id || !user?.id) return;

    const handleIncomingMessage = (messageData) => {
      const senderId = messageData.senderId || messageData.sender;
      const receiverId = messageData.receiverId || messageData.receiver;
      
      const isForCurrentChat = (
        (senderId === user.id && receiverId === chatId) ||
        (senderId === chatId && receiverId === user.id)
      );

      if (isForCurrentChat) {
        if (senderId === chatId) {
          setIsUserOnline(true);
          if (onUserStatusChangeRef.current) {
            onUserStatusChangeRef.current(chatId, true);
          }
        }

        const incomingMessage = {
          id: messageData._id || messageData.messageId || Date.now(),
          text: messageData.content || messageData.message,
          sender: senderId === user.id ? 'me' : 'other',
          time: new Date(messageData.timestamp || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: messageData.timestamp || Date.now(),
          name: senderId === user.id ? userUsernameRef.current : chatNameRef.current,
          isSeen: messageData.isSeen || false,
        };

        setReceivingMessage(incomingMessage.id);
        setMessages((prevMessages) => {
          const messageExists = prevMessages.some(msg => msg.id === incomingMessage.id);
          return messageExists ? prevMessages : [...prevMessages, incomingMessage];
        });

        setTimeout(() => setReceivingMessage(null), 1000);
      }
    };

    const handleMessageDeleted = (data) => {
      const { messageId, chatId: deleteChatId, senderId } = data;
      
      if (deleteChatId === chatId || senderId === chatId || deleteChatId === user.id) {
        if (deletingMessage === messageId) {
          return;
        }
        
        setDeletingMessage(messageId);
        setTimeout(() => {
          setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
          setDeletingMessage(null);
        }, 800);
      }
    };

    // Enhanced handler for message seen updates
    const handleMessageSeen = (data) => {
      const { senderId, receiverId, messageId, allMessages } = data;
      
      // Update seen status for messages sent by current user
      if (senderId === user.id && receiverId === chatId) {
        if (messageId && !allMessages) {
          // Mark specific message as seen
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === messageId && msg.sender === 'me' ? { ...msg, isSeen: true } : msg
            )
          );
        } else {
          // Mark all user's messages as seen
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.sender === 'me' ? { ...msg, isSeen: true } : msg
            )
          );
        }
      }
    };

    // Register handlers with global manager
    window.chatAreaMessageHandler = handleIncomingMessage;
    window.chatAreaDeleteHandler = handleMessageDeleted;
    window.chatAreaSeenHandler = handleMessageSeen;

    return () => {
      // Clean up handlers
      delete window.chatAreaMessageHandler;
      delete window.chatAreaDeleteHandler;
      delete window.chatAreaSeenHandler;
    };
  }, [chat?.id, user?.id, onUserStatusChange, chatId, deletingMessage]);

  // ==================== CHAT HISTORY MANAGEMENT ====================
  // Load chat history when chat changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (chatId) {
        try {
          const response = await messageAPI.getChatHistory(chatId);
          if (response.data && Array.isArray(response.data)) {
            const formattedMessages = response.data.map(msg => ({
              id: msg._id || msg.id,
              text: msg.content || msg.message,
              sender: msg.sender === user.id ? 'me' : 'other',
              time: new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp: msg.timestamp || msg.createdAt,
              createdAt: msg.createdAt,
              name: msg.sender === user.id ? user.username : chatName,
              isSeen: msg.isSeen || false,
            }));
            setMessages(formattedMessages);
            
            // Mark messages as seen when opening chat
            const unseenMessages = formattedMessages.filter(msg => 
              msg.sender === 'other' && !msg.isSeen
            );
            
            if (unseenMessages.length > 0) {
              setTimeout(async () => {
                try {
                  await messageAPI.markMessagesAsSeen(chatId);
                  // Update local state to mark messages as seen
                  setMessages(prevMessages => 
                    prevMessages.map(msg => 
                      msg.sender === 'other' ? { ...msg, isSeen: true } : msg
                    )
                  );
                } catch (error) {
                  console.error('Error marking messages as seen:', error);
                }
              }, 1000); // Delay to ensure room join is complete
            }
          } else {
            setMessages([]);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };

    loadChatHistory();
  }, [chatId, user?.id, user?.username, chatName]);

  // ==================== STATUS UPDATES ====================
  // Update online status from parent prop
  useEffect(() => {
    if (chat?.id && chat?.online !== undefined) {
      setIsUserOnline(chat.online);
    }
  }, [chat?.id, chat?.online]);

  // ==================== ROOM MANAGEMENT ====================
  // Room management - use global socket manager ONLY
  useEffect(() => {
    if (!chat?.id || !socketConnected || !window.chatSocketManager) return;

    const chatId = chat.id;
    
    // Join room when component mounts or chat changes
    window.chatSocketManager.joinRoom(chatId);

    // Request initial status
    setTimeout(() => {
      window.chatSocketManager.requestUserStatus(chatId, (response) => {
        if (response && !response.error) {
          setIsUserOnline(response.isOnline);
          if (onUserStatusChange) {
            onUserStatusChange(chatId, response.isOnline);
          }
        }
      });
    }, 1000);

    return () => {
      // Leave room when component unmounts or chat changes
      if (window.chatSocketManager) {
        window.chatSocketManager.leaveRoom(chatId);
      }
    };
  }, [chat?.id, socketConnected, onUserStatusChange]);

  // ==================== AUTO-SCROLL MANAGEMENT ====================
  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ==================== PARENT COMMUNICATION ====================
  // Update parent component when messages change
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
  }, [messages, onMessagesUpdate]);

  const handleFileSelect = (event, fileType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }

    // Validate file types
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (fileType === 'video' && !file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    setSelectedFile(file);
    setShowAttachmentMenu(false);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Reset input values
    event.target.value = '';
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // ==================== MESSAGE SENDING ====================
  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;

    let tempMessageId = null;
    let messageToSend = '';
    
    try {
      tempMessageId = `temp-${Date.now()}`;
      messageToSend = message;
      
      const tempMessage = {
        id: tempMessageId,
        text: selectedFile ? `📎 ${selectedFile.name}` : messageToSend,
        sender: 'me',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now(),
        name: user?.username,
        isSending: true,
        isSeen: false,
        isFile: !!selectedFile,
        fileType: selectedFile?.type,
        fileName: selectedFile?.name
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage(tempMessageId);
      setMessage('');
      
      // Prepare form data
      const formData = new FormData();
      formData.append('friendId', chatId);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      if (messageToSend.trim()) {
        formData.append('content', messageToSend.trim());
      }

      const response = await messageAPI.sendMessage(formData, true); // Pass true to indicate form data

      if (response.data) {
        const realMessage = {
          id: response.data._id || response.data.id || Date.now(),
          text: selectedFile ? `📎 ${selectedFile.name}` : response.data.content || messageToSend,
          sender: 'me',
          time: new Date(response.data.timestamp || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: response.data.timestamp || Date.now(),
          name: user?.username,
          isSending: false,
          isSeen: response.data.isSeen || false,
          isFile: !!selectedFile,
          fileType: selectedFile?.type,
          fileName: selectedFile?.name,
          fileUrl: response.data.fileUrl
        };

        setMessages((prev) => prev.map(msg => 
          msg.id === tempMessageId ? realMessage : msg
        ));

        // Use the global socket to emit message
        socket.emit('send_message', {
          messageId: realMessage.id,
          senderId: user.id,
          receiverId: chatId,
          content: realMessage.text,
          timestamp: realMessage.timestamp,
          roomId: chatId,
          isSeen: realMessage.isSeen,
          isFile: realMessage.isFile,
          fileType: realMessage.fileType,
          fileName: realMessage.fileName,
          fileUrl: realMessage.fileUrl
        });
      }

      // Clear file selection
      clearSelectedFile();
      setTimeout(() => setNewMessage(null), 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter(msg => msg.id !== tempMessageId));
      setMessage(messageToSend);
      setNewMessage(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ==================== AI INTEGRATION ====================
  const handleAIAction = async (messageId, action) => {
    let loadingId = null; // Declare loadingId at function scope
    
    try {
      setIsGeneratingAI(true);
      setShowAIOptions(null);

      const targetMessage = messages.find(msg => msg.id === messageId);
      if (!targetMessage) return;

      const prompt = action === 'summarize' 
        ? `Please provide a brief summary of this message: "${targetMessage.text}"`
        : `Please generate a thoughtful response to this message: "${targetMessage.text}"`;

      if (action === 'summarize') {
        // For summarize: Show loading message below all messages
        loadingId = `ai-${action}-${Date.now()}`;
        const loadingMessage = {
          id: loadingId,
          text: 'Analyzing message...',
          sender: 'other',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          name: 'AI Assistant',
          isAI: true,
          isLoading: true,
          isSummary: true
        };

        setMessages(prev => [...prev, loadingMessage]);
      }

      const response = await messageAPI.generateAIResponse(prompt);
      
      // Handle the actual API response structure: { "text": "..." }
      let aiResponseText = '';
      if (response?.text) {
        aiResponseText = response.text;
      } else if (response?.data?.text) {
        aiResponseText = response.data.text;
      } else if (typeof response === 'string') {
        aiResponseText = response;
      } else {
        aiResponseText = `AI ${action} completed successfully.`;
      }

      if (action === 'summarize') {
        // For summarize: Replace loading message with summary
        const aiMessage = {
          id: `ai-${action}-${Date.now()}`,
          text: aiResponseText,
          sender: 'other',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          name: 'AI Assistant',
          isAI: true,
          isLoading: false,
          isSummary: true
        };

        setMessages(prev => prev.map(msg => 
          msg.id === loadingId ? aiMessage : msg
        ));
      } else if (action === 'respond') {
        // For AI response: Put response in text area
        setMessage(aiResponseText);
        // Auto-resize the textarea
        setTimeout(() => {
          adjustTextareaHeight();
        }, 0);
      }

    } catch (error) {
      console.error('Error with AI action:', error);
      
      if (action === 'summarize' && loadingId) {
        // For summarize: Replace loading message with error
        const errorMessage = {
          id: loadingId,
          text: `Sorry, I couldn't summarize the message right now. Please try again later.`,
          sender: 'other',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          name: 'AI Assistant',
          isAI: true,
          isLoading: false,
          isSummary: true,
          isError: true
        };
        
        setMessages(prev => prev.map(msg => 
          msg.id === loadingId ? errorMessage : msg
        ));
      } else if (action === 'respond') {
        // For AI response: Show error in text area temporarily
        const originalMessage = message;
        setMessage('Sorry, I couldn\'t generate a response right now. Please try again later.');
        setTimeout(() => {
          setMessage(originalMessage);
        }, 3000);
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleChatSummarize = async (days) => {
    let loadingId = null; // Declare loadingId at function scope
    
    try {
      setIsGeneratingAI(true);
      setShowChatSummaryOptions(false);

      loadingId = `chat-summary-${Date.now()}`;
      const loadingMessage = {
        id: loadingId,
        text: `Analyzing last ${days} day${days > 1 ? 's' : ''} of conversation...`,
        sender: 'other',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now(),
        name: 'AI Assistant',
        isAI: true,
        isLoading: true,
        isSummary: true
      };

      setMessages(prev => [...prev, loadingMessage]);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentMessages = messages.filter(msg => 
        new Date(msg.timestamp) >= cutoffDate && !msg.isAI
      );

      if (recentMessages.length === 0) {
        const noMessagesMessage = {
          id: loadingId,
          text: `No messages found in the last ${days} day${days > 1 ? 's' : ''} to summarize.`,
          sender: 'other',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          name: 'AI Assistant',
          isAI: true,
          isLoading: false,
          isSummary: true
        };
        
        setMessages(prev => prev.map(msg => 
          msg.id === loadingId ? noMessagesMessage : msg
        ));
        return;
      }

      const conversationText = recentMessages
        .map(msg => `${msg.name}: ${msg.text}`)
        .join('\n');

      const prompt = `Please provide a comprehensive summary of this ${days}-day conversation:\n\n${conversationText}`;

      const response = await messageAPI.generateAIResponse(prompt);
      
      // Handle the actual API response structure: { "text": "..." }
      let aiResponseText = '';
      if (response?.text) {
        // Direct text property (your actual API structure)
        aiResponseText = response.text;
      } else if (response?.data?.text) {
        // Nested in data object
        aiResponseText = response.data.text;
      } else if (typeof response === 'string') {
        // Response as string
        aiResponseText = response;
      } else {
        aiResponseText = `Summary of last ${days} day${days > 1 ? 's' : ''} completed successfully.`;
      }

      const summaryMessage = {
        id: `chat-summary-${Date.now()}`,
        text: aiResponseText,
        sender: 'other',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now(),
        name: 'AI Assistant',
        isAI: true,
        isLoading: false,
        isSummary: true
      };

      setMessages(prev => prev.map(msg => 
        msg.id === loadingId ? summaryMessage : msg
      ));

    } catch (error) {
      console.error('Error generating chat summary:', error);
      
      // Create error message to replace loading message
      if (loadingId) {
        const errorMessage = {
          id: loadingId,
          text: `Sorry, I couldn't generate a summary right now. Please try again later.`,
          sender: 'other',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          name: 'AI Assistant',
          isAI: true,
          isLoading: false,
          isSummary: true,
          isError: true
        };
        
        setMessages(prev => prev.map(msg => 
          msg.id === loadingId ? errorMessage : msg
        ));
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateAIResponse = async () => {
    try {
      setIsGeneratingAI(true);
      setShowAIPrompt(false);

      const response = await messageAPI.generateAIResponse(aiPrompt);
      
      // Handle the actual API response structure: { "text": "..." }
      let aiResponseText = '';
      if (response?.text) {
        // Direct text property (your actual API structure)
        aiResponseText = response.text;
      } else if (response?.data?.text) {
        // Nested in data object
        aiResponseText = response.data.text;
      } else if (typeof response === 'string') {
        // Response as string
        aiResponseText = response;
      } else {
        aiResponseText = 'AI response generated successfully.';
      }

      // Put AI response directly in text area (like individual message AI response)
      setMessage(aiResponseText);
      // Auto-resize the textarea
      setTimeout(() => {
        adjustTextareaHeight();
      }, 0);

      setAiPrompt('');

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // For AI response: Show error in text area temporarily
      const originalMessage = message;
      setMessage('Sorry, I couldn\'t generate a response right now. Please try again later.');
      setTimeout(() => {
        setMessage(originalMessage);
      }, 3000);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ==================== COMPONENT RENDER ====================
  // Early return check after all hooks are called
  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Select a chat to start messaging
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a conversation from the sidebar to begin chatting
          </p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center space-x-4">
          <div 
            className="relative cursor-pointer group"
            onClick={handleAvatarClick}
          >
            <img
              src={chatAvatar}
              alt={chatName}
              className="w-10 h-10 rounded-full hover:ring-2 hover:ring-purple-500 transition-all duration-200 object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=random`;
              }}
            />
            {isUserOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 transition-colors duration-200 animate-pulse"></div>
            )}
          </div>
          <div 
            className="cursor-pointer"
            onClick={handleAvatarClick}
          >
            <h3 className="font-semibold text-gray-900 dark:text-white transition-colors duration-200 hover:text-purple-600 dark:hover:text-purple-400">
              {chatName}
            </h3>
            <p className={`text-sm transition-colors duration-200 ${
              isUserOnline 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {isUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 px-6 py-4 transition-colors duration-200 chat-scrollbar">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Separator */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4 transition-colors duration-200">
              <span className="px-3">{group.dateLabel}</span>
            </div>
            
            {/* Messages for this date */}
            {group.messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex transition-all duration-300 ease-out ${
                  deletingMessage === msg.id 
                    ? 'opacity-0 transform scale-80 -translate-y-4' 
                    : newMessage === msg.id
                    ? 'opacity-100 transform scale-100 translate-y-0 animate-slideFromLeft'
                    : receivingMessage === msg.id
                    ? 'opacity-100 transform scale-100 translate-y-0 animate-slideFromLeft'
                    : 'opacity-100 transform scale-100 translate-y-0'
                } ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg relative group transition-all duration-300 ease-out ${
                    msg.sender === 'me'
                      ? 'bg-emerald-200 dark:bg-emerald-900 text-gray-900 dark:text-white rounded-l-xl rounded-tr-xl rounded-br-sm'
                      : msg.isAI
                      ? msg.isLoading 
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-r-xl rounded-tl-xl rounded-bl-sm animate-pulse'
                        : msg.isSummary
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-r-xl rounded-tl-xl rounded-bl-sm  shadow-lg'
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-r-xl rounded-tl-xl rounded-bl-sm '
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-r-xl rounded-tl-xl rounded-bl-sm shadow-sm transition-colors duration-200'
                  } px-4 py-2 ${
                    deletingMessage === msg.id 
                      ? 'opacity-30 border-2 border-red-400 dark:border-red-500 animate-pulse scale-90' 
                      : newMessage === msg.id || receivingMessage === msg.id
                      ? 'shadow-lg'
                      : msg.isSending
                      ? 'opacity-80 animate-pulse'
                      : ''
                  }`}
                >
                  {/* Message Options Dropdown */}
                  {!msg.isAI && !msg.isLoading && !msg.isSending && (
                    <div className="absolute -top-2 -right-2 z-40">
                      <button
                        onClick={() => setShowMessageOptions(showMessageOptions === msg.id ? null : msg.id)}
                        className={`bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 message-options-button shadow-md ${
                          deletingMessage === msg.id ? 'bg-red-300 dark:bg-red-600 opacity-50' : ''
                        }`}
                        disabled={deletingMessage === msg.id}
                      >
                        <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                      </button>
                      
                      {showMessageOptions === msg.id && !deletingMessage && (
                        <div className={`absolute top-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg py-1 w-28 z-60 transition-all duration-200 message-options-dropdown ${
                          msg.sender === 'me' ? 'right-0' : 'left-0'
                        }`}>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="w-full px-2 py-1.5 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-1.5 text-xs transition-all duration-200 text-red-600 dark:text-red-400 hover:scale-105"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Options for other's messages */}
                  {msg.sender !== 'me' && !msg.isLoading && !msg.isAI && !deletingMessage && !msg.isSending && (
                    <div className="absolute -bottom-2 -right-2 z-30">
                      <button
                        onClick={() => setShowAIOptions(showAIOptions === msg.id ? null : msg.id)}
                        className="bg-blue-500 dark:bg-gray-600 hover:bg-blue-600 hover:dark:bg-blue-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ai-brain-button shadow-md"
                      >
                        <Brain className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}

                  {msg.isAI && (
                    <div className="flex items-center space-x-1 mb-1">
                      {msg.isLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                      ) : msg.isSummary ? (
                        <FileText className="w-3 h-3" />
                      ) : (
                        <Brain className="w-3 h-3" />
                      )}
                      <span className="text-xs opacity-75">
                        {msg.isLoading 
                          ? 'AI is thinking...' 
                          : msg.isSummary 
                          ? 'AI Summary' 
                          : msg.isGenerated 
                          ? 'AI Generated Response' 
                          : 'AI Assistant'
                        }
                      </span>
                    </div>
                  )}
                  
                  <div className={`text-sm break-words whitespace-pre-wrap transition-all duration-300 ${
                    deletingMessage === msg.id ? 'blur-sm opacity-50' : ''
                  }`}>
                    {msg.isLoading ? (
                      <span className="flex items-center space-x-1">
                        <span>{msg.text}</span>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </span>
                    ) : (() => {
                      // Parse message content for Cloudinary files
                      const parsedContent = parseCloudinaryContent(msg.text);
                      
                      if (parsedContent.hasFile) {
                        const filename = getFilenameFromUrl(parsedContent.fileUrl);
                        
                        return (
                          <div className="space-y-2">
                            {/* Display remaining text if any */}
                            {parsedContent.text && (
                              <div>{parsedContent.text}</div>
                            )}
                            
                            {/* File content based on type */}
                            {parsedContent.fileType === 'image' ? (
                              <div className="space-y-2">
                                <div className="relative">
                                  <img 
                                    src={parsedContent.fileUrl}
                                    alt="Shared image"
                                    className="max-w-full max-h-64 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
                                    onClick={() => window.open(parsedContent.fileUrl, '_blank')}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div 
                                    className="hidden items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-600 rounded-lg"
                                    style={{ display: 'none' }}
                                  >
                                    <Image className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Failed to load image</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleFileDownload(parsedContent.fileUrl, filename)}
                                  className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 hover:bg-white/30 dark:bg-gray-600/50 dark:hover:bg-gray-600/70 rounded-full text-xs transition-colors duration-200"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                              </div>
                            ) : (
                              // Video and document files
                              <div className="flex items-center space-x-3 p-3 bg-white/10 dark:bg-gray-600/30 rounded-lg">
                                <div className="flex-shrink-0">
                                  {parsedContent.fileType === 'video' ? (
                                    <Video className="w-6 h-6 text-blue-400" />
                                  ) : (
                                    <FileText className="w-6 h-6 text-green-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {parsedContent.fileType === 'video' ? 'Video File' : 'Document'}
                                  </p>
                                  <p className="text-xs opacity-75 truncate">{filename}</p>
                                </div>
                                <button
                                  onClick={() => handleFileDownload(parsedContent.fileUrl, filename)}
                                  className="flex-shrink-0 inline-flex items-center space-x-1 px-3 py-1 bg-white/20 hover:bg-white/30 dark:bg-gray-600/50 dark:hover:bg-gray-600/70 rounded-full text-xs transition-colors duration-200"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // If No file detected, render normal text
                      return msg.text;
                    })()}
                  </div>
                  
                  {/* AI Options Dropdown */}
                  {msg.sender !== 'me' && !msg.isLoading && !msg.isAI && !deletingMessage && !msg.isSending && showAIOptions === msg.id && (
                    <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-500/30 ai-options-dropdown">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleAIAction(msg.id, 'summarize')}
                          disabled={isGeneratingAI}
                          className="w-full px-2 py-1 text-left hover:bg-white/10 dark:hover:bg-gray-600/30 disabled:bg-gray-500/20 flex items-center space-x-1.5 text-xs transition-colors duration-200 rounded ai-option-button"
                        >
                          <FileText className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                          <span className="text-gray-700 dark:text-gray-200">
                            {isGeneratingAI ? 'Summarizing...' : 'Summarize Message'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleAIAction(msg.id, 'respond')}
                          disabled={isGeneratingAI}
                          className="w-full px-2 py-1 text-left hover:bg-white/10 dark:hover:bg-gray-600/30 disabled:bg-gray-500/20 flex items-center space-x-1.5 text-xs transition-colors duration-200 rounded ai-option-button"
                        >
                          <Brain className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                          <span className="text-gray-700 dark:text-gray-200">
                            {isGeneratingAI ? 'Generating...' : 'Generate Response'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`flex items-center justify-between mt-1 transition-all duration-300 ${
                    deletingMessage === msg.id ? 'blur-sm opacity-50' : ''
                  }`}>
                    <span className={`text-xs ${
                      msg.sender === 'me' ? 'text-gray-600 dark:text-gray-300 opacity-75 mr-2 -ml-1' :
                      msg.isAI ?
                      'text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                    } transition-colors duration-200`}>
                      {msg.time}
                    </span>
                    <div className="flex items-center space-x-1">
                      {msg.isSending && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white opacity-75"></div>
                      )}
                      {/* Message status indicators for sent messages */}
                      {msg.sender === 'me' && !msg.isSending && !msg.isAI && (
                        <div className="flex items-center">
                          {msg.isSeen ? (
                            // Double tick (seen) - blue overlapping ticks
                            <div className="relative flex items-center -mr-3">
                              <Check strokeWidth={3} className="w-3 h-3 text-blue-400"/>
                              <Check strokeWidth={3} className="w-3 h-3 text-blue-400 -ml-1.5" />
                            </div>
                          ) : (
                            // Single tick (sent but not seen) - gray tick
                            <Check strokeWidth={3} className="w-3 h-3 text-gray-400 bg-opacity-85 -mr-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div 
        ref={dropZoneRef}
        className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 transition-all duration-200 relative ${
          isDragOver ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 border-2 border-dashed border-blue-400 dark:border-blue-300 rounded-lg flex items-center justify-center z-20 backdrop-blur-sm">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-500 dark:bg-blue-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Paperclip className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
                Drop your file here
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Images, videos, and documents up to 10MB
              </p>
            </div>
          </div>
        )}
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                  {selectedFile.type.startsWith('video/') ? (
                    <Video className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <File className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={clearSelectedFile}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}

        <div className="flex items-end space-x-3">
          {/* Attachment Button (desktop only) */}
          <div className="relative hidden lg:block">
            <button 
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 flex-shrink-0 attachment-button"
            >
              <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            {showAttachmentMenu && (
              <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-2 w-48 z-10 attachment-menu">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Image className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-900 dark:text-white">Image</span>
                </button>
                
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Video className="w-5 h-5 text-green-500" />
                  <span className="text-gray-900 dark:text-white">Video</span>
                </button>
                
                <button
                  onClick={() => documentInputRef.current?.click()}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-900 dark:text-white">Document</span>
                </button>
              </div>
            )}
            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'image')}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleFileSelect(e, 'video')}
              className="hidden"
            />
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
              onChange={(e) => handleFileSelect(e, 'document')}
              className="hidden"
            />
          </div>

          <div className={`flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 transition-all duration-200 min-h-[44px] flex items-center ${
            isGeneratingAI ? 'opacity-75' : ''
          } ${
            isDragOver ? 'bg-blue-100 dark:bg-blue-800/30 border-2 border-blue-300 dark:border-blue-500' : ''
          }`}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              placeholder={
                isDragOver 
                  ? "Drop files here or type your message..." 
                  : isGeneratingAI 
                  ? "AI is generating response..." 
                  : "Type your message here or drag files to attach"
              }
              disabled={isGeneratingAI}
              className="w-full bg-transparent resize-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 leading-6 input-scrollbar disabled:cursor-not-allowed"
              style={{
                minHeight: '24px',
                maxHeight: '120px',
                overflowY: 'hidden'
              }}
              rows="1"
            />
            {isGeneratingAI && (
              <div className="ml-2 flex-shrink-0">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              </div>
            )}

            {/* Mobile: Single merged button */}
            <div className="relative block lg:hidden ml-2">
              <button
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 flex-shrink-0 attachment-button"
                aria-label="Open attachments and emoji"
              >
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              {showAttachmentMenu && (
                <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-2 w-72 z-20 attachment-menu">
                  {/* Attachments Section */}
                  <div className="border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 px-3 py-1 mb-1">
                      ATTACHMENTS
                    </h4>
                    <button
                      onClick={() => {
                        imageInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Image className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-900 dark:text-white">Image</span>
                    </button>
                    <button
                      onClick={() => {
                        videoInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Video className="w-5 h-5 text-green-500" />
                      <span className="text-gray-900 dark:text-white">Video</span>
                    </button>
                    <button
                      onClick={() => {
                        documentInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <FileText className="w-5 h-5 text-purple-500" />
                      <span className="text-gray-900 dark:text-white">Document</span>
                    </button>
                  </div>
                  {/* Emojis Section */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 px-3 py-1 mb-2">
                      EMOJIS
                    </h4>
                    <div className="mb-3 px-3">
                      <div className="grid grid-cols-8 gap-1">
                        {frequentlyUsed.slice(0, 16).map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              handleEmojiSelect(emoji);
                              setShowAttachmentMenu(false);
                            }}
                            className="w-6 h-6 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200 flex items-center justify-center"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto emoji-picker-scrollbar px-3">
                      {Object.entries(Emojis).map(([category, emojis]) => (
                        <div key={category} className="mb-2">
                          <div className="grid grid-cols-8 gap-1">
                            {emojis.slice(0, 16).map((emoji, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  handleEmojiSelect(emoji);
                                  setShowAttachmentMenu(false);
                                }}
                                className="w-6 h-6 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200 flex items-center justify-center"
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hidden file inputs (shared for both desktop and mobile) */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'image')}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileSelect(e, 'video')}
            className="hidden"
          />
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
            onChange={(e) => handleFileSelect(e, 'document')}
            className="hidden"
          />

          {/* Emoji Button (desktop only, right of textarea) */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 flex-shrink-0"
            >
              <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-4 w-96 max-h-80 overflow-y-auto transition-colors duration-200 emoji-picker emoji-picker-scrollbar z-10">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                    <span className="mr-2">⭐</span>
                    Frequently Used
                  </h4>
                  <div className="grid grid-cols-10 gap-1">
                    {frequentlyUsed.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200 flex items-center justify-center"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                {Object.entries(Emojis).map(([category, emojis]) => (
                  <div key={category} className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                      <span className="mr-2">{emojis[0]}</span>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h4>
                    <div className="grid grid-cols-10 gap-1">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200 flex items-center justify-center"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowAIMenu(true)}
            disabled={isGeneratingAI}
            className="p-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 dark:disabled:bg-purple-700 rounded-full transition-colors duration-200 flex-shrink-0"
            title="AI Features"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={(!message.trim() && !selectedFile) || isGeneratingAI}
            className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-full transition-colors duration-200 flex-shrink-0"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* AI Menu Modal */}
      {showAIMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 transition-colors duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-semibold">AI Features</h3>
              </div>
              <button
                onClick={() => setShowAIMenu(false)}
                className="p-1 hover:bg-slate-500 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <button
                onClick={() => {
                  setShowAIMenu(false);
                  setShowChatSummaryOptions(true);
                }}
                className="w-full p-3 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 flex items-center justify-between shadow-md hover:shadow-lg transform hover:scale-[1.02] border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <h4 className="font-semibold">Summarize Chat</h4>
                    <p className="text-sm opacity-90">Get AI summary of recent messages</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAIMenu(false);
                  setShowAIPrompt(true);
                }}
                className="w-full p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center justify-between shadow-md hover:shadow-lg transform hover:scale-[1.02] border border-indigo-400/20"
              >
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5" />
                  <div className="text-left">
                    <h4 className="font-semibold">Generate Response</h4>
                    <p className="text-sm opacity-90">Create AI response with custom prompt</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Summary Options Modal */}
      {showChatSummaryOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 transition-colors duration-200">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Chat Summary</h3>
              </div>
              <button
                onClick={() => setShowChatSummaryOptions(false)}
                className="p-1 hover:bg-slate-500 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                Select the time period for chat summary:
              </p>
              <div className="space-y-2">  
                {[{ days: 1, label: 'Today', subtitle: 'Last 24 hours', gradient: 'from-emerald-500 to-emerald-600', hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700' },
                  { days: 2, label: 'Last 2 Days', subtitle: '48 hours', gradient: 'from-blue-500 to-blue-600', hoverGradient: 'hover:from-blue-600 hover:to-blue-700' },
                  { days: 3, label: 'Last 3 Days', subtitle: '72 hours', gradient: 'from-indigo-500 to-indigo-600', hoverGradient: 'hover:from-indigo-600 hover:to-indigo-700' },
                  { days: 7, label: 'Last Week', subtitle: '7 days', gradient: 'from-purple-500 to-purple-600', hoverGradient: 'hover:from-purple-600 hover:to-purple-700' },
                  { days: 14, label: 'Last 2 Weeks', subtitle: '14 days', gradient: 'from-pink-500 to-pink-600', hoverGradient: 'hover:from-pink-600 hover:to-pink-700' },
                  { days: 30, label: 'Last Month', subtitle: '30 days', gradient: 'from-slate-500 to-slate-600', hoverGradient: 'hover:from-slate-600 hover:to-slate-700' }
                ].map((option) => (
                  <button
                    key={option.days}
                    onClick={() => handleChatSummarize(option.days)}
                    disabled={isGeneratingAI}
                    className={`w-full p-3 bg-gradient-to-r ${option.gradient} ${option.hoverGradient} disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 flex items-center justify-between shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:hover:scale-100 border border-white/10`}
                  >
                    <div className="text-left">
                      <h4 className="font-semibold">{option.label}</h4>
                      <p className="text-sm opacity-90">{option.subtitle}</p>
                    </div>
                    {isGeneratingAI && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt Modal */}
      {showAIPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 transition-colors duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Generate AI Response</h3>
              </div>
              <button
                onClick={() => setShowAIPrompt(false)}
                className="p-1 hover:bg-indigo-500 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your prompt for AI to generate a response:
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., 'Help me write a professional response about project timelines' or 'Generate a creative idea for logo design'"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 min-h-[100px] resize-none input-scrollbar"
                  rows="4"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI will generate a contextual response based on your prompt
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAIPrompt(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateAIResponse}
                    disabled={!aiPrompt.trim() || isGeneratingAI}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 dark:disabled:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;