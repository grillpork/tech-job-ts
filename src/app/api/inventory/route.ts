
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.inventory.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}
