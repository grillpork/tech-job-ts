import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  sendSuccess, 
  sendUnauthorized, 
  sendForbidden, 
  sendError, 
  sendServerError 
} from '@/lib/api-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const jobs = await prisma.job.findMany({
      include: {
        creator: { select: { id: true, name: true, role: true } },
        leadTechnician: { select: { id: true, name: true, role: true } },
        assignedEmployees: { select: { id: true, name: true, role: true } },
        reports: { select: { id: true, title: true, status: true } },
        tasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(jobs, 'ดึงข้อมูลใบงานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    const allowedRoles = ['admin', 'manager', 'lead_technician'];
    if (!allowedRoles.includes(user.role)) {
      return sendForbidden('คุณไม่มีสิทธิ์ในการสร้างใบงาน');
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      priority,
      leadTechnicianId,
      assignedEmployeeIds,
      tasks,
      usedInventory,
      location,
      startDate,
      endDate,
      customerType,
      customerName,
      customerPhone,
      customerCompanyName,
      customerTaxId,
      customerAddress,
    } = body;

    if (!title) return sendError("กรุณาระบุหัวข้อใบงาน");

    // Start Transaction for complex creation
    const newJob = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          title,
          description,
          type,
          priority,
          status: 'pending',
          creatorId: user.id,
          leadTechnicianId: leadTechnicianId || null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          location: typeof location === 'object' ? JSON.stringify(location) : location,
          assignedEmployees: {
            connect: (assignedEmployeeIds || []).map((id: string) => ({ id })),
          },
          usedInventory: usedInventory ? JSON.stringify(usedInventory) : '[]',
          customerType,
          customerName,
          customerPhone,
          customerCompanyName,
          customerTaxId,
          customerAddress,
        },
      });

      // Create initial tasks if provided
      if (tasks && Array.isArray(tasks)) {
        await tx.task.createMany({
          data: tasks.map((t: any, index: number) => ({
            jobId: job.id,
            description: t.description,
            order: index,
          })),
        });
      }

      return job;
    });

    // Audit Logging
    try {
      await prisma.auditLog.create({
        data: {
          action: "CREATE",
          entityType: "JOB",
          entityId: newJob.id,
          entityName: newJob.title,
          performedById: user.id,
          performedByName: user.name,
          performedByRole: user.role,
          details: `Created new job: ${newJob.title}`,
        }
      });
    } catch (logError) {
       console.error("AuditLog Fail:", logError);
    }

    return sendSuccess(newJob, 'สร้างใบงานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}
