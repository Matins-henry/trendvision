import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma, isRoomAvailable, calculateBookingTotal } from '@hotel/db/src/index';

const FALLBACK_ROOMS = [
  {
    id: 'fallback-std-101',
    number: '101',
    type: 'Standard',
    capacity: 2,
    baseRate: 120000,
    description: 'A masterfully crafted bedroom retreat featuring ensuite bath, custom LED ambient lighting, Smart TV, and ultra-fast fiber Wi-Fi.',
    photos: ['/hotel-bedroom-suite.jpg', '/hotel-hallway-suite.jpg'],
    isAvailable: true,
    totalStayPrice: 120000,
    stayNights: 1,
  },
  {
    id: 'fallback-dlx-201',
    number: '201',
    type: 'Deluxe',
    capacity: 3,
    baseRate: 180000,
    description: 'Spacious master bedroom paired with a separate private parlor lounge, plush tufted seating, executive work desk, and ambient lighting.',
    photos: ['/hotel-parlor-suite.jpg', '/hotel-bedroom-suite.jpg'],
    isAvailable: true,
    totalStayPrice: 180000,
    stayNights: 1,
  },
  {
    id: 'fallback-apt-301',
    number: '301',
    type: 'Apartment',
    capacity: 4,
    baseRate: 250000,
    description: 'The ultimate boutique residence experience featuring a private fully-equipped kitchenette, spacious parlor lounge, and master suite.',
    photos: ['/hotel-hallway-suite.jpg', '/hotel-parlor-suite.jpg'],
    isAvailable: true,
    totalStayPrice: 250000,
    stayNights: 1,
  },
];

/**
 * GET /api/public/rooms
 * List active rooms with real-time date availability search.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkInParam = searchParams.get('checkIn');
    const checkOutParam = searchParams.get('checkOut');
    const roomType = searchParams.get('type')?.trim();

    let rooms: any[] = [];
    try {
      const whereConditions: any = { status: 'ACTIVE' };
      if (roomType && roomType !== 'ALL') {
        whereConditions.type = roomType;
      }

      rooms = await prisma.room.findMany({
        where: whereConditions,
        orderBy: { baseRate: 'asc' },
      });
    } catch (dbErr) {
      console.warn('Database connection warning in GET /api/public/rooms, serving fallback catalog:', dbErr);
      rooms = [];
    }

    if (!rooms || rooms.length === 0) {
      const filteredFallback = roomType && roomType !== 'ALL'
        ? FALLBACK_ROOMS.filter(r => r.type === roomType)
        : FALLBACK_ROOMS;

      return NextResponse.json({
        count: filteredFallback.length,
        searchDates: checkInParam && checkOutParam ? { checkIn: checkInParam, checkOut: checkOutParam } : null,
        rooms: filteredFallback,
      });
    }

    let checkInDate: Date | null = null;
    let checkOutDate: Date | null = null;

    if (checkInParam && checkOutParam) {
      const parsedIn = new Date(checkInParam);
      const parsedOut = new Date(checkOutParam);
      if (!isNaN(parsedIn.getTime()) && !isNaN(parsedOut.getTime()) && parsedIn < parsedOut) {
        checkInDate = parsedIn;
        checkOutDate = parsedOut;
      }
    }

    const roomResults = await Promise.all(
      rooms.map(async (room) => {
        let isAvailable = true;
        let totalStayPrice = Number(room.baseRate);
        let stayNights = 1;

        if (checkInDate && checkOutDate) {
          try {
            isAvailable = await isRoomAvailable(room.id, checkInDate, checkOutDate);
          } catch {
            isAvailable = true;
          }
          totalStayPrice = calculateBookingTotal(checkInDate, checkOutDate, Number(room.baseRate));
          const diffMs = checkOutDate.getTime() - checkInDate.getTime();
          stayNights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }

        return {
          id: room.id,
          number: room.number,
          type: room.type,
          capacity: room.capacity,
          baseRate: Number(room.baseRate),
          description: room.description,
          photos: room.photos && room.photos.length > 0 ? room.photos : ['/hotel-bedroom-suite.jpg'],
          isAvailable,
          totalStayPrice,
          stayNights,
        };
      })
    );

    return NextResponse.json({
      count: roomResults.length,
      searchDates:
        checkInDate && checkOutDate
          ? { checkIn: checkInDate.toISOString(), checkOut: checkOutDate.toISOString() }
          : null,
      rooms: roomResults,
    });
  } catch (error) {
    console.error('GET /api/public/rooms error:', error);
    return NextResponse.json({
      count: FALLBACK_ROOMS.length,
      searchDates: null,
      rooms: FALLBACK_ROOMS,
    });
  }
}
