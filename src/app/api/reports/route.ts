import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports
 *     description: Returns a list of reports. Configurable via status and type queries.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of reports
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build the query
    const query: any = {
      include: {
        reporter: { select: { id: true, name: true, imageUrl: true } },
        assignee: { select: { id: true, name: true, imageUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    };

    if (status) query.where = { ...query.where, status };
    if (type) query.where = { ...query.where, type };

    const reports = await prisma.report.findMany(query);
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new report
 *     description: Create a report or issue. Requires title, type, and reporterId.
 *     responses:
 *       201:
 *         description: The created report
 *       400:
 *         description: Missing required fields
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // required fields
    if (!body.title || !body.type || !body.reporterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type,
        status: body.status || 'open',
        priority: body.priority || 'medium',
        reporterId: body.reporterId,
        assigneeId: body.assigneeId || null,
        relatedJobId: body.relatedJobId || null,
        relatedInventoryId: body.relatedInventoryId || null,
        attachments: body.attachments ? JSON.stringify(body.attachments) : null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
      },
      include: {
        reporter: true,
        assignee: true,
      }
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
