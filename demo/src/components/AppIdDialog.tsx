/**
 * App ID Input Dialog
 * 
 * Modal dialog for entering and managing vowel.to App ID
 */

import React, { useState } from 'react';
import { 
  saveAppIdToStorage, 
  removeAppIdFromStorage, 
  DEFAULT_APP_ID_URL 
} from '@/lib/appIdManager';

interface AppIdDialogProps {
  onAppIdSubmit: (appId: string) => void;
  isOpen: boolean;
}

export function AppIdDialog({ onAppIdSubmit, isOpen }: AppIdDialogProps) {
  const [appId, setAppId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (appId.trim()) {
      saveAppIdToStorage(appId.trim());
      onAppIdSubmit(appId.trim());
    }
  };

  const handleClear = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    setAppId('');
    removeAppIdFromStorage();
    setShowConfirmDelete(false);
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-lg w-[90%] shadow-2xl">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          vowel.to App ID Required
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          Please enter your vowel.to App ID to continue. You can retrieve your App ID from:
        </p>
        <a 
          href={DEFAULT_APP_ID_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg mb-6 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all hover:-translate-y-0.5"
        >
          🔗 {DEFAULT_APP_ID_URL}
        </a>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="Enter your App ID"
              className="flex-1 px-4 py-3 pr-20 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-base font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-10 bg-transparent border-none cursor-pointer text-xl p-1 hover:scale-110 transition-transform"
              title={showPassword ? 'Hide App ID' : 'Show App ID'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
            {appId && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 bg-transparent border-none cursor-pointer text-xl p-1 hover:scale-110 transition-transform"
                title="Clear App ID"
              >
                🗑️
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            disabled={!appId.trim()}
          >
            Continue
          </button>
        </form>

        {showConfirmDelete && (
          <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 rounded-lg">
            <p className="text-amber-900 dark:text-amber-200 mb-4 font-medium">
              Are you sure you want to clear the App ID?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold cursor-pointer transition-colors"
              >
                Yes, Clear
              </button>
              <button 
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

