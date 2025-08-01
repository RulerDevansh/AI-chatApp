import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextProvider';
import { authAPI } from '../utils/api';

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('chatUser');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Fetch fresh profile data to ensure we have latest bio and profile picture
        const fetchFreshProfile = async () => {
          try {
            const profileData = await authAPI.getProfile();
            if (profileData.data) {
              const updatedUser = { ...parsedUser, ...profileData.data };
              setUser(updatedUser);
              localStorage.setItem('chatUser', JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.error('Error fetching fresh profile data:', error);
          }
        };
        
        fetchFreshProfile();
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('chatUser');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('chatUser', JSON.stringify(userData));
    
    if (token) {
      localStorage.setItem('token', token);
    }

    // Immediately fetch fresh profile data after login to get profile picture
    try {
      const profileData = await authAPI.getProfile();
      if (profileData.data) {
        const updatedUser = { ...userData, ...profileData.data };
        setUser(updatedUser);
        localStorage.setItem('chatUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error fetching profile data after login:', error);
      // Continue with login even if profile fetch fails
    }
  };

  const updateUser = (updatedData) => {
    const newUserData = { ...user, ...updatedData };
    setUser(newUserData);
    localStorage.setItem('chatUser', JSON.stringify(newUserData));
  };

  const refreshUserData = async () => {
    try {
      const updatedProfile = await authAPI.getProfile();
      const profileData = updatedProfile.data || updatedProfile;
      const newUserData = { ...user, ...profileData };
      setUser(newUserData);
      localStorage.setItem('chatUser', JSON.stringify(newUserData));
      return newUserData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logging out - clearing local storage');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('chatUser');
    localStorage.removeItem('token');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    refreshUserData,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
