import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendSuccess, sendUnauthorized, sendServerError } from '@/lib/api-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    // 1. Job Statistics
    const totalJobs = await prisma.job.count();
    const jobsByStatus = await prisma.job.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // 2. Inventory Statistics
    const totalInventoryItems = await prisma.inventory.count();
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: prisma.inventory.fields.minStock
        }
      },
      select: { id: true, name: true, quantity: true, minStock: true }
    });

    // 3. Inventory Requests Statistics (Pending)
    const pendingInventoryRequests = await prisma.inventoryRequest.count({
      where: { status: 'pending' }
    });

    // 4. Job Completion Statistics (Last 6 Months Trend)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyCompletions = await prisma.job.findMany({
      where: {
        status: 'completed',
        updatedAt: { gte: sixMonthsAgo }
      },
      select: { updatedAt: true }
    });

    // Process monthly data for chart
    const monthlyData: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthYear = d.toLocaleString('th-TH', { month: 'short', year: '2-digit' });
        monthlyData[monthYear] = 0;
    }

    monthlyCompletions.forEach(job => {
        const monthYear = job.updatedAt.toLocaleString('th-TH', { month: 'short', year: '2-digit' });
        if (monthlyData[monthYear] !== undefined) {
            monthlyData[monthYear]++;
        }
    });

    const completionTrend = Object.entries(monthlyData)
        .map(([name, count]) => ({ name, count }))
        .reverse();

    const summary = {
      jobs: {
        total: totalJobs,
        pending: jobsByStatus.find(s => s.status === 'pending')?._count.id || 0,
        in_progress: jobsByStatus.find(s => s.status === 'in_progress')?._count.id || 0,
        completed: jobsByStatus.find(s => s.status === 'completed')?._count.id || 0,
      },
      inventory: {
        totalItems: totalInventoryItems,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems,
        pendingRequests: pendingInventoryRequests
      },
      trends: {
        completionTrend
      }
    };

    return sendSuccess(summary, 'ดึงข้อมูลวิเคราะห์สำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}
