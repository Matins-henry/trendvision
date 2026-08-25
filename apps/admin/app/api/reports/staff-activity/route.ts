import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * GET /api/reports/staff-activity
 * Manager Activity & Performance Report.
 * Query params: ?period=today|7d|30d|all
 * Allowed roles: MANAGER, OWNER
 */
export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request as any);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Forbidden. Manager or Owner role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? 'all';

    // Calculate date filter threshold
    let startDate: Date | undefined;
    const now = new Date();

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const dateFilter = startDate ? { gte: startDate } : undefined;

    // Fetch all active staff users
    const staffMembers = await prisma.staffUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
      orderBy: { name: 'asc' },
    });

    // Compute activity metrics for each staff user in parallel
    const staffActivity = await Promise.all(
      staffMembers.map(async (member) => {
        const [
          bookingsCreatedCount,
          paymentsHandled,
          expensesLogged,
          maintenanceFlaggedCount,
        ] = await Promise.all([
          // Bookings created by staff
          prisma.booking.count({
            where: {
              createdById: member.id,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
          }),

          // Payments handled by staff
          prisma.payment.aggregate({
            where: {
              handledById: member.id,
              status: 'COMPLETED',
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
            _count: true,
            _sum: { amount: true },
          }),

          // Expenses logged by staff
          prisma.expense.aggregate({
            where: {
              loggedById: member.id,
              ...(dateFilter ? { date: dateFilter } : {}),
            },
            _count: true,
            _sum: { amount: true },
          }),

          // Maintenance issues flagged by staff
          prisma.maintenanceIssue.count({
            where: {
              flaggedById: member.id,
              ...(dateFilter ? { createdAt: dateFilter } : {}),
            },
          }),
        ]);

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          active: member.active,
          bookingsCreatedCount,
          paymentsHandledCount: paymentsHandled._count ?? 0,
          paymentsHandledTotal: Number(paymentsHandled._sum.amount ?? 0),
          expensesLoggedCount: expensesLogged._count ?? 0,
          expensesLoggedTotal: Number(expensesLogged._sum.amount ?? 0),
          maintenanceFlaggedCount,
        };
      })
    );

    // Period reconciliation totals
    const [periodRevenue, periodExpenses] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(periodRevenue._sum.amount ?? 0);
    const totalExpenses = Number(periodExpenses._sum.amount ?? 0);
    const netIncome = Number((totalIncome - totalExpenses).toFixed(2));

    return NextResponse.json({
      period,
      staffActivity,
      reconciliation: {
        totalIncome,
        totalExpenses,
        netIncome,
      },
    });
  } catch (error) {
    console.error('GET /api/reports/staff-activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
