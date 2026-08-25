import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth';
import { prisma } from '@hotel/db/src/availability';

/**
 * POST /api/expenses - Create a new expense
 * 
 * Requires MANAGER role
 * Validates input including amount precision
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
      return NextResponse.json(
        { error: 'Description is required', field: 'description' },
        { status: 400 }
      );
    }
    
    if (body.description.trim().length > 255) {
      return NextResponse.json(
        { error: 'Description must be 255 characters or less', field: 'description' },
        { status: 400 }
      );
    }
    
    if (!body.category || typeof body.category !== 'string' || !body.category.trim()) {
      return NextResponse.json(
        { error: 'Category is required', field: 'category' },
        { status: 400 }
      );
    }
    
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0', field: 'amount' },
        { status: 400 }
      );
    }

    // Validate amount has max 2 decimal places
    const amountStr = body.amount.toFixed(10); // Use high precision to detect extra decimals
    const decimalPart = amountStr.split('.')[1];
    const significantDecimals = decimalPart?.replace(/0+$/, '').length || 0;
    
    if (significantDecimals > 2) {
      return NextResponse.json(
        { error: 'Amount must have at most 2 decimal places', field: 'amount' },
        { status: 400 }
      );
    }
    
    if (!body.date || typeof body.date !== 'string') {
      return NextResponse.json(
        { error: 'Date is required', field: 'date' },
        { status: 400 }
      );
    }
    
    // Validate date is valid ISO 8601
    const dateObj = new Date(body.date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Date must be a valid ISO 8601 date', field: 'date' },
        { status: 400 }
      );
    }
    
    // Validate notes if provided
    if (body.notes && typeof body.notes === 'string' && body.notes.length > 1000) {
      return NextResponse.json(
        { error: 'Notes must be 1000 characters or less', field: 'notes' },
        { status: 400 }
      );
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        description: body.description.trim(),
        category: body.category.trim(),
        amount: body.amount,
        date: dateObj,
        notes: body.notes?.trim() || null,
        loggedById: staff.staffUserId,
      },
    });

    return NextResponse.json(expense, { status: 201 });
    
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


/**
 * GET /api/expenses - List expenses with optional filtering
 * 
 * Requires MANAGER or OWNER role
 * Query params: ?category=Utilities (optional)
 * Returns expenses sorted by date descending with total
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[TIMING] GET /api/expenses - START');
  
  try {
    // Check authentication and role
    const authStart = Date.now();
    const staff = await getServerStaff(request as any);
    console.log(`[TIMING] getServerStaff took ${Date.now() - authStart}ms`);
    
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check role - both MANAGER and OWNER can view expenses
    if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Forbidden. Manager or Owner role required.' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build where clause
    const whereClause = category ? { category } : {};
    console.log('[TIMING] Query params parsed, where clause built');

    // Fetch expenses with loggedBy relation
    const queryStart = Date.now();
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        loggedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    console.log(`[TIMING] prisma.expense.findMany took ${Date.now() - queryStart}ms, returned ${expenses.length} rows`);

    // Calculate total
    const aggStart = Date.now();
    const aggregateResult = await prisma.expense.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
    });
    console.log(`[TIMING] prisma.expense.aggregate took ${Date.now() - aggStart}ms`);

    const total = aggregateResult._sum.amount?.toString() || '0.00';

    console.log(`[TIMING] GET /api/expenses - TOTAL TIME: ${Date.now() - startTime}ms`);
    
    return NextResponse.json({
      expenses,
      total,
    });
    
  } catch (error) {
    console.error('List expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
