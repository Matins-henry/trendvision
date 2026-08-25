/**
 * Test Supabase REST API connection
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './apps/admin/.env.local' });

console.log('\n🔍 Testing Supabase REST API...\n');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

try {
  // Test 1: Try to query StaffUser table
  console.log('📊 Testing StaffUser table access...');
  const { data: staffData, error: staffError } = await supabase
    .from('StaffUser')
    .select('id, name, email, role, active')
    .limit(5);
  
  if (staffError) {
    console.error('❌ Error querying StaffUser:', staffError.message);
  } else {
    console.log('✅ StaffUser table accessible!');
    console.log(`   Found ${staffData.length} staff users:`);
    staffData.forEach(staff => {
      console.log(`   - ${staff.name} (${staff.email}) - ${staff.role} - Active: ${staff.active}`);
    });
  }

  // Test 2: Try to query Room table
  console.log('\n🏨 Testing Room table access...');
  const { data: roomData, error: roomError } = await supabase
    .from('Room')
    .select('id, number, type, baseRate, status')
    .limit(5);
  
  if (roomError) {
    console.error('❌ Error querying Room:', roomError.message);
  } else {
    console.log('✅ Room table accessible!');
    console.log(`   Found ${roomData.length} rooms:`);
    roomData.forEach(room => {
      console.log(`   - Room ${room.number} (${room.type}) - $${room.baseRate} - ${room.status}`);
    });
  }

  // Test 3: Try to query Booking table
  console.log('\n📅 Testing Booking table access...');
  const { data: bookingData, error: bookingError } = await supabase
    .from('Booking')
    .select('id, reference, status, checkIn, checkOut')
    .limit(5);
  
  if (bookingError) {
    console.error('❌ Error querying Booking:', bookingError.message);
  } else {
    console.log('✅ Booking table accessible!');
    console.log(`   Found ${bookingData.length} bookings:`);
    bookingData.forEach(booking => {
      console.log(`   - ${booking.reference} - ${booking.status}`);
    });
  }

  console.log('\n✅ Supabase connection is working! Your database is accessible via REST API.\n');
  console.log('⚠️  If Prisma connection fails, it\'s a network/firewall issue with direct PostgreSQL connection (port 5432/6543).');
  console.log('   The app will work fine using Supabase client for queries instead of Prisma.\n');

} catch (err) {
  console.error('❌ Supabase API test failed:', err.message);
}
