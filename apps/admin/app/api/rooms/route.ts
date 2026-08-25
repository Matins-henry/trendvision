import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * POST /api/rooms - Create a new room
 * 
 * Requires MANAGER role
 * Validates input and checks room number uniqueness
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/rooms - Starting auth check');
    console.log('Cookies:', request.cookies.getAll());
    
    // Check authentication and role
    const staff = await getServerStaff(request as any);
    
    console.log('Staff result:', staff ? `${staff.name} (${staff.role})` : 'null');
    
    if (!staff) {
      console.log('❌ No staff found - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (staff.role !== 'MANAGER') {
      console.log('❌ Staff role is not MANAGER - returning 403');
      return NextResponse.json(
        { error: 'Forbidden. Manager role required.' },
        { status: 403 }
      );
    }
    
    console.log('✅ Auth check passed - proceeding with room creation');

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.number || typeof body.number !== 'string' || !body.number.trim()) {
      return NextResponse.json(
        { error: 'Room number is required', field: 'number' },
        { status: 400 }
      );
    }
    
    if (!body.type || typeof body.type !== 'string' || !body.type.trim()) {
      return NextResponse.json(
        { error: 'Room type is required', field: 'type' },
        { status: 400 }
      );
    }
    
    if (!body.capacity || typeof body.capacity !== 'number' || body.capacity < 1) {
      return NextResponse.json(
        { error: 'Capacity must be at least 1', field: 'capacity' },
        { status: 400 }
      );
    }
    
    if (!body.baseRate || typeof body.baseRate !== 'number' || body.baseRate <= 0) {
      return NextResponse.json(
        { error: 'Base rate must be greater than 0', field: 'baseRate' },
        { status: 400 }
      );
    }

    // Check room number uniqueness
    const existing = await prisma.room.findUnique({
      where: { number: body.number.trim() },
      select: { id: true },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Room number already exists', field: 'number', code: 'DUPLICATE' },
        { status: 400 }
      );
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        number: body.number.trim(),
        type: body.type.trim(),
        capacity: body.capacity,
        baseRate: body.baseRate,
        description: body.description || null,
        photos: Array.isArray(body.photos) ? body.photos : [],
        status: 'ACTIVE', // Default status
      },
    });

    return NextResponse.json(room, { status: 201 });
    
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rooms - List all rooms
 * 
 * Requires MANAGER role
 * Returns all rooms sorted by number
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
    
    if (staff.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden. Manager role required.' },
        { status: 403 }
      );
    }

    // Fetch all rooms sorted by number
    const rooms = await prisma.room.findMany({
      orderBy: {
        number: 'asc',
      },
    });

    return NextResponse.json({ rooms });
    
  } catch (error) {
    console.error('List rooms error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
