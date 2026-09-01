import { NextResponse } from 'next/server';
import { prisma } from '@hotel/db/src/index';

/**
 * GET /api/public/gallery
 * Returns all active room photos and video items dynamically uploaded by manager/owner.
 */
export async function GET() {
  try {
    let dbRooms: any[] = [];
    try {
      dbRooms = await prisma.room.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, number: true, type: true, description: true, photos: true },
        orderBy: { baseRate: 'asc' },
      });
    } catch {
      dbRooms = [];
    }

    const galleryItems: any[] = [];

    // Extract photos uploaded by manager for active suites
    if (dbRooms && dbRooms.length > 0) {
      dbRooms.forEach((room) => {
        if (room.photos && room.photos.length > 0) {
          room.photos.forEach((photoUrl: string, idx: number) => {
            galleryItems.push({
              id: `room-photo-${room.id}-${idx}`,
              title: `${room.type} Suite${room.number ? ` — Room ${room.number}` : ''}`,
              category: room.type === 'Apartment' ? 'Architecture' : 'Suites',
              type: 'image',
              url: photoUrl,
              caption: room.description || `Luxury ${room.type} accommodation at Trend Vision.`,
            });
          });
        }
      });
    }

    // Always include official residence walkthrough video
    galleryItems.push({
      id: 'trend-residence-video',
      title: 'Ambient Residence Suite Video Tour',
      category: 'Video',
      type: 'video',
      url: '/trend.mp4',
      caption: 'Experience the serene VVIP atmosphere and refined interior styling of Trend Vision.',
    });

    return NextResponse.json({
      count: galleryItems.length,
      items: galleryItems,
    });
  } catch (err) {
    console.error('GET /api/public/gallery error:', err);
    return NextResponse.json({
      count: 0,
      items: [],
    });
  }
}
