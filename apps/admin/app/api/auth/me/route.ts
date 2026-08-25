import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@hotel/db';

/**
 * POST /api/auth/me
 * 
 * Server-side endpoint to get current staff user by authId.
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
        { error: 'Staff user not found' },
        { status: 404 }
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
    console.error('Get current staff error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
