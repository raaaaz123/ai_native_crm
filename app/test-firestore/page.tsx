"use client";

import { useState } from 'react';
import { useAuth } from '../lib/workspace-auth-context';
import { createReviewForm, getBusinessReviewForms } from '../lib/review-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestFirestorePage() {
  const { user, loading } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const testFirestorePermissions = async () => {
    if (!user?.uid) {
      setTestResult('❌ No user logged in');
      return;
    }

    setTesting(true);
    setTestResult('🔄 Testing Firestore permissions...\n');

    try {
      // Test 1: Create a review form
      setTestResult(prev => prev + '📝 Testing form creation...\n');
      const createResult = await createReviewForm(user.uid, {
        title: 'Test Form',
        description: 'This is a test form',
        fields: [
          {
            type: 'text',
            label: 'Test Field',
            required: false,
            order: 0
          }
        ],
        settings: {
          allowAnonymous: true,
          requireEmail: false,
          showProgress: true,
          thankYouMessage: 'Thank you!',
          collectLocation: false,
          collectDeviceInfo: false
        }
      });

      if (createResult.success) {
        setTestResult(prev => prev + '✅ Form creation successful!\n');
        setTestResult(prev => prev + `📋 Form ID: ${createResult.data?.id}\n`);
      } else {
        setTestResult(prev => prev + `❌ Form creation failed: ${createResult.error}\n`);
        return;
      }

      // Test 2: Fetch review forms
      setTestResult(prev => prev + '📖 Testing form retrieval...\n');
      const fetchResult = await getBusinessReviewForms(user.uid);

      if (fetchResult.success) {
        setTestResult(prev => prev + `✅ Form retrieval successful! Found ${fetchResult.data?.length || 0} forms\n`);
      } else {
        setTestResult(prev => prev + `❌ Form retrieval failed: ${fetchResult.error}\n`);
      }

      setTestResult(prev => prev + '\n🎉 All tests completed!');

    } catch (error) {
      setTestResult(prev => prev + `❌ Test failed with error: ${error}\n`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to test Firestore permissions.</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Firestore Permissions Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">User Info:</h3>
              <p>UID: {user.uid}</p>
              <p>Email: {user.email}</p>
              <p>Display Name: {user.displayName}</p>
            </div>

            <Button 
              onClick={testFirestorePermissions} 
              disabled={testing}
              className="w-full"
            >
              {testing ? 'Testing...' : 'Test Firestore Permissions'}
            </Button>

            {testResult && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Test Results:</h3>
                <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
