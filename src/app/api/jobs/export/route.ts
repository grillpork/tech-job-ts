import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/jobs/export:
 *   get:
 *     summary: Export jobs to CSV
 *     tags: [Jobs]
 *     description: Exports a list of jobs to a CSV formatted file. Requires Admin or Manager role.
 *     responses:
 *       200:
 *         description: CSV file contents
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET() {
  try {
    // 1. Check Authentication and Role for Security
    const session = await getServerSession(authOptions);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session?.user as any)?.role;

    if (!session || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only let Managers and Admins export the data
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Admins and Managers only' }, { status: 403 });
    }

    // 2. Fetch Jobs data
    const jobs = await prisma.job.findMany({
      include: {
        creator: true,
        leadTechnician: true,
        assignedEmployees: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 3. Create CSV Content manually (No external config needed!)
    // Add UTF-8 BOM so Excel reads Thai characters correctly
    const BOM = '\uFEFF';
    
    const headers = [
      'Job ID',
      'Title',
      'Status',
      'Priority',
      'Type',
      'Creator',
      'Lead Technician',
      'Employees Assigned',
      'Created Date'
    ].join(',');

    const rows = jobs.map(job => {
      // Escape quotes and wrap with quotes to handle commas within text
      const escapeCSV = (str: string | null | undefined) => {
        if (!str) return '""';
        return `"${String(str).replace(/"/g, '""')}"`;
      };

      const employeeNames = job.assignedEmployees.map(e => e.name).join('; ');

      return [
        escapeCSV(job.id),
        escapeCSV(job.title),
        escapeCSV(job.status),
        escapeCSV(job.priority),
        escapeCSV(job.type),
        escapeCSV(job.creator?.name),
        escapeCSV(job.leadTechnician?.name),
        escapeCSV(employeeNames),
        escapeCSV(job.createdAt.toISOString())
      ].join(',');
    });

    const csvContent = BOM + [headers, ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="jobs_export.csv"'
      }
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Server error during export' }, { status: 500 });
  }
}
