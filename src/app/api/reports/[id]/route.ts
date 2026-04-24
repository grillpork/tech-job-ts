import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get a report by ID
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The report object
 *       404:
 *         description: Report not found
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, imageUrl: true, department: true } },
        assignee: { select: { id: true, name: true, imageUrl: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...report,
      attachments: report.attachments ? JSON.parse(report.attachments) : [],
      tags: report.tags ? JSON.parse(report.tags) : [],
      departments: report.departments ? JSON.parse(report.departments) : [],
      resolvedDepts: report.resolvedDepts ? JSON.parse(report.resolvedDepts) : [],
      forwardedTo: report.forwardedTo ? JSON.parse(report.forwardedTo) : [],
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Update an existing report (status, resolution, forward)
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The updated report
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...body };
    // Strip fields that should not be updated by client
    delete data.id;
    delete data.reporter;
    delete data.assignee;
    delete data.createdAt;
    delete data.reporterId;
    
    if (data.attachments && typeof data.attachments !== 'string') {
      data.attachments = JSON.stringify(data.attachments);
    }
    if (data.tags && typeof data.tags !== 'string') {
      data.tags = JSON.stringify(data.tags);
    }
    if (data.departments && typeof data.departments !== 'string') {
      data.departments = JSON.stringify(data.departments);
    }
    if (data.resolvedDepts && typeof data.resolvedDepts !== 'string') {
      data.resolvedDepts = JSON.stringify(data.resolvedDepts);
    }
    if (data.forwardedTo && typeof data.forwardedTo !== 'string') {
      data.forwardedTo = JSON.stringify(data.forwardedTo);
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data,
      include: {
        reporter: { select: { id: true, name: true, imageUrl: true, department: true } },
        assignee: { select: { id: true, name: true, imageUrl: true } },
      }
    });

    return NextResponse.json({
      ...updatedReport,
      attachments: updatedReport.attachments ? JSON.parse(updatedReport.attachments) : [],
      tags: updatedReport.tags ? JSON.parse(updatedReport.tags) : [],
      departments: updatedReport.departments ? JSON.parse(updatedReport.departments) : [],
      resolvedDepts: updatedReport.resolvedDepts ? JSON.parse(updatedReport.resolvedDepts) : [],
      forwardedTo: updatedReport.forwardedTo ? JSON.parse(updatedReport.forwardedTo) : [],
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Delete a report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success message
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.report.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
