import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { 
  sendSuccess, 
  sendError, 
  sendUnauthorized, 
  sendForbidden, 
  sendServerError 
} from '@/lib/api-utils';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return sendUnauthorized();

    const currentUser = session.user as any;
    if (currentUser.role !== 'admin') return sendForbidden();

    const body = await request.json();
    const { name, email, role, password } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return sendError('ไม่พบผู้ใช้งานนี้', 404);

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, imageUrl: true }
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "UPDATE",
          entityType: "USER",
          entityId: id,
          entityName: updatedUser.name || updatedUser.email || id,
          performedById: currentUser.id,
          performedByName: currentUser.name || "Admin",
          performedByRole: currentUser.role,
          details: `แก้ไขข้อมูลผู้ใช้: ${updatedUser.name || updatedUser.email}`,
          changes: JSON.stringify({ before: { role: existingUser.role }, after: { role: updatedUser.role } })
        }
      });
    } catch (e) { console.error("Audit log failed", e); }

    return sendSuccess(updatedUser, 'แก้ไขข้อมูลผู้ใช้สำเร็จ');
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

    const currentUser = session.user as any;
    if (currentUser.role !== 'admin') return sendForbidden();
    if (currentUser.id === id) return sendError('คุณไม่สามารถลบบัญชีของตัวเองได้');

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) return sendError('ไม่พบผู้ใช้ที่ต้องการลบ', 404);

    await prisma.user.delete({ where: { id } });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "DELETE",
          entityType: "USER",
          entityId: id,
          entityName: userToDelete.name || userToDelete.email || id,
          performedById: currentUser.id,
          performedByName: currentUser.name || "Admin",
          performedByRole: currentUser.role,
          details: `ลบผู้ใช้: ${userToDelete.name || userToDelete.email}`,
        }
      });
    } catch (e) { console.error("Audit log failed", e); }

    return sendSuccess(null, 'ลบผู้ใช้สำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}
