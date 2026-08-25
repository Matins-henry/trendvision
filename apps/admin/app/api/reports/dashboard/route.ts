import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * GET /api/reports/dashboard
 * Aggregated metrics for the Owner Dashboard.
 * Allowed roles: OWNER, MANAGER
 */
export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden. Owner or Manager role required.' },
        { status: 403 }
      );
    }

    // Run aggregations in parallel
    const [
      revenueAgg,
      expenseAgg,
      totalActiveRoomsCount,
      occupiedRoomsCount,
      activeBookingsCount,
      openMaintenanceCount,
      paymentMethodGroups,
      expenseCategoryGroups,
      recentBookings,
      activeKeycardCount,
      overdueKeycardAlerts,
    ] = await Promise.all([
      // Total revenue from completed payments
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),

      // Total operational expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),

      // Total active rooms in inventory
      prisma.room.count({
        where: { status: 'ACTIVE' },
      }),

      // Currently occupied rooms (CHECKED_IN bookings)
      prisma.booking.count({
        where: { status: 'CHECKED_IN' },
      }),

      // Active bookings blocking inventory
      prisma.booking.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] } },
      }),

      // Open room maintenance issues
      prisma.maintenanceIssue.count({
        where: { status: { in: ['NEEDS_ATTENTION', 'IN_PROGRESS'] } },
      }),

      // Revenue breakdown by payment method
      prisma.payment.groupBy({
        by: ['method'],
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),

      // Expenses breakdown by category
      prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
      }),

      // Recent 5 active bookings for dashboard overview
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          guest: { select: { name: true, email: true } },
          room: { select: { number: true, type: true } },
        },
      }),

      // Active Keycards currently issued
      prisma.booking.count({
        where: { status: 'CHECKED_IN', keycardCode: { not: null } },
      }),

      // Overdue Keycard Security Alerts (Guest past check-out date but keycard still active)
      prisma.booking.findMany({
        where: {
          status: 'CHECKED_IN',
          checkOut: { lt: new Date() },
        },
        select: {
          id: true,
          reference: true,
          keycardCode: true,
          checkOut: true,
          guest: { select: { name: true } },
          room: { select: { number: true } },
        },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.amount ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
    const netProfit = Number((totalRevenue - totalExpenses).toFixed(2));

    const occupancyRate =
      totalActiveRoomsCount > 0
        ? Number(((occupiedRoomsCount / totalActiveRoomsCount) * 100).toFixed(1))
        : 0;

    // Format payment methods map
    const revenueByMethod: Record<string, number> = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      ONLINE: 0,
    };
    paymentMethodGroups.forEach((item) => {
      revenueByMethod[item.method] = Number(item._sum.amount ?? 0);
    });

    // Format expense categories map
    const expensesByCategory = expenseCategoryGroups.map((item) => ({
      category: item.category,
      amount: Number(item._sum.amount ?? 0),
    }));

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalExpenses,
        netProfit,
        totalActiveRooms: totalActiveRoomsCount,
        occupiedRooms: occupiedRoomsCount,
        occupancyRate,
        activeBookings: activeBookingsCount,
        openMaintenanceIssues: openMaintenanceCount,
        activeKeycards: activeKeycardCount,
      },
      revenueByMethod,
      expensesByCategory,
      recentBookings,
      keycardSecurityAlerts: overdueKeycardAlerts,
    });
  } catch (error) {
    console.error('GET /api/reports/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
