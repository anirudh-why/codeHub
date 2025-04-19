import './App.css';
import './index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './utils/ProtectedRoute';
import CodeEditor from './components/CodeEditor';

// Suppress ResizeObserver loop error
const suppressResizeObserverError = () => {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args.length > 0 && 
      typeof args[0] === 'string' && 
      args[0].includes('ResizeObserver loop')
    ) {
      return; // Ignore ResizeObserver loop errors
    }
    originalConsoleError(...args);
  };
};

function App() {
  useEffect(() => {
    // Fix for ResizeObserver loop completed with undelivered notifications error
    suppressResizeObserverError();

    // Add a global CSS fix for Monaco editor
    const style = document.createElement('style');
    style.textContent = `
      .monaco-editor .overflow-guard {
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup if needed
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          {/* Route with navbar */}
          <Route path="/" element={
            <>
              <Navbar />
              <Landing />
            </>
          } />
          <Route path="/auth" element={
            <>
              <Navbar />
              <Auth />
            </>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navbar />
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Code editor route without navbar */}
          <Route path="/editor/:roomId" element={
            <ProtectedRoute>
              <CodeEditor />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
