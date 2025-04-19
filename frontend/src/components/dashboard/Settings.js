import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function Settings() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        setDisplayName(user.displayName || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/auth');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await user.updateProfile({
        displayName: displayName.trim() || user.email.split('@')[0]
      });
      
      // Refresh user to get updated profile
      setUser({ ...auth.currentUser });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 pt-6 pl-6 pr-6 flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-8">
        <h1 className="text-3xl text-white font-bold">Settings</h1>
        <p className="text-gray-300 mt-1">Manage your account preferences</p>
      </div>
      
      <div className="flex-grow px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg shadow-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  className="w-full p-3 border border-gray-200/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all cursor-not-allowed"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-400">Your email cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full p-3 border border-gray-200/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={updateProfile}
                  disabled={isSaving}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Account Actions */}
          <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Account Actions</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
              
              <button
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                onClick={() => toast.error('This feature is not implemented yet')}
              >
                Delete Account
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <h3 className="text-yellow-400 font-medium mb-1">Warning</h3>
              <p className="text-gray-300 text-sm">
                Deleting your account is permanent and will remove all your data including workspaces you've created.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
