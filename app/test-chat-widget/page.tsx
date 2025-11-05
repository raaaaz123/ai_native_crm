"use client";

import React from 'react';
import { ChatWidget } from '@/app/components/chat-widget';

export default function TestChatWidgetPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Chat Widget</h1>
        <p className="text-gray-600 mb-8">
          This page is for testing the ChatWidget component and verifying that conversations are saved to Firestore.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click the chat widget button in the bottom-right corner</li>
            <li>Enter your email when prompted</li>
            <li>Send a test message</li>
            <li>Check the conversations page to see if the conversation appears</li>
          </ol>
        </div>

        {/* Chat Widget */}
        <ChatWidget
          agentId="XHptkClQCsVUHa8obTrm"
          workspaceSlug="rasheed-m"
          channelId="test-channel"
          position="bottom-right"
        />
      </div>
    </div>
  );
}