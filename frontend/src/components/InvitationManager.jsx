import React, { useState, useEffect } from 'react';
import { connectionAPI } from '../utils/api';
import { useAuth } from '../context/useAuth'; // Add this import
import { 
  ArrowLeft, 
  Search, 
  Mail, 
  Clock, 
  Users, 
  UserPlus, 
  UserCheck, 
  Check, 
  X, 
  Loader 
} from 'lucide-react';

const InvitationManager = ({ onClose, onSelectConnection, onConnectionUpdate, initialTab = 'received' }) => {
  const { user } = useAuth(); // Add this line to get current user
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [newConnectionUsername, setNewConnectionUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const [sentResponse, receivedResponse, connectionsResponse] = await Promise.all([
        connectionAPI.getInvitationsSent(),
        connectionAPI.getInvitationsReceived(),
        connectionAPI.getConnectionList()
      ]);

      setSentRequests(sentResponse.data || []);
      setReceivedRequests(receivedResponse.data || []);
      setConnections(connectionsResponse.data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      await connectionAPI.acceptInvitation(request.senderUsername);
      await loadInvitations();
      if (onConnectionUpdate) onConnectionUpdate();
      alert('Connection request accepted successfully!');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.response?.data?.error || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      const senderId = typeof request.sender === 'object' ? request.sender.id || request.sender._id : request.sender;
      
      if (!senderId) {
        alert('Error: Invalid request data');
        return;
      }
      
      await connectionAPI.rejectInvitation(senderId);
      await loadInvitations();
      if (onConnectionUpdate) onConnectionUpdate();
      alert('Connection request rejected successfully!');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.response?.data?.error || 'Failed to reject request');
    }
  };

  const handleWithdrawRequest = async (request) => {
    try {
      const receiverId = typeof request.receiver === 'object' ? request.receiver.id || request.receiver._id : request.receiver;
      
      if (!receiverId) {
        alert('Error: Invalid request data');
        return;
      }
      
      await connectionAPI.withdrawConnectionRequest(receiverId);
      await loadInvitations();
      if (onConnectionUpdate) onConnectionUpdate();
      alert('Connection request withdrawn successfully!');
    } catch (error) {
      console.error('Error withdrawing request:', error);
      alert(error.response?.data?.error || 'Failed to withdraw request');
    }
  };

  const handleSearchUsers = async (searchTerm) => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use friendProfile to check if user exists
      const response = await connectionAPI.searchUsers(searchTerm.trim());
      const users = response.data || [];
      
      if (users.length > 0) {
        const searchedUser = users[0]; // Since we're searching by exact username
        
        // Check if current user
        if (searchedUser.username === user?.username) {
          setSearchResults([{ 
            ...searchedUser, 
            isCurrentUser: true 
          }]);
          setShowSearchResults(true);
          return;
        }
        
        // Check if existing connection
        const isExistingConnection = connections.some(conn => 
          conn.friendName === searchedUser.username || 
          conn.username === searchedUser.username
        );
        
        if (isExistingConnection) {
          setSearchResults([{ 
            ...searchedUser, 
            isExistingConnection: true 
          }]);
          setShowSearchResults(true);
          return;
        }
        
        // Check if pending request exists
        const hasPendingRequest = [...sentRequests, ...receivedRequests].some(req =>
          req.senderUsername === searchedUser.username || 
          req.receiverUsername === searchedUser.username
        );
        
        if (hasPendingRequest) {
          setSearchResults([{ 
            ...searchedUser, 
            hasPendingRequest: true 
          }]);
          setShowSearchResults(true);
          return;
        }
        
        // User is available to connect
        setSearchResults([searchedUser]);
        setShowSearchResults(true);
      } else {
        // No user found
        setSearchResults([]);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      // Show user not found message
      if (error.response?.status === 404 || error.response?.data?.error === "User not found") {
        setSearchResults([]);
        setShowSearchResults(true); // Still show dropdown but with error message
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequestToUser = async (username) => {
    try {
      setSendingRequest(true);
      await connectionAPI.sendConnectionRequest(username);
      
      // Update search results to show pending status immediately
      setSearchResults(prev => prev.map(user => 
        user.username === username 
          ? { ...user, hasPendingRequest: true }
          : user
      ));
      
      await loadInvitations();
      if (onConnectionUpdate) onConnectionUpdate();
      alert('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending request:', error);
      alert(error.response?.data?.error || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewConnectionUsername(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    if (value.trim().length >= 2) {
      const timeout = setTimeout(() => {
        handleSearchUsers(value);
      }, 500); // 500ms debounce
      setSearchTimeout(timeout);
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Filter functions
  const filteredReceivedRequests = receivedRequests.filter(request =>
    (request.senderUsername || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSentRequests = sentRequests.filter(request =>
    (request.receiverUsername || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConnections = connections.filter(connection =>
    (connection.friendName || connection.username || connection.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewUserProfile = (username) => {
    // Create a friend profile event to communicate with parent
    if (onSelectConnection) {
      // We'll use the onSelectConnection callback but with a special flag
      const profileData = {
        username: username,
        name: username,
        showProfile: true // Special flag to indicate we want to show profile
      };
      onSelectConnection(profileData);
      onClose();
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Connection Manager
          </h2>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto connection-scrollbar">
        {[
          { id: 'received', icon: Mail, label: 'Received', count: receivedRequests.length },
          { id: 'sent', icon: Clock, label: 'Sent', count: sentRequests.length },
          { id: 'connections', icon: UserCheck, label: 'Connections', count: connections.length },
          { id: 'add', icon: UserPlus, label: 'Add New' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <tab.icon className="w-4 h-4" />
              <span>{tab.label} {tab.count !== undefined && `(${tab.count})`}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 connection-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Received Requests */}
            {activeTab === 'received' && (
              <div className="space-y-3">
                {filteredReceivedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No received requests</p>
                  </div>
                ) : (
                  filteredReceivedRequests.map((request) => (
                    <div key={request._id || request.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {(request.senderUsername || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.senderUsername || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Wants to connect with you
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request)}
                          disabled={request.senderUsername === 'Unknown User'}
                          className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                          title="Accept request"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          title="Reject request"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sent Requests */}
            {activeTab === 'sent' && (
              <div className="space-y-3">
                {filteredSentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No sent requests</p>
                  </div>
                ) : (
                  filteredSentRequests.map((request) => (
                    <div key={request._id || request.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {(request.receiverUsername || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.receiverUsername || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Request sent • {request.status || 'pending'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleWithdrawRequest(request)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-full transition-colors"
                          title="Withdraw request"
                        >
                          Withdraw
                        </button>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                          Pending
                        </span>
                        <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Connections */}
            {activeTab === 'connections' && (
              <div className="space-y-3">
                {filteredConnections.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No connections yet</p>
                  </div>
                ) : (
                  filteredConnections.map((connection) => (
                    <div 
                      key={connection._id || connection.id || connection.friendId} 
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      onClick={() => {
                        if (onSelectConnection) {
                          const chatConnection = {
                            id: connection.friendId || connection._id,
                            name: connection.friendName || connection.username || connection.name || 'Unknown User',
                            username: connection.friendName || connection.username || connection.name || 'Unknown User',
                            friendId: connection.friendId,
                            avatar: connection.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.friendName || connection.username || connection.name || 'User')}&background=random`
                          };
                          onSelectConnection(chatConnection);
                          onClose();
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {(connection.friendName || connection.username || connection.name || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {connection.friendName || connection.username || connection.name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Connected
                          </p>
                        </div>
                      </div>
                      <UserCheck className="w-5 h-5 text-green-500" />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Add New */}
            {activeTab === 'add' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Add New Connection
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Search for users by username to send a connection request
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newConnectionUsername}
                        onChange={handleInputChange}
                        placeholder="Type username to search..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={sendingRequest}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.length === 0 ? (
                          <div className="p-3 text-center">
                            <div className="flex flex-col items-center space-y-2">
                              <X className="w-8 h-8 text-red-500" />
                              <p className="text-red-600 dark:text-red-400 font-medium">
                                User not found
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No user found with username "{newConnectionUsername}"
                              </p>
                            </div>
                          </div>
                        ) : (
                          searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors"
                            >
                              <div 
                                className="flex items-center space-x-3 flex-1 cursor-pointer"
                                onClick={() => handleViewUserProfile(user.username)}
                                title="View profile"
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center hover:ring-2 hover:ring-purple-300 transition-all duration-200 ${
                                  user.isCurrentUser 
                                    ? 'bg-blue-500' 
                                    : user.isExistingConnection 
                                    ? 'bg-green-500' 
                                    : user.hasPendingRequest 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                                }`}>
                                  <span className="text-white text-sm font-medium">
                                    {user.username[0].toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                    {user.username}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {user.isCurrentUser 
                                      ? 'This is you' 
                                      : user.isExistingConnection 
                                      ? 'Already connected' 
                                      : user.hasPendingRequest 
                                      ? 'Request pending' 
                                      : 'Click to view profile'
                                    }
                                  </p>
                                </div>
                              </div>
                              {!user.isCurrentUser && !user.isExistingConnection && !user.hasPendingRequest ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent profile view when clicking button
                                    handleSendRequestToUser(user.username);
                                  }}
                                  disabled={sendingRequest}
                                  className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center"
                                  title="Send connection request"
                                >
                                  {sendingRequest ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <UserPlus className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <div className="text-right">
                                  {user.isCurrentUser && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">You</span>
                                  )}
                                  {user.isExistingConnection && (
                                    <UserCheck className="w-5 h-5 text-green-500" />
                                  )}
                                  {user.hasPendingRequest && (
                                    <Clock className="w-5 h-5 text-yellow-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {newConnectionUsername.length > 0 && newConnectionUsername.length < 2 && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Type at least 2 characters to search for users
                      </p>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                    <p>💡 Type to search and connect</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvitationManager;
