/**
 * Test script for room management API endpoints
 * Logs in as MANAGER and tests creating a room
 */

async function testRoomAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔐 Step 1: Login as MANAGER...');
  
  // Step 1: Login as MANAGER
  const loginResponse = await fetch(`${baseUrl}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'manager@hotel.com',
      password: 'Manager123!',
    }),
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Login failed:', await loginResponse.text());
    return;
  }
  
  // Extract session cookie
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login successful');
  console.log('Session cookie:', cookies ? 'Present' : 'Missing');
  
  // Step 2: Create a test room
  console.log('\n📝 Step 2: Creating test room...');
  
  const roomData = {
    number: '101',
    type: 'Standard',
    capacity: 2,
    baseRate: 120.00,
    description: 'Standard room with queen bed',
    photos: ['https://example.com/room101.jpg'],
  };
  
  const createResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || '',
    },
    body: JSON.stringify(roomData),
  });
  
  const createResult = await createResponse.json();
  
  if (!createResponse.ok) {
    console.error('❌ Create room failed:');
    console.error('Status:', createResponse.status);
    console.error('Response:', JSON.stringify(createResult, null, 2));
    return;
  }
  
  console.log('✅ Room created successfully!');
  console.log('Response:', JSON.stringify(createResult, null, 2));
  
  // Step 3: Try to create duplicate room (should fail)
  console.log('\n🔁 Step 3: Testing duplicate room number...');
  
  const duplicateResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || '',
    },
    body: JSON.stringify(roomData),
  });
  
  const duplicateResult = await duplicateResponse.json();
  
  if (duplicateResponse.status === 400 && duplicateResult.code === 'DUPLICATE') {
    console.log('✅ Duplicate check working correctly');
    console.log('Error message:', duplicateResult.error);
  } else {
    console.error('❌ Duplicate check failed - should return 400 with DUPLICATE code');
    console.error('Response:', JSON.stringify(duplicateResult, null, 2));
  }
  
  // Step 4: Test validation (invalid capacity)
  console.log('\n🔍 Step 4: Testing validation (capacity = 0)...');
  
  const invalidData = {
    number: '102',
    type: 'Deluxe',
    capacity: 0, // Invalid!
    baseRate: 150.00,
  };
  
  const validationResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || '',
    },
    body: JSON.stringify(invalidData),
  });
  
  const validationResult = await validationResponse.json();
  
  if (validationResponse.status === 400 && validationResult.field === 'capacity') {
    console.log('✅ Validation working correctly');
    console.log('Error message:', validationResult.error);
  } else {
    console.error('❌ Validation failed - should return 400 for capacity');
    console.error('Response:', JSON.stringify(validationResult, null, 2));
  }
  
  console.log('\n✅ All tests completed!');
}

// Run tests
testRoomAPI().catch(console.error);
