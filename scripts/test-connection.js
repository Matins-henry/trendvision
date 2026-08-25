/**
 * Test script to verify Supabase and Database connections
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './apps/admin/.env.local' });
dotenv.config({ path: './packages/db/.env' });

console.log('\n🔍 Testing Connections...\n');

// Test 1: Check environment variables
console.log('📋 Environment Variables Check:');
console.log('✓ NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('✓ NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('✓ SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('✓ DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');

// Test 2: Supabase Client Connection
console.log('\n🔌 Testing Supabase Client Connection...');
try {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  // Try to check health
  const { data, error } = await supabase.from('_health_check').select('*').limit(1);
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is fine
    console.log('⚠️  Supabase client created but query returned error:', error.message);
  } else {
    console.log('✅ Supabase client connection successful!');
  }
} catch (err) {
  console.error('❌ Supabase connection failed:', err.message);
}

// Test 3: Database Connection via Prisma
console.log('\n🗄️  Testing Database Connection via Prisma...');
const prisma = new PrismaClient();

try {
  // Test connection with a simple query
  await prisma.$connect();
  console.log('✅ Prisma connected to database successfully!');
  
  // Try to count rooms
  const roomCount = await prisma.room.count();
  console.log(`   Found ${roomCount} rooms in database`);
  
  // Try to count staff users
  const staffCount = await prisma.staffUser.count();
  console.log(`   Found ${staffCount} staff users in database`);
  
  // Try to count bookings
  const bookingCount = await prisma.booking.count();
  console.log(`   Found ${bookingCount} bookings in database`);
  
  console.log('\n✅ Database is accessible and contains data!');
  
} catch (err) {
  console.error('❌ Database connection failed:', err.message);
} finally {
  await prisma.$disconnect();
}

console.log('\n✨ Connection test complete!\n');
