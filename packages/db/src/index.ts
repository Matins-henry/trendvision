/**
 * Database Package - Shared database client and business logic
 * 
 * Exports Prisma client and room availability logic
 */

export { prisma } from './availability';
export { isRoomAvailable } from './availability';
export { generateBookingReference, calculateBookingTotal } from './bookingUtils';
export * from './rates';
export * from './email';


