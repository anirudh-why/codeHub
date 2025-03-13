import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { BackgroundLines } from "./ui/background-lines";

function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log(result.user);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundLines className="flex items-center justify-center w-full flex-col px-4 z-0 min-h-screen">
      <div className='max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-gray-800'>
        <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200 text-center mb-8">Welcome to CodeHub</h2>
        <button
          className="relative group/btn flex space-x-2 items-center justify-center px-4 w-full text-black rounded-md h-12 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-200"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-t-2 border-b-2 border-current rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                {/* ... existing SVG paths ... */}
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    </BackgroundLines>
  );
}

export default Auth; 