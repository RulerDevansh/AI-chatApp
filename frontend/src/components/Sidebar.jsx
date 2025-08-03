import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { connectionAPI } from '../utils/api';
import { 
  Search, 
  MoreVertical, 
  Settings,
  LogOut,
  Sun,
  Moon,
  Users,
} from 'lucide-react';

const Sidebar = ({ 
  selectedChat, 
  setSelectedChat, 
  setShowUserProfile, 
  setShowInvitationManager, 
  setInvitationManagerTab,
  notifications = {},
  chats = [],
  onRefreshReady,
  onChatOnlineStatusChange,
  socketConnected,
  getUserStatus,
  requestUserStatus,
  isLoadingConnections = false
}) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [hasUnreadRequests, setHasUnreadRequests] = useState(false);
  const [localChats, setLocalChats] = useState(chats);
  const [statusRequestCooldown, setStatusRequestCooldown] = useState(new Set());
  const menuRef = useRef(null);

  // Refs to avoid re-render dependencies
  const onChatOnlineStatusChangeRef = useRef(onChatOnlineStatusChange);

  // Update ref when callback changes
  useEffect(() => {
    onChatOnlineStatusChangeRef.current = onChatOnlineStatusChange;
  }, [onChatOnlineStatusChange]);

  // Update local chats when parent chats change
  useEffect(() => {
    setLocalChats(chats);
  }, [chats]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  useEffect(() => {
    if (user) {
      fetchConnectionRequests();
    }
  }, [user]);

  // Pass refresh function to parent
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(() => fetchConnectionRequests);
    }
  }, [onRefreshReady]);

  // Request status updates when chats change or socket connects
  useEffect(() => {
    if (!socketConnected || chats.length === 0 || !requestUserStatus) return;

    const requestStatusesTimeout = setTimeout(() => {
      chats.forEach(chat => {
        if (!statusRequestCooldown.has(chat.id)) {
          setStatusRequestCooldown(prev => new Set([...prev, chat.id]));
          
          requestUserStatus(chat.id);

          // Remove from cooldown after 5 seconds
          setTimeout(() => {
            setStatusRequestCooldown(prev => {
              const newSet = new Set(prev);
              newSet.delete(chat.id);
              return newSet;
            });
          }, 5000);
        }
      });
    }, 2000);

    return () => {
      clearTimeout(requestStatusesTimeout);
    };
  }, [socketConnected, chats, requestUserStatus, statusRequestCooldown]);

  // Update local chats with status from parent - maintain online status properly
  useEffect(() => {
    if (getUserStatus) {
      setLocalChats(prevChats => 
        prevChats.map(chat => {
          const currentOnlineStatus = getUserStatus(chat.id);
          // Only update if we have a valid status response
          return {
            ...chat,
            online: currentOnlineStatus !== undefined ? currentOnlineStatus : chat.online
          };
        })
      );
    }
  }, [getUserStatus]); // Remove chats dependency to prevent unnecessary updates

  const fetchConnectionRequests = async () => {
    try {
      const [sentResponse, receivedResponse] = await Promise.all([
        connectionAPI.getInvitationsSent(),
        connectionAPI.getInvitationsReceived()
      ]);
      
      const sentData = sentResponse.data || [];
      const receivedData = receivedResponse.data || [];
      
      setSentRequests(sentData);
      setReceivedRequests(receivedData);
      setHasUnreadRequests(sentData.length > 0 || receivedData.length > 0);
      
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      setSentRequests([]);
      setReceivedRequests([]);
      setHasUnreadRequests(false);
    }
  };

  const handleOpenConnectionRequests = () => {
    setInvitationManagerTab('received');
    setShowInvitationManager(true);
    setHasUnreadRequests(false);
    setShowMenu(false);
  };

  // Use localChats for filtering
  const filteredChats = localChats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserInitials = () => {
    const name = user?.name || user?.username || 'User';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    }
    return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.charAt(0).toUpperCase();
  };

  const getProfilePictureUrl = () => {
    if (user?.profilePicture) {
      return user.profilePicture;
    }
    
    const name = user?.name || user?.username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
  };

  const getTruncatedEmail = () => {
    if (!user?.email) return 'user@example.com';
    return user.email.length > 20 ? `${user.email.substring(0, 17)}...` : user.email;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sidebar-header bg-gray-800 dark:bg-gray-900 text-white p-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
            {user?.profilePicture ? (
              <img
                src={getProfilePictureUrl()}
                alt={user?.username || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span 
              className="text-white text-lg font-bold"
              style={{ display: user?.profilePicture ? 'none' : 'flex' }}
            >
              {getUserInitials()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold">{user?.name || user?.username}</h2>
            <p 
              className="text-sm text-gray-300 dark:text-gray-400 transition-colors duration-200 cursor-default"
              title={user?.email || 'user@example.com'}
            >
              {getTruncatedEmail()}
            </p>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-700 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-12 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg shadow-lg py-2 w-48 z-10 transition-colors duration-200">
              <button
                onClick={toggleTheme}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 transition-colors duration-200"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
    
              <button 
                onClick={() => {
                  setShowUserProfile(true);
                  setShowInvitationManager(false);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 transition-colors duration-200"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              
              <hr className="my-1 border-gray-200 dark:border-gray-600" />
              
              <button 
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Logout error:', error);
                  } finally {
                    window.location.href = '/login';
                  }
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2 text-red-600 dark:text-red-400 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        {/* Connections Section */}
        <div className="mb-4">
          <button
            onClick={handleOpenConnectionRequests}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="relative">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              {hasUnreadRequests && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {receivedRequests.length + sentRequests.length}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">Connections</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {receivedRequests.length} received • {sentRequests.length} sent
              </p>
            </div>
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
          />
        </div>
      </div>

      {/* Chat Section */}
      <div className="px-4 py-2">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 transition-colors duration-200">Chat</h3>
      </div>

      {/* Chat List */}
      <div className="chat-list-container flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoadingConnections ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-3"></div>
            <p className="text-sm">Loading your chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setSelectedChat(chat);
                setShowInvitationManager(false);
              }}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 transition-colors duration-200 ${
                selectedChat?.id === chat.id 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'User')}&background=random`}
                    alt={chat.name || 'User'}
                    className="w-12 h-12 rounded-full"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'User')}&background=random`;
                    }}
                  />
                  {chat.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate transition-colors duration-200">
                      {chat.name || 'Unknown User'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                        {chat.lastMessage?.time || chat.time || ''}
                      </span>
                      {notifications[chat.id] && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center font-medium">
                          {notifications[chat.id] > 99 ? '99+' : notifications[chat.id]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate transition-colors duration-200 ${
                      chat.lastMessage?.isRead !== false && selectedChat?.id !== chat.id
                        ? 'text-gray-600 dark:text-gray-300'
                        : 'text-gray-900 dark:text-white font-medium'
                    }`}>
                      {chat.lastMessage?.text || 'Start a conversation!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
