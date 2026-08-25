/**
 * Check if StaffUser records exist in the database
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: './apps/admin/.env.local' });

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function checkStaffUsers() {
  try {
    console.log('🔍 Checking StaffUser records...\n');
    
    const staffUsers = await prisma.staffUser.findMany({
      select: {
        id: true,
        authId: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });
    
    if (staffUsers.length === 0) {
      console.log('❌ No StaffUser records found in database!');
      console.log('You need to create StaffUser records that match the Supabase auth users.\n');
      console.log('Run: node scripts/create-staff-users.js');
    } else {
      console.log(`✅ Found ${staffUsers.length} StaffUser records:\n`);
      staffUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
        console.log(`    Role: ${user.role}`);
        console.log(`    AuthId: ${user.authId}`);
        console.log(`    Active: ${user.active}\n`);
      });
    }
    
  } catch (error) {
    console.error('Error checking staff users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStaffUsers();
