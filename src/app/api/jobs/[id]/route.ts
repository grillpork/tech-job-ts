import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  sendSuccess, 
  sendError, 
  sendUnauthorized, 
  sendForbidden, 
  sendServerError 
} from '@/lib/api-utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        creator: true,
        leadTechnician: true,
        assignedEmployees: true,
        tasks: { orderBy: { order: 'asc' } },
        workLogs: { orderBy: { createdAt: 'desc' }, include: { updatedBy: true } }
      }
    });

    if (!job) return sendError('ไม่พบใบงานนี้', 404);

    const formattedJob = {
      ...job,
      departments: job.departments ? JSON.parse(job.departments) : [],
      location: job.location ? JSON.parse(job.location) : null,
      locationImages: job.locationImages ? JSON.parse(job.locationImages) : [],
      attachments: job.attachments ? JSON.parse(job.attachments) : [],
      beforeImages: job.beforeImages ? JSON.parse(job.beforeImages) : [],
      afterImages: job.afterImages ? JSON.parse(job.afterImages) : [],
      usedInventory: job.usedInventory ? JSON.parse(job.usedInventory) : [],
    };

    return sendSuccess(formattedJob);
  } catch (error) {
    return sendServerError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    const user = session.user as any;
    const body = await request.json();
    
    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) return sendError('ไม่พบใบงานนี้', 404);

    const { 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      creatorId, assignedEmployeeIds, leadTechnicianId, tasks, departments,
      location, locationImages, attachments, usedInventory, beforeImages, afterImages,
      ...apiData 
    } = body;

    const updateData: any = { ...apiData };

    if (departments !== undefined) updateData.departments = departments ? JSON.stringify(departments) : null;
    if (location !== undefined) updateData.location = location ? JSON.stringify(location) : null;
    if (locationImages !== undefined) updateData.locationImages = locationImages ? JSON.stringify(locationImages) : null;
    if (attachments !== undefined) updateData.attachments = attachments ? JSON.stringify(attachments) : null;
    if (usedInventory !== undefined) updateData.usedInventory = usedInventory ? JSON.stringify(usedInventory) : null;
    if (beforeImages !== undefined) updateData.beforeImages = beforeImages ? JSON.stringify(beforeImages) : null;
    if (afterImages !== undefined) updateData.afterImages = afterImages ? JSON.stringify(afterImages) : null;

    if (leadTechnicianId !== undefined) {
      if (leadTechnicianId === null) updateData.leadTechnician = { disconnect: true };
      else updateData.leadTechnician = { connect: { id: leadTechnicianId } };
    }

    if (assignedEmployeeIds !== undefined) {
      updateData.assignedEmployees = {
        set: assignedEmployeeIds.map((eid: string) => ({ id: eid }))
      };
    }

    if (tasks !== undefined) {
        updateData.tasks = {
            deleteMany: {},
            create: tasks.map((t: any, i: number) => ({
                description: t.description,
                details: t.details,
                order: t.order ?? i,
                isCompleted: t.isCompleted ?? false
            }))
        };
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        creator: true,
        leadTechnician: true,
        assignedEmployees: true,
        tasks: { orderBy: { order: 'asc' } }
      }
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "UPDATE",
          entityType: "JOB",
          entityId: id,
          entityName: updatedJob.title,
          performedById: user.id,
          performedByName: user.name || "Unknown",
          performedByRole: user.role || "unknown",
          details: `แก้ไขข้อมูลใบงาน: ${updatedJob.title}`,
          changes: JSON.stringify({ before: existingJob, after: updatedJob })
        }
      });
    } catch (e) { console.error("Audit log failed", e); }

    const formattedUpdatedJob = {
      ...updatedJob,
      departments: updatedJob.departments ? JSON.parse(updatedJob.departments) : [],
      location: updatedJob.location ? JSON.parse(updatedJob.location) : null,
      locationImages: updatedJob.locationImages ? JSON.parse(updatedJob.locationImages) : [],
      attachments: updatedJob.attachments ? JSON.parse(updatedJob.attachments) : [],
      beforeImages: updatedJob.beforeImages ? JSON.parse(updatedJob.beforeImages) : [],
      afterImages: updatedJob.afterImages ? JSON.parse(updatedJob.afterImages) : [],
      usedInventory: updatedJob.usedInventory ? JSON.parse(updatedJob.usedInventory) : [],
    };

    return sendSuccess(formattedUpdatedJob, 'บันทึกการแก้ไขเรียบร้อยแล้ว');
  } catch (error) {
    return sendServerError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    const user = session.user as any;
    if (user.role !== 'admin' && user.role !== 'manager') return sendForbidden();

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return sendError('ไม่พบใบงานที่ต้องการลบ', 404);

    await prisma.job.delete({ where: { id } });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "DELETE",
          entityType: "JOB",
          entityId: id,
          entityName: job.title,
          performedById: user.id,
          performedByName: user.name || "Unknown",
          performedByRole: user.role || "unknown",
          details: `ลบใบงาน: ${job.title}`
        }
      });
    } catch (e) { console.error("Audit log failed", e); }

    return sendSuccess(null, 'ลบใบงานเรียบร้อยแล้ว');
  } catch (error) {
    return sendServerError(error);
  }
}
