import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200, // Limit to latest 200 logs for performance
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      action,
      entityType,
      entityId,
      entityName,
      performedById,
      performedByName,
      performedByRole,
      details,
      changes,
      metadata,
    } = body;

    if (!action || !entityType || !entityId || !entityName || !performedById) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const log = await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        performedById,
        performedByName: performedByName || 'Unknown',
        performedByRole: performedByRole || 'unknown',
        details: details || null,
        changes: changes ? JSON.stringify(changes) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}
