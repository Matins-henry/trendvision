/**
 * Script to create test users for all three roles
 * Run with: node create-test-users.js
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

async function createTestUsers() {
  const users = [
    {
      email: 'manager@hotel.com',
      password: 'Manager123!',
      role: 'MANAGER',
      name: 'Test Manager',
    },
    {
      email: 'receptionist@hotel.com',
      password: 'Receptionist123!',
      role: 'RECEPTIONIST',
      name: 'Test Receptionist',
    },
    {
      email: 'owner@hotel.com',
      password: 'Owner123!',
      role: 'OWNER',
      name: 'Test Owner',
    },
  ];

  console.log('Creating test users...\n');

  for (const user of users) {
    try {
      // Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        console.log(`❌ ${user.role}: Auth user already exists or error:`, authError.message);
        continue;
      }

      const authId = authData.user.id;

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

      console.log(`✅ ${user.role}: Created successfully`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}\n`);
    } catch (error) {
      console.error(`❌ ${user.role}: Error:`, error.message);
    }
  }

  console.log('\nTest users creation complete!');
  console.log('\nYou can now test:');
  console.log('1. MANAGER → /reports (should succeed)');
  console.log('2. RECEPTIONIST → /reports (should redirect to /access-denied)');
  console.log('3. OWNER → /dashboard (should succeed)');
}

createTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
