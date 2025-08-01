import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import ThemeProvider from './context/ThemeContext';
import { useAuth } from './context/useAuth';
import LoginPage from './pages/LoginPage';
import ChatDashboard from './pages/ChatDashboard';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/chat" />} 
      />
      <Route 
        path="/chat" 
        element={isAuthenticated ? <ChatDashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="w-full h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;