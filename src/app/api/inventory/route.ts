import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await prisma.inventory.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, imageUrl, quantity, location, status, type, price, requireFrom } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const item = await prisma.inventory.create({
      data: {
        name,
        imageUrl: imageUrl || null,
        quantity: quantity ?? 0,
        location: location || null,
        status: status || 'พร้อมใช้',
        type: type || 'ไม่ต้องคืน',
        price: price ?? 0,
        requireFrom: requireFrom || null,
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
