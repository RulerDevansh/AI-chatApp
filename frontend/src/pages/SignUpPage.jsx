import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { authAPI } from '../utils/api';
import { MessageCircle, User, Lock, Mail, Sun, Moon, ArrowLeft } from 'lucide-react';

const SignUpPage = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (result.data) {
        setSuccess('Account created successfully! Logging you in...');
        
        // Auto-login after successful registration using proper login API
        try {
          const loginResult = await authAPI.login(formData.email, formData.password);
          if (loginResult.data && loginResult.token) {
            login(loginResult.data);
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          setSuccess('Account created successfully! Please sign in.');
          // Redirect to login after a delay if auto-login fails
          setTimeout(() => {
            onBackToLogin();
          }, 2000);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 409) {
        setError('Email or username already exists');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Registration failed. Please try again.');
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 dark:from-gray-800 dark:via-gray-900 dark:to-black flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 transition-colors duration-200">
        {/* Header with Theme Toggle and Back Button */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onBackToLogin}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-200">Join Chatapp</h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              placeholder="Username"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              placeholder="Email Address"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              placeholder="Password (min 6 characters)"
              required
              minLength={6}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              placeholder="Confirm Password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-200">
            Already have an account? 
            <button 
              onClick={onBackToLogin}
              className="text-green-500 hover:text-green-600 cursor-pointer font-semibold ml-1"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
