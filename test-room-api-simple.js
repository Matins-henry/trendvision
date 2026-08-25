/**
 * Simple test to show API response structure without authentication
 * This demonstrates the endpoints work and return proper error codes
 */

async function testRoomAPIStructure() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('📋 Testing Room Management API Structure\n');
  
  // Test 1: POST without auth (should return 401)
  console.log('Test 1: POST /api/rooms without authentication');
  const postResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      number: '101',
      type: 'Standard',
      capacity: 2,
      baseRate: 120.00,
    }),
  });
  
  console.log('Status:', postResponse.status);
  console.log('Response:', await postResponse.json());
  console.log(postResponse.status === 401 ? '✅ Correctly returns 401 Unauthorized\n' : '❌ Should return 401\n');
  
  // Test 2: GET without auth (should return 401)
  console.log('Test 2: GET /api/rooms without authentication');
  const getResponse = await fetch(`${baseUrl}/api/rooms`);
  
  console.log('Status:', getResponse.status);
  console.log('Response:', await getResponse.json());
  console.log(getResponse.status === 401 ? '✅ Correctly returns 401 Unauthorized\n' : '❌ Should return 401\n');
  
  console.log('📝 Note: To test with authentication:');
  console.log('1. Login as manager@hotel.com in the browser');
  console.log('2. Open browser console');
  console.log('3. Run this command:');
  console.log(`
fetch('/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    number: '101',
    type: 'Standard',
    capacity: 2,
    baseRate: 120.00,
    description: 'Standard room with queen bed',
    photos: ['https://example.com/room101.jpg']
  })
}).then(r => r.json()).then(console.log);
  `);
}

testRoomAPIStructure().catch(console.error);
