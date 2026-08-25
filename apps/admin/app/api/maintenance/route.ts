import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * POST /api/maintenance - Create a new maintenance issue
 * 
 * Requires MANAGER role
 * Validates input and optional room association
 */
export async function POST(request: NextRequest) {
  try {
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
    
    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Title is required', field: 'title' },
        { status: 400 }
      );
    }
    
    if (body.title.trim().length > 255) {
      return NextResponse.json(
        { error: 'Title must be 255 characters or less', field: 'title' },
        { status: 400 }
      );
    }
    
    if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
      return NextResponse.json(
        { error: 'Description is required', field: 'description' },
        { status: 400 }
      );
    }

    // Validate roomId if provided
    if (body.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: body.roomId },
        select: { id: true },
      });
      
      if (!room) {
        return NextResponse.json(
          { error: 'Room not found', field: 'roomId' },
          { status: 404 }
        );
      }
    }

    // Create maintenance issue
    const issue = await prisma.maintenanceIssue.create({
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        status: body.status || 'NEEDS_ATTENTION',
        roomId: body.roomId || null,
        flaggedById: staff.staffUserId,
      },
    });

    return NextResponse.json(issue, { status: 201 });
    
  } catch (error) {
    console.error('Create maintenance issue error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


/**
 * GET /api/maintenance - List maintenance issues with optional filtering
 * 
 * Requires MANAGER or OWNER role
 * Query params: 
 *   ?status=NEEDS_ATTENTION (optional, MANAGER only)
 *   ?activeOnly=true (optional, shows only NEEDS_ATTENTION and IN_PROGRESS)
 * 
 * OWNER always sees only active issues (NEEDS_ATTENTION, IN_PROGRESS)
 * MANAGER can see all issues or filter by status
 * 
 * Sorting:
 *   - OWNER: createdAt ascending (oldest first - highlights issues needing attention)
 *   - MANAGER: createdAt descending (newest first)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and role
    const staff = await getServerStaff(request as any);
    
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check role - both MANAGER and OWNER can view maintenance issues
    if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Forbidden. Manager or Owner role required.' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Build where clause based on role and filters
    let whereClause: any = {};

    if (staff.role === 'OWNER') {
      // OWNER always sees only active issues
      whereClause.status = { in: ['NEEDS_ATTENTION', 'IN_PROGRESS'] };
    } else {
      // MANAGER can use filters
      // Priority: specific status filter > activeOnly flag > all issues
      if (statusParam) {
        // Specific status filter takes precedence
        whereClause.status = statusParam;
      } else if (activeOnly) {
        // If activeOnly is set but no specific status, show active issues
        whereClause.status = { in: ['NEEDS_ATTENTION', 'IN_PROGRESS'] };
      }
      // Otherwise, no filter - show all issues
    }

    // Fetch maintenance issues with relations
    const issues = await prisma.maintenanceIssue.findMany({
      where: whereClause,
      include: {
        room: {
          select: {
            id: true,
            number: true,
          },
        },
        flaggedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: staff.role === 'OWNER' ? 'asc' : 'desc',
      },
    });

    return NextResponse.json({
      issues,
    });
    
  } catch (error) {
    console.error('List maintenance issues error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
