const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api/v1';

async function testAPIIntegration() {
  console.log('🧪 Testing API Integration...\n');

  // Test 0: Health check
  try {
    const response = await axios.get('http://localhost:4000/health');
    console.log('✅ Health endpoint:', response.data);
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.code, error.message);
  }

  // Test 1: Root API endpoint
  try {
    const response = await axios.get(`${API_BASE_URL}`);
    console.log('✅ Root API endpoint:', response.data);
  } catch (error) {
    console.log('❌ Root API endpoint failed:', error.code, error.message);
  }

  // Test 2: Categories endpoint
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    console.log('✅ Categories endpoint:', response.data);
  } catch (error) {
    console.log('❌ Categories endpoint failed:', error.code, error.message);
  }

  // Test 3: Discovery endpoint (should work without auth)
  try {
    const response = await axios.get(`${API_BASE_URL}/discovery/communities`);
    console.log('✅ Discovery endpoint:', response.data);
  } catch (error) {
    console.log('❌ Discovery endpoint failed:', error.code, error.message);
  }

  // Test 4: Protected route (should fail without auth)
  try {
    const response = await axios.get(`${API_BASE_URL}/messaging/conversations`);
    console.log('⚠️ Messaging endpoint (should fail):', response.data);
  } catch (error) {
    console.log('✅ Messaging endpoint properly protected:', error.response?.status, error.code, error.message);
  }

  console.log('\n🎉 API Integration test complete!');
}

testAPIIntegration().catch(console.error);
