import { NextRequest, NextResponse } from 'next/server';
import { getServerStaff } from '@hotel/auth/src/server-auth';
import { prisma } from '@hotel/db/src/availability';

export async function GET(request: NextRequest) {
  try {
    const staff = await getServerStaff(request);
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (staff.role !== 'OWNER' && staff.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch recent audit logs with staff actor info
    const logs = await prisma.auditLog.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    const auditLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      actorName: log.actor ? log.actor.name : 'System / Online Guest',
      actorRole: log.actor ? log.actor.role : 'GUEST',
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
