import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { authAPI } from '../utils/api'; 
import { MessageCircle, User, Lock, Sun, Moon } from 'lucide-react';
import SignUpPage from './SignUpPage';

const LoginPage = () => {
  const [showSignUp, setShowSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // If showing signup, render SignUpPage
  if (showSignUp) {
    return <SignUpPage onBackToLogin={() => setShowSignUp(false)} />;
  }

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

  try {
    const result = await authAPI.login(formData.email, formData.password);

    if (result.data) {
      await login(result.data, result.token); // Wait for login to complete including profile fetch
    }

    setIsLoading(false);
  } catch (error) {
    console.error('Login error:', error);

    if (error.response?.data?.message) {
      setError(error.response.data.message);
    } else if (error.response?.status === 401) {
      setError('Invalid email or password');
    } else if (error.code === 'NETWORK_ERROR') {
      setError('Network error. Please check your connection.');
    } else {
      setError('Login failed. Please try again.');
    }

    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 dark:from-gray-800 dark:via-gray-900 dark:to-black flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 transition-colors duration-200">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-200">Chatapp</h1>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">Connect with friends and family</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
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
              placeholder="Password"
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
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-200">
            Don't have an account? 
            <button 
              onClick={() => setShowSignUp(true)}
              className="text-green-500 hover:text-green-600 cursor-pointer font-semibold ml-1"
            >
              Sign up
            </button>
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
            Demo credentials: Use any username/password
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
