import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  sendSuccess, 
  sendError, 
  sendUnauthorized, 
  sendServerError 
} from '@/lib/api-utils';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const body = await request.json();
    const { status, rejectionReason } = body;

    const user = session.user as any;

    const updatedRequest = await prisma.completionRequest.update({
      where: { jobId },
      data: {
        status,
        processedById: user.id || "unknown",
        processedAt: new Date(),
        rejectionReason: status === 'rejected' ? rejectionReason : null
      }
    });

    // Sync back to Job status
    const jobStatus = status === 'approved' ? 'completed' : status === 'rejected' ? 'rejected' : 'pending_approval';
    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: jobStatus,
        rejectionReason: status === 'rejected' ? rejectionReason : null
      }
    });

    return sendSuccess(updatedRequest, 'ปรับปรุงสถานะการปิดงานเรียบร้อยแล้ว');
  } catch (error) {
    return sendServerError(error);
  }
}
