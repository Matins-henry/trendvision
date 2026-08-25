/**
 * Script to sync existing Supabase auth users to StaffUser records
 * Run with: node sync-staff-users.js
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './apps/admin/.env.local' });

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncStaffUsers() {
  const users = [
    {
      email: 'manager@hotel.com',
      role: 'MANAGER',
      name: 'Test Manager',
    },
    {
      email: 'receptionist@hotel.com',
      role: 'RECEPTIONIST',
      name: 'Test Receptionist',
    },
    {
      email: 'owner@hotel.com',
      role: 'OWNER',
      name: 'Test Owner',
    },
  ];

  console.log('Syncing Supabase users to StaffUser records...\n');

  for (const user of users) {
    try {
      // Get Supabase user by email
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        continue;
      }

      const authUser = authUsers.users.find(u => u.email === user.email);
      
      if (!authUser) {
        console.log(`❌ ${user.role}: No auth user found for ${user.email}`);
        continue;
      }

      const authId = authUser.id;

      // Check if StaffUser already exists
      const existing = await prisma.staffUser.findUnique({
        where: { authId },
      });

      if (existing) {
        console.log(`✅ ${user.role}: Already exists (${user.email})`);
        continue;
      }

      // Create StaffUser
      await prisma.staffUser.create({
        data: {
          authId,
          email: user.email,
          name: user.name,
          role: user.role,
          active: true,
        },
      });

      console.log(`✅ ${user.role}: Created StaffUser record`);
      console.log(`   Email: ${user.email}`);
      console.log(`   AuthId: ${authId}\n`);
    } catch (error) {
      console.error(`❌ ${user.role}: Error:`, error.message);
    }
  }

  console.log('\nSync complete! Test users should now be able to login.');
}

syncStaffUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
