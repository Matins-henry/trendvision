/**
 * Debug script to test login credentials
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './apps/admin/.env.local' });

const email = 'gm@trendvision.com'; // Change this to your email
const password = 'Henry231@'; // Change this to your password

console.log('\n🔍 Testing Login Credentials...\n');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

console.log('📧 Email:', email);
console.log('🔑 Password:', '*'.repeat(password.length));
console.log('');

try {
  // Step 1: Test Supabase Auth login
  console.log('Step 1: Testing Supabase Auth login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('❌ Supabase Auth login FAILED:', authError.message);
    console.log('\n💡 Possible issues:');
    console.log('   1. User does not exist in Supabase Auth');
    console.log('   2. Password is incorrect');
    console.log('   3. Email confirmation is required (check Supabase Auth settings)');
    console.log('\n📝 To fix:');
    console.log('   - Go to Supabase Dashboard > Authentication > Users');
    console.log('   - Verify the user exists with email:', email);
    console.log('   - Check if "Email Confirmation" is disabled in Auth settings');
    process.exit(1);
  }

  console.log('✅ Supabase Auth login SUCCESSFUL!');
  console.log('   User ID (authId):', authData.user.id);
  console.log('   Email:', authData.user.email);
  console.log('');

  // Step 2: Check if StaffUser record exists
  console.log('Step 2: Checking for StaffUser record...');
  const { data: staffUsers, error: staffError } = await supabase
    .from('StaffUser')
    .select('*')
    .eq('authId', authData.user.id);

  if (staffError) {
    console.error('❌ Error querying StaffUser:', staffError.message);
    process.exit(1);
  }

  if (!staffUsers || staffUsers.length === 0) {
    console.error('❌ No StaffUser record found for authId:', authData.user.id);
    console.log('\n💡 The Supabase Auth user exists, but there\'s no matching StaffUser record.');
    console.log('\n📝 To fix:');
    console.log('   - Go to Supabase Dashboard > Table Editor > StaffUser');
    console.log('   - Click "Insert" > "Insert row"');
    console.log('   - Fill in:');
    console.log('     * authId:', authData.user.id);
    console.log('     * name: Your Name');
    console.log('     * email:', email);
    console.log('     * role: MANAGER (or RECEPTIONIST/OWNER)');
    console.log('     * active: true');
    console.log('     * Leave id empty (auto-generated)');
    await supabase.auth.signOut();
    process.exit(1);
  }

  const staffUser = staffUsers[0];
  console.log('✅ StaffUser record found!');
  console.log('   Staff ID:', staffUser.id);
  console.log('   Name:', staffUser.name);
  console.log('   Email:', staffUser.email);
  console.log('   Role:', staffUser.role);
  console.log('   Active:', staffUser.active);
  console.log('');

  // Step 3: Check if account is active
  if (!staffUser.active) {
    console.error('❌ Account is INACTIVE');
    console.log('\n📝 To fix:');
    console.log('   - Go to Supabase Dashboard > Table Editor > StaffUser');
    console.log('   - Find the row with email:', email);
    console.log('   - Set "active" to true');
    await supabase.auth.signOut();
    process.exit(1);
  }

  console.log('✅ Account is ACTIVE');
  console.log('');
  console.log('🎉 ALL CHECKS PASSED! Your login should work.');
  console.log('\n📋 Summary:');
  console.log('   ✓ Supabase Auth user exists');
  console.log('   ✓ StaffUser record exists');
  console.log('   ✓ authId matches');
  console.log('   ✓ Account is active');
  console.log('\nIf login still fails in the browser, try:');
  console.log('   1. Hard refresh the page (Ctrl+Shift+R)');
  console.log('   2. Clear browser cache');
  console.log('   3. Check browser console for errors');

  await supabase.auth.signOut();

} catch (err) {
  console.error('❌ Unexpected error:', err.message);
  console.error(err);
}
