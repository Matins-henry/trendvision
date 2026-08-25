import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@hotel/db';

/**
 * POST /api/auth/signin
 * 
 * Server-side endpoint to verify StaffUser after Supabase authentication.
 * This must run server-side because Prisma cannot run in the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const { authId } = await request.json();

    if (!authId) {
      return NextResponse.json(
        { error: 'authId is required' },
        { status: 400 }
      );
    }

    // Query StaffUser by authId using Prisma (server-side only)
    const staffUser = await prisma.staffUser.findUnique({
      where: { authId },
    });

    if (!staffUser) {
      return NextResponse.json(
        { error: 'Account configuration error. Contact administrator.' },
        { status: 404 }
      );
    }

    // Verify active status
    if (!staffUser.active) {
      return NextResponse.json(
        { error: 'Account is inactive. Contact administrator.' },
        { status: 403 }
      );
    }

    // Return StaffAuthResult
    return NextResponse.json({
      authId: staffUser.authId,
      staffUserId: staffUser.id,
      role: staffUser.role,
      name: staffUser.name,
      email: staffUser.email,
      active: staffUser.active,
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
