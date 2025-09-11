const geminiService = require('./services/gemini_ai_service');

async function testAI() {
  try {
    console.log('Testing Gemini AI connection...');
    const result = await geminiService.testConnection();
    console.log('✅ Test successful:', result);
    
    console.log('\nTesting story caption generation...');
    const caption = await geminiService.generateStoryCaption('A beautiful sunset at the beach');
    console.log('✅ Story caption:', caption);
    
    console.log('\nTesting post content generation...');
    const postContent = await geminiService.generatePostContent('My morning coffee routine', 'image');
    console.log('✅ Post content:', postContent);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAI();
