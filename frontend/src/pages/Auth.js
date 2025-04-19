import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiLock, FiUser, FiLogIn, FiUserPlus } from 'react-icons/fi';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // Register user in the backend
        registerUserToBackend(user);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const registerUserToBackend = async (user) => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || ''
        })
      });

      if (response.ok) {
        // Only navigate after successful backend registration
        navigate('/dashboard');
      } else {
        console.error('Error registering user to backend');
      }
    } catch (error) {
      console.error('Error registering user to backend:', error);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully');
      // Navigation handled by onAuthStateChanged
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      await userCredential.user.updateProfile({
        displayName: displayName
      });
      
      toast.success('Account created successfully');
      // Navigation handled by onAuthStateChanged
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google');
      // Navigation handled by onAuthStateChanged
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">CodeHub</h1>
          <p className="text-gray-400 mt-2">Collaborative Code Editor</p>
        </div>
        
        <div className="mb-6">
          <div className="flex border-b border-gray-700">
            <button
              className={`flex-1 py-2 ${!isSignUp ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-gray-400'}`}
              onClick={() => setIsSignUp(false)}
            >
              <FiLogIn className="inline mr-2" /> Sign In
            </button>
            <button
              className={`flex-1 py-2 ${isSignUp ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-gray-400'}`}
              onClick={() => setIsSignUp(true)}
            >
              <FiUserPlus className="inline mr-2" /> Sign Up
            </button>
          </div>
        </div>
        
        <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn}>
          {isSignUp && (
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                <FiUser className="inline mr-2" /> Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
                required={isSignUp}
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              <FiMail className="inline mr-2" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              <FiLock className="inline mr-2" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="mb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  {isSignUp ? (
                    <><FiUserPlus className="mr-2" /> Create Account</>
                  ) : (
                    <><FiLogIn className="mr-2" /> Sign In</>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="px-3 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>
        
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded mb-4"
        >
          <FcGoogle className="text-xl mr-2" />
          Sign in with Google
        </button>
        
        {!isSignUp && (
          <div className="text-center mt-4">
            <button
              onClick={handlePasswordReset}
              className="text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Forgot your password?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth; 