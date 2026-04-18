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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    const user = session.user as any;
    if (!['admin', 'manager', 'lead_technician'].includes(user.role)) return sendForbidden();

    const body = await request.json();
    const { status, note } = body;

    const existingRequest = await prisma.inventoryRequest.findUnique({
      where: { id },
      include: { job: true }
    });
    
    if (!existingRequest) return sendError('ไม่พบคำขอเบิกที่ต้องการ', 404);

    const updatedRequest = await prisma.inventoryRequest.update({
      where: { id },
      data: {
        status,
        note,
        processedById: user.id,
        processedAt: new Date()
      },
      include: {
        job: true,
        requestedBy: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true } }
      }
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "UPDATE",
          entityType: "INVENTORY_REQUEST",
          entityId: id,
          entityName: updatedRequest.job.title,
          performedById: user.id,
          performedByName: user.name || "System",
          performedByRole: user.role,
          details: `ปรับปรุงสถานะคำขอเบิกวัสดุในใบงาน: ${updatedRequest.job.title} เป็น ${status}`,
        }
      });
    } catch (e) { console.error("Audit log failed", e); }

    return sendSuccess(updatedRequest, 'ปรับปรุงสถานะเรียบร้อยแล้ว');
  } catch (error) {
    return sendServerError(error);
  }
}
