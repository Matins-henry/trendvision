/**
 * Verify that the auth functions work correctly
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './apps/admin/.env.local' });

const email = 'manager@hotel.com';
const password = 'Manager123!';

console.log('\n🔍 Testing Authentication Flow...\n');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function testAuth() {
  try {
    // Simulate the signIn function
    console.log('Step 1: Authenticating with Supabase...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('❌ Authentication failed:', authError?.message || 'No user returned');
      return;
    }

    console.log('✅ Authentication successful!');
    console.log('   User ID:', authData.user.id);
    console.log('');

    // Query StaffUser
    console.log('Step 2: Querying StaffUser...');
    const { data: staffUser, error: staffError } = await supabase
      .from('StaffUser')
      .select('*')
      .eq('authId', authData.user.id)
      .single();

    if (staffError || !staffUser) {
      console.error('❌ StaffUser query failed:', staffError?.message || 'No staff user found');
      await supabase.auth.signOut();
      return;
    }

    console.log('✅ StaffUser found!');
    console.log('   Name:', staffUser.name);
    console.log('   Email:', staffUser.email);
    console.log('   Role:', staffUser.role);
    console.log('   Active:', staffUser.active);
    console.log('');

    if (!staffUser.active) {
      console.error('❌ Account is inactive');
      await supabase.auth.signOut();
      return;
    }

    console.log('✅ Account is active!');
    console.log('');

    // Build result
    const result = {
      authId: staffUser.authId,
      staffUserId: staffUser.id,
      role: staffUser.role,
      name: staffUser.name,
      email: staffUser.email,
      active: staffUser.active,
    };

    console.log('🎉 Authentication flow completed successfully!');
    console.log('\n📋 Result object:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ The signIn() function should work in the browser.');
    console.log('\nIf it still doesn\'t work, check the browser console (F12) for errors.');

    await supabase.auth.signOut();

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
  }
}

testAuth();
