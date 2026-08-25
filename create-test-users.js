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

      let authId = authData?.user?.id;
      if (!authId) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingAuth = listData?.users?.find((u) => u.email === user.email);
        authId = existingAuth?.id;
      }

      if (!authId) {
        console.error(`❌ Could not determine authId for ${user.email}`);
        continue;
      }

      // Upsert StaffUser record in Postgres
      await prisma.staffUser.upsert({
        where: { authId },
        update: {
          email: user.email,
          name: user.name,
          role: user.role,
          active: true,
        },
        create: {
          authId,
          email: user.email,
          name: user.name,
          role: user.role,
          active: true,
        },
      });

      console.log(`✅ ${user.role}: Synced StaffUser (${user.email})`);
    } catch (error) {
      console.error(`❌ Error processing ${user.email}:`, error);
    }
  }

  await prisma.$disconnect();
}

createTestUsers();