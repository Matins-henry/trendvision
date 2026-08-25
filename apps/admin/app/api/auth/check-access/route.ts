import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@hotel/db';
import { canAccessRoute } from '@hotel/auth';
import { Role } from '@prisma/client';

/**
 * POST /api/auth/check-access
 * 
 * Server-side endpoint to check if user has access to a specific route.
 * Uses hierarchical role permissions: higher roles inherit lower-tier access.
 * This must run server-side because Prisma cannot run in Edge runtime.
 */
export async function POST(request: NextRequest) {
  try {
    const { authId, pathname } = await request.json();

    if (!authId || !pathname) {
      return NextResponse.json(
        { error: 'authId and pathname are required' },
        { status: 400 }
      );
    }

    // Query StaffUser by authId using Prisma (server-side only)
    const staffUser = await prisma.staffUser.findUnique({
      where: { authId },
      select: { role: true, active: true },
    });

    if (!staffUser) {
      return NextResponse.json(
        { 
          hasAccess: false,
          reason: 'not_found',
          error: 'Staff user not found'
        },
        { status: 200 }
      );
    }

    if (!staffUser.active) {
      return NextResponse.json(
        { 
          hasAccess: false,
          reason: 'inactive',
          error: 'Account is inactive'
        },
        { status: 200 }
      );
    }

    // Check access using hierarchical permissions
    const hasAccess = canAccessRoute(staffUser.role as Role, pathname);

    return NextResponse.json({
      hasAccess,
      reason: hasAccess ? 'authorized' : 'insufficient_permissions',
      role: staffUser.role,
    });
  } catch (error) {
    console.error('Check access error:', error);
    return NextResponse.json(
      { 
        hasAccess: false,
        reason: 'error',
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
