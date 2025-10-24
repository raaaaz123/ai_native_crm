/**
 * Test Both AI Models via OpenRouter
 * Run: node test-ai-models.js
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-v1-your-key-here';

async function testModel(modelName, modelId) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${modelName}`);
  console.log(`Model ID: ${modelId}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Rexa AI',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for customer support.'
          },
          {
            role: 'user',
            content: 'Hello! What are your business hours?'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ API Error:');
      console.log(JSON.stringify(errorData, null, 2));
      return false;
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;
    const usage = data.usage;

    console.log('\n✅ Response received:');
    console.log(`📝 Answer: ${answer.substring(0, 150)}${answer.length > 150 ? '...' : ''}`);
    console.log(`\n📊 Usage:`);
    console.log(`   Prompt tokens: ${usage.prompt_tokens}`);
    console.log(`   Completion tokens: ${usage.completion_tokens}`);
    console.log(`   Total tokens: ${usage.total_tokens}`);
    console.log(`   Model used: ${data.model || modelId}`);
    
    return true;

  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     AI Models Testing - OpenRouter Integration    ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const models = [
    { name: 'GPT-5 Mini (OpenAI)', id: 'openai/gpt-5-mini' },
    { name: 'Gemini 2.5 Flash (Google)', id: 'google/gemini-2.5-flash' }
  ];

  console.log('\n📋 Testing Configuration:');
  console.log(`   API Key: ${OPENROUTER_API_KEY.substring(0, 15)}...`);
  console.log(`   Models to test: ${models.length}\n`);

  let passedTests = 0;
  let failedTests = 0;

  for (const model of models) {
    const success = await testModel(model.name, model.id);
    if (success) {
      passedTests++;
    } else {
      failedTests++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}/${models.length}`);
  console.log(`❌ Failed: ${failedTests}/${models.length}`);
  
  if (passedTests === models.length) {
    console.log('\n🎉 All models working perfectly!');
    console.log('✨ Your AI integration is ready for production!\n');
  } else {
    console.log('\n⚠️  Some models failed. Check your OpenRouter API key and account.');
    console.log('💡 Tip: Make sure your OpenRouter account has sufficient credits.\n');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

