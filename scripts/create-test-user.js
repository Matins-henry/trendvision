/**
 * Script to create a test staff user
 * This creates BOTH the Supabase Auth user AND the StaffUser record
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './apps/admin/.env.local' });

// CONFIGURE YOUR TEST USER HERE
const TEST_USER = {
  email: 'manager@hotel.com',
  password: 'Manager123!',
  name: 'Test Manager',
  role: 'MANAGER', // MANAGER, RECEPTIONIST, or OWNER
};

console.log('\n🔧 Creating Test Staff User...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create admin client with service role key (can create users)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createUser() {
  try {
    console.log('📧 Email:', TEST_USER.email);
    console.log('🔑 Password:', TEST_USER.password);
    console.log('👤 Name:', TEST_USER.name);
    console.log('🎭 Role:', TEST_USER.role);
    console.log('');

    // Step 1: Create Supabase Auth user
    console.log('Step 1: Creating Supabase Auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('❌ Failed to create Auth user:', authError.message);
      
      // Check if user already exists
      console.log('\n🔍 Checking if user already exists...');
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === TEST_USER.email);
      
      if (existingUser) {
        console.log('✅ Auth user already exists with ID:', existingUser.id);
        console.log('   Using existing user...\n');
        
        // Use existing user's ID
        const authId = existingUser.id;
        await createStaffUser(authId);
      } else {
        process.exit(1);
      }
      return;
    }

    console.log('✅ Supabase Auth user created!');
    console.log('   User ID:', authData.user.id);
    console.log('');

    // Step 2: Create StaffUser record
    await createStaffUser(authData.user.id);

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

async function createStaffUser(authId) {
  console.log('Step 2: Creating StaffUser record...');
  
  // Use regular client to insert into StaffUser table
  const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  
  const { data: staffData, error: staffError } = await supabaseAdmin
    .from('StaffUser')
    .insert([
      {
        authId: authId,
        name: TEST_USER.name,
        email: TEST_USER.email,
        role: TEST_USER.role,
        active: true,
      },
    ])
    .select()
    .single();

  if (staffError) {
    console.error('❌ Failed to create StaffUser:', staffError.message);
    
    // Check if StaffUser already exists
    const { data: existing } = await supabaseAdmin
      .from('StaffUser')
      .select('*')
      .eq('authId', authId)
      .single();
    
    if (existing) {
      console.log('✅ StaffUser record already exists!');
      console.log('   Staff ID:', existing.id);
      console.log('   Name:', existing.name);
      console.log('   Role:', existing.role);
      console.log('   Active:', existing.active);
    } else {
      process.exit(1);
    }
    return;
  }

  console.log('✅ StaffUser record created!');
  console.log('   Staff ID:', staffData.id);
  console.log('   Name:', staffData.name);
  console.log('   Role:', staffData.role);
  console.log('   Active:', staffData.active);
  console.log('');

  console.log('🎉 SUCCESS! Test user created.\n');
  console.log('📋 Login Credentials:');
  console.log('   Email:', TEST_USER.email);
  console.log('   Password:', TEST_USER.password);
  console.log('\n✅ You can now log in at http://localhost:3000/login\n');
}

createUser();
