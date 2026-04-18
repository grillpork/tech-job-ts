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
    const allowedRoles = ['admin', 'manager', 'lead_technician'];
    if (!allowedRoles.includes(user.role)) return sendForbidden();

    const body = await request.json();
    const { sku, name, category, imageUrl, quantity, minStock, location, status, type, price, requireFrom } = body;

    const originalItem = await prisma.inventory.findUnique({ where: { id } });
    if (!originalItem) return sendError('ไม่พบข้อมูลพัสดุนี้', 404);

    const updatedItem = await prisma.inventory.update({
      where: { id },
      data: {
        sku,
        name,
        category,
        imageUrl,
        quantity: parseInt(String(quantity)) || 0,
        minStock: parseInt(String(minStock)) || 0,
        location,
        status,
        type,
        price: parseFloat(String(price)) || 0,
        requireFrom,
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "UPDATE",
          entityType: "INVENTORY",
          entityId: id,
          entityName: updatedItem.name,
          performedById: user.id,
          performedByName: user.name || "Unknown",
          performedByRole: user.role || "unknown",
          details: `แก้ไขข้อมูลพัสดุ: ${updatedItem.name}`,
          changes: JSON.stringify({ before: originalItem, after: updatedItem })
        }
      });
    } catch (e) { console.error("Audit log failed", e); }

    return sendSuccess(updatedItem, 'บันทึกการแก้ไขพัสดุสำเร็จ');
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

    const itemToDelete = await prisma.inventory.findUnique({ where: { id } });
    if (!itemToDelete) return sendError('ไม่พบพัสดุที่ต้องการลบ', 404);
    
    await prisma.inventory.delete({ where: { id } });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "DELETE",
          entityType: "INVENTORY",
          entityId: id,
          entityName: itemToDelete.name,
          performedById: user.id,
          performedByName: user.name || "Unknown",
          performedByRole: user.role || "unknown",
          details: `ลบพัสดุ: ${itemToDelete.name} (${itemToDelete.sku || 'No SKU'})`,
        }
      });
    } catch (e) { console.error("Audit log failed", e); }

    return sendSuccess(null, 'ลบพัสดุออกจากคลังเรียบร้อยแล้ว');
  } catch (error) {
    return sendServerError(error);
  }
}
