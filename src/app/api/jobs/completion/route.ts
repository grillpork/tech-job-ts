import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const requests = await prisma.completionRequest.findMany({
      include: {
        requestedBy: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true } },
        job: { select: { id: true, title: true } }
      },
      orderBy: { requestedAt: 'desc' }
    });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { jobId, signature } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const newRequest = await prisma.completionRequest.upsert({
      where: { jobId },
      update: {
        status: 'pending',
        signature,
        requestedById: userId,
        requestedAt: new Date(),
        processedById: null,
        processedAt: null,
        rejectionReason: null
      },
      create: {
        jobId,
        status: 'pending',
        signature,
        requestedById: userId,
      }
    });

    // Update job status to pending_approval
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'pending_approval' }
    });

    return NextResponse.json(newRequest);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
