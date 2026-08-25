import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * GET /api/guests - Search/list guests
 * Allowed roles: RECEPTIONIST, MANAGER, OWNER
 */
export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    const whereClause = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
            { phone: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const guests = await prisma.guest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ guests });
  } catch (error) {
    console.error('GET /api/guests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/guests - Create a new guest
 * Allowed roles: RECEPTIONIST, MANAGER
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role === 'OWNER') {
      return NextResponse.json({ error: 'Forbidden. Read-only access.' }, { status: 403 });
    }

    const body = await request.json();
    const name = body.name?.trim();
    const email = body.email?.trim() || null;
    const phone = body.phone?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: 'Guest name is required', field: 'name' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'At least one contact method (email or phone) is required' },
        { status: 400 }
      );
    }

    // Duplicate check: reject if any existing guest shares the same email or phone.
    // Build conditions only for the fields that were actually provided.
    const duplicateConditions: object[] = [];
    if (email) duplicateConditions.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone) duplicateConditions.push({ phone: { equals: phone, mode: 'insensitive' } });

    if (duplicateConditions.length > 0) {
      const existing = await prisma.guest.findFirst({
        where: { OR: duplicateConditions },
        select: { id: true, name: true, email: true, phone: true },
      });

      if (existing) {
        const matchedOn =
          email && existing.email?.toLowerCase() === email.toLowerCase()
            ? `email "${existing.email}"`
            : `phone "${existing.phone}"`;

        return NextResponse.json(
          {
            error: `A guest with this ${matchedOn} already exists. Please search for and select the existing record instead of creating a duplicate.`,
            existingGuest: existing,
          },
          { status: 409 }
        );
      }
    }

    const guest = await prisma.guest.create({
      data: {
        name,
        email,
        phone,
      },
    });

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error('POST /api/guests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
