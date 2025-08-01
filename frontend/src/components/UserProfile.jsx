import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { authAPI } from '../utils/api';
import { Edit2, Mail, User, X, Camera, Loader, Check } from 'lucide-react';

const UserProfile = ({ onClose, onProfileUpdate }) => {
  const { user, updateUser, refreshUserData } = useAuth();
  const [editing, setEditing] = useState({
    bio: false, 
    password: false
  });
  
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState({
    bio: false,
    password: false,
    profilePicture: false,
    profile: false
  });

  const [avatarError, setAvatarError] = useState(false);
  const fileInputRef = useRef(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch fresh user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(prev => ({ ...prev, profile: true }));
        const profileData = await authAPI.getProfile();
        
        if (profileData.data) {
          // Update the auth context with fresh data
          updateUser(profileData.data);
          
          // Update form data with fresh bio
          setFormData(prev => ({
            ...prev,
            bio: profileData.data.bio || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(prev => ({ ...prev, profile: false }));
      }
    };

    // Only fetch if we don't have bio data or on initial mount
    if (!user?.bio || user.bio === "Hey there! I am using ChatApp.") {
      fetchUserProfile();
    }
  }, []); // Run only on mount

  // Update formData when user data changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      bio: user?.bio || ''
    }));
  }, [user]);

  const handleEdit = (field) => {
    setEditing(prev => ({ ...prev, [field]: !prev[field] }));
    if (!editing[field]) {
      setFormData(prev => ({ ...prev, [field]: user?.[field] || '' }));
    }
  };

  const handleSave = async (field) => {
    try {
      setLoading(prev => ({ ...prev, [field]: true }));
      
      if (field === 'bio') {
        const response = await authAPI.updateBio(formData.bio);
        // Update user in context with new bio
        updateUser({ bio: formData.bio });
        alert('Bio updated successfully!');
      } else if (field === 'password') {
        // Validate password fields
        if (!formData.currentPassword) {
          alert('Current password is required');
          return;
        }
        
        if (!formData.newPassword) {
          alert('New password is required');
          return;
        }
        
        if (formData.newPassword.length < 6) {
          alert('New password must be at least 6 characters long');
          return;
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          alert('New passwords do not match');
          return;
        }
        
        if (formData.currentPassword === formData.newPassword) {
          alert('New password must be different from current password');
          return;
        }
        
        await authAPI.updatePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
        
        setFormData(prev => ({ 
          ...prev, 
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        alert('Password updated successfully!');
      }
      
      setEditing(prev => ({ ...prev, [field]: false }));
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      alert(error.response?.data?.error || `Failed to update ${field}`);
    } finally {
      setLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleCancel = (field) => {
    setEditing(prev => ({ ...prev, [field]: false }));
    if (field === 'password') {
      setFormData(prev => ({ 
        ...prev, 
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: user?.[field] || '' }));
    }
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, profilePicture: true }));
      
      const formData = new FormData();
      formData.append('file', file); // Changed from 'profilePicture' to 'file' to match backend
      
      const response = await authAPI.updateProfilePicture(formData);
      
      // Update user context with new profile picture
      updateUser({ profilePicture: response.data });
      
      alert('Profile picture updated successfully!');
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert(error.response?.data?.error || 'Failed to update profile picture');
    } finally {
      setLoading(prev => ({ ...prev, profilePicture: false }));
    }
  };

  const getProfilePictureUrl = () => {
    if (user?.profilePicture) {
      return user.profilePicture;
    }
    
    const name = user?.name || user?.username || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
  };

  if (loading.profile) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Manage your account information</p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 flex-shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Profile Picture Section */}
            <div className="p-4 sm:p-6 flex items-center space-x-4">
              <div className="relative flex-shrink-0">
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg cursor-pointer hover:ring-4 hover:ring-purple-200 dark:hover:ring-purple-800 transition-all duration-200"
                  onClick={() => setShowImageModal(true)}
                >
                  {!avatarError && user?.profilePicture ? (
                    <img
                      src={getProfilePictureUrl()}
                      alt={user?.username || 'User'}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                      onLoad={() => setAvatarError(false)}
                    />
                  ) : (
                    <span className="text-white text-xl sm:text-2xl font-bold">
                      {(() => {
                        const name = user?.name || user?.username || 'User';
                        const nameParts = name.split(' ');
                        if (nameParts.length >= 2) {
                          return nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
                        } else {
                          return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.charAt(0).toUpperCase();
                        }
                      })()}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading.profilePicture}
                  className="absolute -bottom-1 -right-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-full p-1.5 sm:p-2 shadow-lg transition-colors duration-200"
                >
                  {loading.profilePicture ? (
                    <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {user?.username || 'User'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              {/* Bio Field - Editable */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4 mr-2 text-purple-600" />
                  Bio
                </label>
                <div className="flex flex-col sm:flex-row items-start space-y-2 sm:space-y-0 sm:space-x-3">
                  {editing.bio ? (
                    <>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm input-scrollbar"
                        placeholder="Tell us about yourself..."
                        rows="3"
                        maxLength="160"
                        disabled={loading.bio}
                      />
                      <div className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 w-full sm:w-auto flex-shrink-0">
                        <button
                          onClick={() => handleSave('bio')}
                          disabled={loading.bio}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-md transition-colors flex items-center justify-center space-x-1 text-sm"
                        >
                          {loading.bio ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => handleCancel('bio')}
                          disabled={loading.bio}
                          className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 px-3 py-2 text-gray-900 dark:text-white min-h-[3rem] flex items-start rounded-md text-sm w-full break-words">
                        {user?.bio || 'No bio added yet'}
                      </span>
                      <button
                        onClick={() => handleEdit('bio')}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors mt-1 sm:mt-0 flex-shrink-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                {editing.bio && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.bio.length}/160 characters
                  </p>
                )}
              </div>

              {/* Username Field - Non-editable */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4 mr-2 text-purple-600" />
                  Username
                </label>
                <div className="flex items-center space-x-3">
                  <span className="flex-1 px-3 py-2 text-gray-900 dark:text-white rounded-md bg-gray-50 dark:bg-gray-700 text-sm truncate">
                    {user?.username || 'Not set'}
                  </span>
                </div>
              </div>

              {/* Email Field - Non-editable */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4 mr-2 text-purple-600" />
                  Email
                </label>
                <div className="flex items-center space-x-3">
                  <span className="flex-1 px-3 py-2 text-gray-900 dark:text-white rounded-md bg-gray-50 dark:bg-gray-700 text-sm truncate">
                    {user?.email || 'Not set'}
                  </span>
                </div>
              </div>

              {/* Password Field - Editable */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="flex items-start space-x-3">
                  {editing.password ? (
                    <div className="flex-1 space-y-3">
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Enter current password"
                        disabled={loading.password}
                        required
                      />
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Enter new password"
                        disabled={loading.password}
                        minLength="6"
                        required
                      />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Confirm new password"
                        disabled={loading.password}
                        minLength="6"
                        required
                      />
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                        <button
                          onClick={() => handleSave('password')}
                          disabled={loading.password || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword.length < 6}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-md transition-colors flex items-center justify-center space-x-1 text-sm"
                        >
                          {loading.password ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => handleCancel('password')}
                          disabled={loading.password}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 px-3 py-2 text-gray-900 dark:text-white text-sm">
                        ••••••••
                      </span>
                      <button
                        onClick={() => handleEdit('password')}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors flex-shrink-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                {editing.password && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>• Current password is required for verification</p>
                    <p>• New password must be at least 6 characters long</p>
                    <p>• New password must be different from current password</p>
                  </div>
                )}
              </div>

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
              <div className="w-full aspect-square max-w-[280px] sm:max-w-[320px] lg:max-w-[384px] mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                {!avatarError && user?.profilePicture ? (
                  <img
                    src={getProfilePictureUrl()}
                    alt={user?.username || 'User'}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                    onLoad={() => setAvatarError(false)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-white text-6xl sm:text-7xl lg:text-8xl font-bold">
                    {(() => {
                      const name = user?.name || user?.username || 'User';
                      const nameParts = name.split(' ');
                      if (nameParts.length >= 2) {
                        return nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
                      } else {
                        return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.charAt(0).toUpperCase();
                      }
                    })()}
                  </span>
                )}
              </div>
              <div className="mt-3 sm:mt-4 text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{user?.username || 'User'}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Profile Picture</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
