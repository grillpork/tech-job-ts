import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const requests = await prisma.inventoryRequest.findMany({
      include: {
        requestedBy: {
          select: { id: true, name: true, imageUrl: true }
        },
        processedBy: {
          select: { id: true, name: true }
        },
        job: {
          select: { id: true, title: true }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });
    
    // Parse JSON items
    const formattedRequests = requests.map(req => ({
      ...req,
      requestedItems: req.items ? JSON.parse(req.items) : []
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching inventory requests:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, requestedItems, note } = body;

    if (!jobId || !requestedItems || !Array.isArray(requestedItems)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const newRequest = await prisma.inventoryRequest.create({
      data: {
        jobId,
        items: JSON.stringify(requestedItems),
        requestedById: userId,
        note: note || null,
        status: 'pending'
      },
      include: {
        requestedBy: {
          select: { id: true, name: true }
        },
        job: {
          select: { id: true, title: true }
        }
      }
    });

    const formatted = {
      ...newRequest,
      requestedItems: JSON.parse(newRequest.items)
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error creating inventory request:', error);
    return NextResponse.json({ error: 'Failed to create inventory request' }, { status: 500 });
  }
}
