/**
 * Test database connection
 * Run with: node test-db-connection.js
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './apps/admin/.env.local' });

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗');
console.log('');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Database connection successful!');
    console.log('Test query result:', result);
    
    // Try to count staff users
    const count = await prisma.staffUser.count();
    console.log(`✅ Found ${count} staff users in database`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🔍 Troubleshooting:');
      console.log('1. Check if your VPN/firewall is blocking port 5432');
      console.log('2. Verify Supabase project is not paused');
      console.log('3. Try accessing Supabase dashboard to confirm it\'s online');
      console.log('4. Check if your IP needs to be whitelisted in Supabase settings');
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
