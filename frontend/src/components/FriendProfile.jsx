import React, { useState, useEffect } from 'react';
import { connectionAPI } from '../utils/api';
import { 
  User, 
  ArrowLeft, 
  MessageCircle, 
  UserPlus, 
  UserCheck,
  Loader,
  UserX,
  Phone,
  MapPin,
  Clock,
  X
} from 'lucide-react';

const FriendProfile = ({ username, friendData, onClose, onStartChat, onChatSelect, currentUser }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [avatarError, setAvatarError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Use username prop or extract from friendData
  const actualUsername = username || friendData?.username;
  const isCurrentUser = currentUser && (actualUsername === currentUser.username || actualUsername === currentUser.name);

  useEffect(() => {
    const loadData = async () => {
      if (actualUsername) {
        await loadProfile();
        if (!isCurrentUser) {
          await checkConnectionStatus();
        }
      }
    };
    loadData();
  }, [actualUsername, isCurrentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If this is the current user, use their data from context
      if (isCurrentUser && currentUser) {
        const avatarUrl = currentUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username || currentUser.name)}&background=random&color=fff&size=128`;
        
        setProfile({
          username: currentUser.username,
          name: currentUser.username || currentUser.name,
          bio: currentUser.bio || 'Hey there! I am using ChatApp.',
          avatar: avatarUrl,
          profilePicture: currentUser.profilePicture,
          isOnline: true, // Current user is always "online"
          userId: currentUser.id
        });
        return;
      }
      
      // If we have friendData already, use it
      if (friendData && friendData.name) {
        const avatarUrl = friendData.profilePicture || friendData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendData.name)}&background=random&color=fff&size=128`;
        
        setProfile({
          username: friendData.username || friendData.name,
          name: friendData.name,
          bio: friendData.bio || 'Hey there! I am using ChatApp.',
          avatar: avatarUrl,
          profilePicture: friendData.profilePicture,
          isOnline: friendData.online || false,
          userId: friendData.id || friendData.friendId
        });
        return;
      }
      
      // Try to get profile from API
      try {
        const response = await connectionAPI.getFriendProfile(actualUsername);
        const profileData = response.data || response;
        
        // Use profilePicture from backend if available, otherwise fall back to generated avatar
        let avatarUrl;
        if (profileData.profilePicture) {
          avatarUrl = profileData.profilePicture;
        } else {
          avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || actualUsername)}&background=random&color=fff&size=128`;
        }
        
        setProfile({
          ...profileData,
          avatar: avatarUrl,
          bio: profileData.bio || 'Hey there! I am using ChatApp.'
        });
      } catch (apiError) {
        console.error('API profile fetch failed, using basic info:', apiError);
        // If API fails, create a basic profile from the username
        setProfile({
          username: actualUsername,
          name: actualUsername,
          bio: 'Hey there! I am using ChatApp.',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(actualUsername)}&background=random&color=fff&size=128`,
          isOnline: false
        });
      }
    } catch (error) {
      console.error('Error loading friend profile:', error);
      setError(error.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      // Check if this user is in our connections
      const connectionsResponse = await connectionAPI.getConnectionList();
      const connections = connectionsResponse.data || [];
      
      const isConnected = connections.some(conn => 
        conn.friendName === username
      );
      
      if (isConnected) {
        setConnectionStatus('connected');
        return;
      }

      // Check if we've sent a request to this user
      const sentResponse = await connectionAPI.getInvitationsSent();
      const sentRequests = sentResponse.data || [];
      
      const hasPendingRequest = sentRequests.some(req => 
        req.receiverUsername === username || req.receiver?.username === username
      );
      
      if (hasPendingRequest) {
        setConnectionStatus('pending');
        return;
      }

      setConnectionStatus('none');
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('none');
    }
  };

  const handleSendRequest = async () => {
    try {
      setActionLoading(true);
      await connectionAPI.sendConnectionRequest(username);
      setConnectionStatus('pending');
      alert('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert(error.response?.data?.error || 'Failed to send connection request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    // Use onStartChat if available, otherwise use onChatSelect
    const chatSelectFunction = onStartChat || onChatSelect;
    
    if (chatSelectFunction && profile) {
      const chatData = {
        id: profile.userId || profile._id || friendData?.id || `friend-${actualUsername}`,
        name: profile.name || profile.username,
        username: profile.username,
        avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.username)}&background=random`,
        online: profile.isOnline || false,
        lastMessage: {
          text: 'Start a conversation!',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isRead: true
        }
      };
      
      chatSelectFunction(chatData);
      onClose();
    } else {
      console.error('No chat function available or profile missing');
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Error</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Unable to load profile</p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
                  aria-label="Close"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
            
            <div className="p-6 text-center">
              <UserX className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Profile Not Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadProfile}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto p-3 sm:p-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {isCurrentUser ? 'Your Profile' : 'Friend Profile'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  {isCurrentUser ? 'Your profile information' : 'View friend information'}
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 flex-shrink-0"
                  aria-label="Close"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Profile Picture Section */}
            <div className="p-4 sm:p-6 flex items-center space-x-4">
              <div 
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:ring-4 transition-all duration-200 ${
                  isCurrentUser 
                    ? 'bg-gradient-to-br from-purple-400 to-purple-600 hover:ring-purple-200 dark:hover:ring-purple-800' 
                    : 'bg-gradient-to-br from-green-400 to-green-600 hover:ring-green-200 dark:hover:ring-green-800'
                } flex items-center justify-center shadow-lg`}
                onClick={() => setShowImageModal(true)}
              >
                {(profile?.profilePicture || profile?.avatar) && !avatarError ? (
                  <img
                    src={profile.profilePicture || profile.avatar}
                    alt={profile.name || profile.username}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                    onLoad={() => setAvatarError(false)}
                  />
                ) : (
                  <span className="text-white text-xl sm:text-2xl font-bold">
                    {(profile?.name || profile?.username || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.name || profile?.username || 'Unknown User'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base truncate">
                  @{profile?.username || 'unknown'}
                </p>
                {!isCurrentUser && connectionStatus === 'connected' && (
                  <div className="flex items-center mt-2">
                    <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${
                      profile?.isOnline 
                        ? 'bg-green-500 animate-pulse' 
                        : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {profile?.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                )}
                {isCurrentUser && (
                  <div className="flex items-center mt-2">
                    <div className="w-3 h-3 rounded-full mr-2 bg-green-500 animate-pulse flex-shrink-0"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Online</span>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Status Badge */}
            {!isCurrentUser && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="inline-flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  {connectionStatus === 'connected' && (
                    <>
                      <UserCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-600 dark:text-green-400 font-medium text-sm">Connected</span>
                    </>
                  )}
                  {connectionStatus === 'pending' && (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium text-sm">Request Sent</span>
                    </>
                  )}
                  {connectionStatus === 'none' && (
                    <>
                      <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">Not Connected</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
            <div className="p-4 sm:p-6 space-y-4">
              
              {/* Bio Section */}
              <div className="space-y-2">
                <label className={`flex items-center text-sm font-medium text-gray-700 dark:text-gray-300`}>
                  <User className={`w-4 h-4 mr-2 flex-shrink-0 ${isCurrentUser ? 'text-purple-600' : 'text-green-600'}`} />
                  Bio
                </label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm sm:text-base break-words">
                  {profile?.bio || 'No bio available'}
                </p>
              </div>

              {/* Phone (if available) */}
              {profile?.phone && (
                <div className="space-y-2">
                  <label className={`flex items-center text-sm font-medium text-gray-700 dark:text-gray-300`}>
                    <Phone className={`w-4 h-4 mr-2 flex-shrink-0 ${isCurrentUser ? 'text-purple-600' : 'text-green-600'}`} />
                    Phone
                  </label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm sm:text-base break-words">
                    {profile.phone}
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 space-y-3">
              
              {!isCurrentUser && connectionStatus === 'connected' && (
                <button
                  onClick={handleStartChat}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-medium text-sm sm:text-base"
                >
                  <MessageCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Send Message</span>
                </button>
              )}

              {!isCurrentUser && connectionStatus === 'none' && (
                <button
                  onClick={handleSendRequest}
                  disabled={actionLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-medium text-sm sm:text-base"
                >
                  {actionLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 flex-shrink-0" />
                      <span>Send Connection Request</span>
                    </>
                  )}
                </button>
              )}

              {!isCurrentUser && connectionStatus === 'pending' && (
                <div className="w-full bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded-lg text-center font-medium text-sm sm:text-base">
                  Connection Request Sent
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-lg transition-colors duration-200 font-medium text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Picture Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={() => setShowImageModal(false)}>
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 mx-auto">
              <div className={`w-full aspect-square max-w-[280px] sm:max-w-[320px] lg:max-w-[384px] mx-auto rounded-lg overflow-hidden flex items-center justify-center ${
                isCurrentUser 
                  ? 'bg-gradient-to-br from-purple-400 to-purple-600' 
                  : 'bg-gradient-to-br from-green-400 to-green-600'
              }`}>
                {(profile?.profilePicture || profile?.avatar) && !avatarError ? (
                  <img
                    src={profile.profilePicture || profile.avatar}
                    alt={profile.name || profile.username}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                    onLoad={() => setAvatarError(false)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-white text-6xl sm:text-7xl lg:text-8xl font-bold">
                    {(profile?.name || profile?.username || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="mt-3 sm:mt-4 text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.name || profile?.username || 'Unknown User'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  {isCurrentUser ? 'Your Profile Picture' : 'Profile Picture'}
                </p>
                {!isCurrentUser && connectionStatus === 'connected' && (
                  <div className="flex items-center justify-center mt-2">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      profile?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {profile?.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendProfile;
