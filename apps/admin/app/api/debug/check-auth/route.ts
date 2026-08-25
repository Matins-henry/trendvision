import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@hotel/db/src/availability';

/**
 * GET /api/debug/check-auth
 * 
 * Debug endpoint to check what StaffUsers exist
 * REMOVE THIS IN PRODUCTION!
 */
export async function GET(request: NextRequest) {
  try {
    const staffUsers = await prisma.staffUser.findMany({
      select: {
        id: true,
        authId: true,
        email: true,
        role: true,
        active: true,
        name: true,
      },
    });
    
    return NextResponse.json({
      count: staffUsers.length,
      users: staffUsers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Database error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
