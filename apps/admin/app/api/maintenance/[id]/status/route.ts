import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * PATCH /api/maintenance/[id]/status - Update maintenance issue status
 * 
 * Requires MANAGER role
 * Handles resolvedAt timestamp based on status transitions
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const params = context.params instanceof Promise ? await context.params : context.params;
    
    // Check authentication and role
    const staff = await getServerStaff(request as any);
    
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (staff.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden. Manager role required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate status
    const validStatuses = ['NEEDS_ATTENTION', 'IN_PROGRESS', 'RESOLVED'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be NEEDS_ATTENTION, IN_PROGRESS, or RESOLVED', field: 'status' },
        { status: 400 }
      );
    }

    // Get current issue to check old status
    const currentIssue = await prisma.maintenanceIssue.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!currentIssue) {
      return NextResponse.json(
        { error: 'Maintenance issue not found' },
        { status: 404 }
      );
    }

    // Build update data based on status transition
    const updateData: any = { status: body.status };

    if (body.status === 'RESOLVED') {
      // Setting to RESOLVED: set resolvedAt timestamp
      updateData.resolvedAt = new Date();
    } else if (currentIssue.status === 'RESOLVED' && body.status !== 'RESOLVED') {
      // Moving from RESOLVED to another status: clear resolvedAt
      updateData.resolvedAt = null;
    }

    // Update the issue
    const updatedIssue = await prisma.maintenanceIssue.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedIssue);
    
  } catch (error) {
    console.error('Update maintenance status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
