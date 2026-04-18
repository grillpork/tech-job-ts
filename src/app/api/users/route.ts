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
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return sendUnauthorized();

    const users = await prisma.user.findMany({
      select: {
          id: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          status: true,
          department: true,
      },
      orderBy: { name: 'asc' }
    });
    
    return sendSuccess(users, 'ดึงข้อมูลผู้ใช้งานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = session.user as any;
    if (currentUser.role !== 'admin') {
      return sendForbidden('ต้องมีสิทธิ์ผู้ดูแลระบบจึงจะสร้างผู้ใช้ได้');
    }

    const body = await request.json();
    const { name, email, password, role, department } = body;

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError("อีเมลนี้มีอยู่ในระบบแล้ว", 409);

    const hashedPassword = await bcrypt.hash(password || "123456", 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "employee",
        department: department || null,
        status: "active"
      }
    });

    // Logging
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "USER",
        entityId: newUser.id,
        entityName: newUser.name,
        performedById: currentUser.id,
        performedByName: currentUser.name,
        performedByRole: currentUser.role,
        details: `Created user ${newUser.name} (${newUser.email})`
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return sendSuccess(userWithoutPassword, 'สร้างผู้ใช้งานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = session.user as any;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return sendError("ไม่พบรหัสผู้ใช้งาน");

    // Only Admin can edit roles of others, or owner can edit profile
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return sendForbidden('คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้นี้');
    }

    const body = await request.json();
    const { password, ...updateData } = body;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
          id: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          status: true,
          department: true,
      }
    });

    return sendSuccess(updated, 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = session.user as any;
    if (currentUser.role !== 'admin') {
      return sendForbidden('เฉพาะผู้ดูแลระบบเท่านั้นที่ลบผู้ใช้ได้');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return sendError("ไม่พบรหัสผู้ใช้งาน");

    if (id === currentUser.id) {
       return sendError("คุณไม่สามารถลบตัวเองได้");
    }

    await prisma.user.delete({ where: { id } });

    return sendSuccess(null, 'ลบผู้ใช้งานเรียบร้อยแล้ว');
  } catch (error) {
    return sendServerError(error);
  }
}
