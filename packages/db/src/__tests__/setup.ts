import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Use transaction pooler connection (port 6543) for tests
// Set DATABASE_URL_TEST in .env file
const DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL_TEST or DATABASE_URL must be set for tests');
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

/**
 * Clean up test data from database
 * Deletes records in reverse dependency order to avoid foreign key violations
 * Order: AuditLog -> Payment -> Booking -> Expense -> MaintenanceIssue -> (Guest, Room, StaffUser in parallel)
 */
export async function cleanupDatabase() {
  // Delete in strict sequential dependency order
  await prisma.payment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceIssue.deleteMany();
  
  // Safe to delete parents after all child records are removed
  await prisma.guest.deleteMany();
  await prisma.room.deleteMany();
  await prisma.staffUser.deleteMany();
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * Helper to create a test room
 */
export async function createTestRoom(data?: Partial<{
  number: string;
  type: string;
  capacity: number;
  baseRate: number;
  status: string;
}>) {
  return prisma.room.create({
    data: {
      number: data?.number || `ROOM-${Date.now()}`,
      type: data?.type || 'Standard',
      capacity: data?.capacity || 2,
      baseRate: data?.baseRate || 100.00,
      status: data?.status || 'ACTIVE',
    },
  });
}

/**
 * Helper to create a test guest
 */
export async function createTestGuest(data?: Partial<{
  name: string;
  email: string;
  phone: string;
}>) {
  return prisma.guest.create({
    data: {
      name: data?.name || `Guest ${Date.now()}`,
      email: data?.email || `guest-${Date.now()}@test.com`,
      phone: data?.phone || '1234567890',
    },
  });
}

/**
 * Helper to create a test booking
 */
export async function createTestBooking(data: {
  roomId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  status?: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  source?: 'ONLINE' | 'STAFF';
  totalAmount?: number;
}) {
  return prisma.booking.create({
    data: {
      reference: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId: data.roomId,
      guestId: data.guestId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      status: data.status || 'CONFIRMED',
      source: data.source || 'ONLINE',
      totalAmount: data.totalAmount || 100.00,
    },
  });
}
