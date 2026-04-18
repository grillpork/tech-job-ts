import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  sendSuccess, 
  sendUnauthorized, 
  sendError, 
  sendServerError 
} from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build the query
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, imageUrl: true } },
        assignee: { select: { id: true, name: true, imageUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(reports, 'ดึงข้อมูลรายงานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const body = await request.json();
    
    if (!body.title || !body.type || !body.reporterId) {
      return sendError('กรุณาระบุข้อมูลที่จำเป็น (หัวข้อ, ประเภท, ผู้รายงาน)');
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
        reporter: { select: { id: true, name: true, imageUrl: true } },
        assignee: { select: { id: true, name: true, imageUrl: true } },
      }
    });

    return sendSuccess(report, 'สร้างรายงานใหม่สำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}
