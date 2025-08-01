# AIChat - Intelligent Web Chat Application

A modern, feature-rich real-time chat application built with React and Node.js, featuring AI-powered assistance, file sharing, and comprehensive user management.

<div align="center">

![AIChat Banner](https://img.shields.io/badge/AIChat-Smart%20Messaging%20Platform-4ADE80?style=for-the-badge&labelColor=1F2937&color=4ADE80)

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

</div>

## 🚀 Features

### 💬 **Real-time Messaging**
- Instant messaging with Socket.IO
- Message status indicators (sent, seen)
- Real-time user presence and online status

### 🤖 **AI Integration**
- **Google Gemini API** powered AI assistant
- Smart contextual responses with custom prompts
- Chat summarization and Response for different time periods (1 day, 1 week, 1 month)
- Summarization and Response for individual messages.

### 📁 **File Sharing**
- **Cloudinary** integration for file storage
- Support for images, videos, and documents
- File preview before sending
- Drag-and-drop file upload
- File size validation (10MB limit for messages, 5MB for profile pictures)
- Automatic file type detection and display

### 👥 **User Management**
- User registration and authentication with **JWT tokens**
- Profile picture upload and management
- Bio customization
- Password change functionality with current password verification
- Email-based user identification

### 🔗 **Connection System**
- Send and receive connection requests
- Accept/reject invitation system
- Connection management dashboard
- Real-time connection status updates
- Search users by username

### 🎨 **Modern UI/UX**
- **Tailwind CSS** for responsive design
- Dark/Light theme toggle with system preference detection
- Smooth animations and transitions
- Mobile-responsive design with touch gestures
- Custom scrollbar styling
- Gradient backgrounds and modern card layouts

### 🔐 **Security Features**
- **bcrypt** password hashing
- JWT token-based authentication
- Input validation and sanitization
- Secure file upload handling
- CORS protection

## 🌐 Socket.IO Events

### Client Events
- `join_user_room` - Join user's personal room
- `join_chat_room` - Join specific chat room
- `leave_chat_room` - Leave chat room
- `send_message` - Send real-time message
- `request_user_status` - Request user online status

### Server Events
- `receive_message` - Receive new message
- `message_deleted` - Message deletion notification
- `messages_seen` - Message read confirmation
- `user_status_changed` - User online/offline status
- `user_status_response` - Response to status request



## 📋 API Endpoints

### Authentication
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/user/profile` - Get user profile

### User Management
- `POST /api/user/updateBio` - Update user bio
- `POST /api/user/updateProfilePicture` - Upload profile picture
- `POST /api/user/updatePassword` - Change password

### Connections
- `POST /api/user/connectionRequest` - Send connection request
- `GET /api/user/invitationSent` - Get sent invitations
- `GET /api/user/invitationReceived` - Get received invitations
- `POST /api/user/acceptInvitation` - Accept connection request
- `POST /api/user/rejectInvitation` - Reject connection request
- `GET /api/user/connectionList` - Get user connections

### Messaging
- `POST /api/user/sendMessage` - Send message/file
- `POST /api/user/chatHistory` - Get chat history
- `POST /api/user/deleteMessage` - Delete message
- `POST /api/user/markMsgSeen` - Mark messages as seen

### AI Features
- `POST /api/user/aiResponse` - Generate AI response



## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 19.1.0 |
| **Vite** | Build Tool & Dev Server | 7.0.4 |
| **Tailwind CSS** | Styling Framework | 3.4.17 |
| **Socket.IO Client** | Real-time Communication | 4.8.1 |
| **Axios** | HTTP Client | 1.10.0 |
| **React Router DOM** | Client-side Routing | 7.6.3 |
| **Lucide React** | Icon Library | 0.525.0 |
| **PostCSS** | CSS Processing | 8.5.6 |
| **Autoprefixer** | CSS Vendor Prefixes | 10.4.21 |
| **ESLint** | Code Linting | 9.30.1 |

### **Backend**
| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | - |
| **Express.js** | Web Framework | 5.1.0 |
| **Socket.IO** | Real-time Communication | 4.8.1 |
| **MongoDB** | Database | - |
| **Mongoose** | ODM for MongoDB | 8.16.0 |
| **JWT** | Authentication | 9.0.2 |
| **bcrypt** | Password Hashing | 6.0.0 |
| **Cloudinary** | File Storage & Management | 2.7.0 |
| **Multer** | File Upload Handling | 2.0.2 |
| **Google Generative AI** | AI Integration | 1.10.0 |
| **CORS** | Cross-Origin Resource Sharing | 2.8.5 |
| **Cookie Parser** | Cookie Handling | 1.4.7 |
| **dotenv** | Environment Configuration | 16.5.0 |
| **Nodemon** | Development Server | 3.1.10 |

## 🔄 Future Enhancements

- [ ] **Group Chat Support**: Multi-user chat rooms
- [ ] **Voice Messages**: Audio recording and playback
- [ ] **Message Reactions**: Emoji reactions to messages
- [ ] **Message Search**: Full-text search across chat history
- [ ] **Push Notifications**: Browser and mobile notifications
- [ ] **Message Encryption**: End-to-end encryption for privacy
- [ ] **Video Calling**: WebRTC integration for video calls
- [ ] **Bot Integration**: Custom chatbot development
- [ ] **Message Scheduling**: Schedule messages for later delivery
- [ ] **Advanced AI Features**: Context-aware conversations

## 📄 License

This project is licensed under the ISC License - see the package.json files for details.

## 👨‍💻 Author

**Devansh** - Full Stack Developer
