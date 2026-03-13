import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns aggregated statistics for the dashboard, such as job counts and inventory alerts.
 *     responses:
 *       200:
 *         description: Dashboard statistics object
 */
export async function GET() {
  try {
    const defaultLowStockThreshold = 10;

    // Parallel fetch basic counts
    const [
      totalJobs,
      completedJobs,
      pendingJobs,
      inProgressJobs,
      openReports,
      lowStockItems,
      allJobs
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'completed' } }),
      prisma.job.count({ where: { status: 'pending' } }),
      prisma.job.count({ where: { status: { in: ['in_progress', 'pending_approval'] } } }),
      prisma.report.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      prisma.inventory.count({ where: { quantity: { lte: defaultLowStockThreshold } } }),
      prisma.job.findMany({
        select: {
          id: true,
          status: true,
          departments: true,
          createdAt: true,
        }
      })
    ]);

    // Calculate trends (last 180 days) and department stats
    const now = new Date();
    const past180Milli = now.getTime() - (180 * 24 * 60 * 60 * 1000);
    const past180Date = new Date(past180Milli);

    const trends: Record<string, any>[] = [];
    const departmentStats: Record<string, number> = {};

    allJobs.forEach(job => {
      // Departments calc
      const rawDepts = job.departments;
      let deptsArray: string[] = [];
      if (rawDepts) {
         try {
           deptsArray = JSON.parse(rawDepts);
         } catch {
           deptsArray = [];
         }
      }
      
      deptsArray.forEach(dept => {
        departmentStats[dept] = (departmentStats[dept] || 0) + 1;
      });
    });

    // Format top departments
    const topDepartments = Object.keys(departmentStats)
      .map(name => ({ name, count: departmentStats[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        totalJobs,
        completedJobs,
        pendingJobs,
        inProgressJobs,
        openReports,
        lowStockItems
      },
      topDepartments,
      message: "Trends logic can be expanded further frontend/backend depending on the exact chart data format needed."
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
