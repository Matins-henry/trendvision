import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * GET /api/rooms/[id] - Fetch a single room by ID
 * 
 * Requires MANAGER role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch room by ID
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(room);
    
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rooms/[id] - Update a room's details
 * 
 * Requires MANAGER role
 * Validates input and checks room number uniqueness if changed
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate fields if provided
    if (body.number !== undefined) {
      if (typeof body.number !== 'string' || !body.number.trim()) {
        return NextResponse.json(
          { error: 'Room number must be a non-empty string', field: 'number' },
          { status: 400 }
        );
      }
      
      // Check uniqueness only if number is being changed
      if (body.number.trim() !== existingRoom.number) {
        const duplicate = await prisma.room.findUnique({
          where: { number: body.number.trim() },
          select: { id: true },
        });
        
        if (duplicate) {
          return NextResponse.json(
            { error: 'Room number already exists', field: 'number', code: 'DUPLICATE' },
            { status: 400 }
          );
        }
      }
    }
    
    if (body.type !== undefined) {
      if (typeof body.type !== 'string' || !body.type.trim()) {
        return NextResponse.json(
          { error: 'Room type must be a non-empty string', field: 'type' },
          { status: 400 }
        );
      }
    }
    
    if (body.capacity !== undefined) {
      if (typeof body.capacity !== 'number' || body.capacity < 1) {
        return NextResponse.json(
          { error: 'Capacity must be at least 1', field: 'capacity' },
          { status: 400 }
        );
      }
    }
    
    if (body.baseRate !== undefined) {
      if (typeof body.baseRate !== 'number' || body.baseRate <= 0) {
        return NextResponse.json(
          { error: 'Base rate must be greater than 0', field: 'baseRate' },
          { status: 400 }
        );
      }
    }

    // Build update data object
    const updateData: any = {};
    if (body.number !== undefined) updateData.number = body.number.trim();
    if (body.type !== undefined) updateData.type = body.type.trim();
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.baseRate !== undefined) updateData.baseRate = body.baseRate;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.photos !== undefined) updateData.photos = Array.isArray(body.photos) ? body.photos : [];

    // Update room
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedRoom);
    
  } catch (error) {
    console.error('Update room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
