import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: ข้อมูลอุปกรณ์ตาม ID
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ข้อมูลอุปกรณ์
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const item = await prisma.inventory.findUnique({ where: { id } });

    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/inventory/{id}:
 *   patch:
 *     summary: อัปเดตข้อมูลอุปกรณ์
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: ข้อมูลอุปกรณ์ที่อัปเดตแล้ว
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    // Remove id from body to avoid prisma error
    const { id: _id, ...data } = body;

    const updated = await prisma.inventory.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: ลบอุปกรณ์
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ลบสำเสร็จ
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await prisma.inventory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting inventory:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
