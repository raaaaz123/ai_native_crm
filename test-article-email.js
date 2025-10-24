/**
 * Knowledge Base Article Notification Email Test
 * Tests the article notification email integration
 */

const testArticleEmail = async () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   KB Article Email Test               ║');
  console.log('╚════════════════════════════════════════╝\n');

  const testData = {
    email: 'rasheedmm1000@gmail.com',
    userName: 'Rasheed',
    articleTitle: 'Getting Started with AI Assistant',
    articleType: 'faq',
    widgetName: 'Customer Support Widget',
    chunksCount: 5
  };

  console.log('📧 Test Article Notification Email');
  console.log('   To:', testData.email);
  console.log('   Article:', testData.articleTitle);
  console.log('   Type:', testData.articleType);
  console.log('   Widget:', testData.widgetName);
  console.log('   Chunks:', testData.chunksCount);
  console.log('\n⏳ Sending email...\n');

  try {
    const response = await fetch('http://localhost:3001/api/emails/article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ SUCCESS! Article notification sent!');
      console.log('📬 Check your inbox at:', testData.email);
      console.log('💡 Don\'t forget to check spam folder!');
      console.log('\n📋 Email includes:');
      console.log('   • Article title and type');
      console.log('   • Widget name');
      console.log('   • Chunks created');
      console.log('   • "View Knowledge Base" button');
      console.log('   • AI-powered features info');
    } else {
      console.log('\n❌ FAILED! Email not sent');
      console.log('🔍 Error:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.log('\n❌ ERROR! Cannot connect to server');
    console.log('🔍 Error:', error.message);
    console.log('\n💡 Make sure Next.js is running: npm run dev');
  }
};

testArticleEmail();

