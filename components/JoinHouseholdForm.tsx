'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

/**
 * JoinHouseholdForm Component
 * 
 * Allows users to request to join a household by entering a reference code.
 * Displays success/error messages based on the request outcome.
 * 
 * Requirements: 2.1.1, 2.1.2
 */
export function JoinHouseholdForm() {
  const { requestJoinHousehold } = useApp();
  
  const [referenceCode, setReferenceCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!referenceCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a reference code' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await requestJoinHousehold(referenceCode.trim());
      setMessage({ 
        type: 'success', 
        text: 'Request sent successfully! Waiting for owner approval.' 
      });
      setReferenceCode('');
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to request joining household' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="referenceCode" className="block text-sm font-medium text-gray-700 mb-1">
          Reference Code
        </label>
        <input
          id="referenceCode"
          type="text"
          value={referenceCode}
          onChange={(e) => setReferenceCode(e.target.value)}
          placeholder="Enter household reference code"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full px-4 py-2 text-white font-medium rounded-md transition-colors ${
          isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
        }`}
      >
        {isSubmitting ? 'Sending Request...' : 'Request to Join'}
      </button>
    </form>
  );
}
