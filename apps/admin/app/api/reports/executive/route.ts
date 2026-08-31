import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth/src/server-auth';
import { prisma } from '@hotel/db/src/availability';

// Simple in-memory/DB store for Executive Reports submitted by Managers to Owner
// Store report items linked to staff author
export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Query AuditLogs with action 'EXECUTIVE_REPORT_SUBMITTED'
    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'EXECUTIVE_REPORT_SUBMITTED',
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const reports = logs.map((log) => ({
      id: log.id,
      title: (log.metadata as any)?.title || 'Daily Operational Summary',
      content: (log.metadata as any)?.content || '',
      shiftDate: (log.metadata as any)?.shiftDate || log.createdAt,
      submittedBy: log.actor ? log.actor.name : 'Manager',
      authorRole: log.actor ? log.actor.role : 'MANAGER',
      createdAt: log.createdAt,
    }));

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Failed to fetch executive reports:', error);
    return NextResponse.json({ error: 'Failed to fetch executive reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const staff = await getServerStaff(request);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'MANAGER' && staff.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only Managers and Owners can submit reports' }, { status: 403 });
    }

    const { title, content, shiftDate } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Report title and content are required' }, { status: 400 });
    }

    // Create AuditLog entry with action 'EXECUTIVE_REPORT_SUBMITTED'
    const reportLog = await prisma.auditLog.create({
      data: {
        actorId: staff.staffUserId,
        action: 'EXECUTIVE_REPORT_SUBMITTED',
        entity: 'ExecutiveReport',
        entityId: staff.staffUserId,
        metadata: {
          title,
          content,
          shiftDate: shiftDate || new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: reportLog.id,
        title,
        content,
        shiftDate,
        submittedBy: staff.name,
        authorRole: staff.role,
        createdAt: reportLog.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to submit executive report:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
