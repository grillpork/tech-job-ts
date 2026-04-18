import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  sendSuccess, 
  sendUnauthorized, 
  sendForbidden, 
  sendServerError 
} from '@/lib/api-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any;
    if (user.role !== 'admin' && user.role !== 'manager') {
      return sendForbidden('คุณไม่มีสิทธิ์ในการเข้าถึงประวัติการใช้งานระบบ');
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200 // Limit to latest 200
    });
    
    return sendSuccess(logs, 'ดึงข้อมูลประวัติการใช้งานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}
