/**
 * Integration Test Script
 * Tests the connection between frontend and backend
 */

const API_BASE_URL = 'http://localhost:8001';

async function testBackendConnection() {
  console.log('🧪 Testing Backend Connection...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Backend health check passed');
      console.log('📊 Backend status:', healthData);
    } else {
      console.log('❌ Backend health check failed');
      return false;
    }
    
    // Test Firebase connection
    const firebaseResponse = await fetch(`${API_BASE_URL}/firebase-test`);
    const firebaseData = await firebaseResponse.json();
    
    if (firebaseResponse.ok) {
      console.log('✅ Firebase connection working');
      console.log('🔥 Firebase status:', firebaseData);
    } else {
      console.log('❌ Firebase connection failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return false;
  }
}

async function testFrontendConnection() {
  console.log('🧪 Testing Frontend Connection...');
  
  try {
    // Test if frontend is running
    const frontendResponse = await fetch('http://localhost:3000');
    
    if (frontendResponse.ok) {
      console.log('✅ Frontend is running');
      return true;
    } else {
      console.log('❌ Frontend not accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend connection failed:', error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting Integration Tests...\n');
  
  const backendOk = await testBackendConnection();
  console.log('');
  
  const frontendOk = await testFrontendConnection();
  console.log('');
  
  if (backendOk && frontendOk) {
    console.log('🎉 All integration tests passed!');
    console.log('📝 Next steps:');
    console.log('   1. Start the backend: cd backend && python start.py');
    console.log('   2. Start the frontend: npm run dev');
    console.log('   3. Test the chat widget with AI responses');
    console.log('   4. Upload documents to knowledge base');
    console.log('   5. Test AI-powered conversations');
  } else {
    console.log('💥 Some tests failed. Please check:');
    if (!backendOk) {
      console.log('   - Backend server is not running');
      console.log('   - Run: cd backend && python start.py');
    }
    if (!frontendOk) {
      console.log('   - Frontend server is not running');
      console.log('   - Run: npm run dev');
    }
  }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  runIntegrationTests();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testBackendConnection, testFrontendConnection, runIntegrationTests };
}
