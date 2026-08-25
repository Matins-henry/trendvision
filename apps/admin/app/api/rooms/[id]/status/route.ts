import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * PATCH /api/rooms/[id]/status - Toggle room status between ACTIVE and OUT_OF_SERVICE
 * Allowed role: MANAGER
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden. Manager role required.' }, { status: 403 });
    }

    const { id } = await params;

    const room = await prisma.room.findUnique({
      where: { id },
      select: { id: true, status: true, number: true },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const newStatus = room.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      id: updatedRoom.id,
      number: updatedRoom.number,
      status: updatedRoom.status,
      message: `Room ${updatedRoom.number} is now ${newStatus}`,
    });
  } catch (error) {
    console.error('Toggle room status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
