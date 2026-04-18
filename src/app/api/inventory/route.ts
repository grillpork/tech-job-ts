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
    if (!session) return sendUnauthorized();

    const items = await prisma.inventory.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return sendSuccess(items, 'ดึงข้อมูลคลังสินค้าสำเร็จ');
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
    
    if (!allowedRoles.includes(user.role)) return sendForbidden();

    const body = await request.json();
    const { sku, name, category, imageUrl, quantity, minStock, location, status, type, price, requireFrom } = body;
    
    const newItem = await prisma.inventory.create({
      data: {
        sku,
        name,
        category: category || "ทั่วไป",
        imageUrl,
        quantity: parseInt(String(quantity)) || 0,
        minStock: parseInt(String(minStock)) || 5,
        location,
        status,
        type,
        price: parseFloat(String(price)) || 0,
        requireFrom,
      },
    });

    // Create Audit Log with real user data
    try {
      await prisma.auditLog.create({
        data: {
          action: "CREATE",
          entityType: "INVENTORY",
          entityId: newItem.id,
          entityName: newItem.name,
          performedById: user.id || "unknown",
          performedByName: user.name || "Unknown User",
          performedByRole: user.role || "unknown",
          details: `Created new inventory item: ${newItem.name} (${newItem.sku || 'No SKU'})`,
          metadata: JSON.stringify({ newItem }),
        }
      });
    } catch (logError) {
      console.error("Failed to create audit log:", logError);
    }
    
    return sendSuccess(newItem, 'เพิ่มพัสดุเข้าคลังสำเร็จ');
  } catch (error) {
    return sendServerError(error);
  }
}
