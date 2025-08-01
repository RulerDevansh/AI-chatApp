import axios from 'axios';

const api = axios.create({
  // baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/user`,
  baseURL: `http://localhost:8000/api/user`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  // Update Bio
  updateBio: async (bio) => {
    const response = await api.post('/updateBio', { bio });
    return response.data;
  },

  // Update Profile Picture
  updateProfilePicture: async (formData) => {
    const response = await api.post('/updateProfilePicture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update Password
  updatePassword: async (passwordData) => {
    const response = await api.post('/updatePassword', passwordData);
    return response.data;
  }
};

// Message API
export const messageAPI = {
  // Generate AI Response
  generateAIResponse: async (content) => {
    try {
      const response = await api.post('/aiResponse', { content });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send Message
  sendMessage: async (data, isFormData = false) => {
    if (isFormData) {
      const response = await api.post('/sendMessage', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const { friendId, content } = data;
      const response = await api.post('/sendMessage', { friendId, content });
      return response.data;
    }
  },
  
  // Get Chat History
  getChatHistory: async (friendId) => {
    const response = await api.post('/chatHistory', { friendId });
    return response.data;
  },
  
  // Get Recent Chats
  getRecentChats: async () => {
    const response = await api.get('/connectionList');
    return response.data;
  },

  // Delete Message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.post('/deleteMessage', { messageId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark Messages as Seen
  markMessagesAsSeen: async (senderId) => {
    try {
      const response = await api.post('/markMsgSeen', { senderId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Connection API
export const connectionAPI = {
  // Get Connection List
  getConnectionList: async () => {
    const response = await api.get('/connectionList');
    return response.data;
  },
  
  // Send Connection Request
  sendConnectionRequest: async (username) => {
    const response = await api.post('/connectionRequest', { username });
    return response.data;
  },
  
  // Get Friend Profile
  getFriendProfile: async (usernameOrId) => {
    try {
      const response = await api.post('/friendProfile', { username: usernameOrId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get Invitations Sent
  getInvitationsSent: async () => {
    try {
      const response = await api.get('/invitationSent');
      const sentData = response.data;
      
      if (sentData.data && Array.isArray(sentData.data)) {
        const processedRequests = sentData.data.map(request => {
          return {
            ...request,
            receiverUsername: request.receiverUsername || 'Unknown User',
            receiver: {
              username: request.receiverUsername || 'Unknown User',
              email: '',
              id: request.receiver
            },
            to: {
              username: request.receiverUsername || 'Unknown User',
              email: '',
              id: request.receiver
            },
            status: request.status || 'pending'
          };
        });
        
        return { data: processedRequests };
      }
      return { data: [] };
    } catch (error) {
      throw error;
    }
  },
  
  // Get Invitations Received
  getInvitationsReceived: async () => {
    try {
      const response = await api.get('/invitationReceived');
      const receivedData = response.data;
      
      if (receivedData.data && Array.isArray(receivedData.data)) {
        const processedRequests = receivedData.data.map(request => {
          return {
            ...request,
            senderUsername: request.senderUsername || 'Unknown User',
            sender: {
              username: request.senderUsername || 'Unknown User',
              email: '',
              id: request.sender
            },
            from: {
              username: request.senderUsername || 'Unknown User',
              email: '',
              id: request.sender
            }
          };
        });
        
        return { data: processedRequests };
      }
      return { data: [] };
    } catch (error) {
      throw error;
    }
  },
  
  // Accept Invitation
  acceptInvitation: async (username) => {
    try {
      const response = await api.post('/acceptInvitation', { username });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search Users
  searchUsers: async (username) => {
    try {
      const response = await api.post('/friendProfile', { username });
      if (response.data && response.data.username) {
        return { data: [{ id: response.data.userId, username: response.data.username }] };
      }
      return { data: [] };
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: [] };
      }
      throw error;
    }
  },

  // Reject Invitation
  rejectInvitation: async (friendId) => {
    try {
      const response = await api.post('/rejectInvitation', { friendId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Withdraw Connection Request
  withdrawConnectionRequest: async (friendId) => {
    try {
      const response = await api.post('/withdrawConnectionRequest', { friendId });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;
