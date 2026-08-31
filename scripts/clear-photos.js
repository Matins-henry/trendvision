const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rooms = await prisma.room.findMany();
    console.log('Current DB Rooms Count:', rooms.length);
    for (const r of rooms) {
      console.log(`Room ${r.number}:`, r.photos);
    }

    const res = await prisma.room.updateMany({
      data: {
        photos: [],
      },
    });
    console.log('Successfully cleared room photos from DB:', res);
  } catch (err) {
    console.error('Error clearing photos:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
