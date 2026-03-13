
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a standard job by ID
 *     description: Returns a single job by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job object corresponding to the ID
 *       404:
 *         description: Job not found
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        creator: true,
        leadTechnician: true,
        assignedEmployees: true,
        tasks: {
          orderBy: { order: 'asc' }
        },
        workLogs: {
          orderBy: { createdAt: 'desc' },
          include: { updatedBy: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Parse JSON fields
    const formattedJob = {
      ...job,
      departments: job.departments ? JSON.parse(job.departments) : [],
      location: job.location ? JSON.parse(job.location) : null,
      locationImages: job.locationImages ? JSON.parse(job.locationImages) : [],
      attachments: job.attachments ? JSON.parse(job.attachments) : [],
      beforeImages: job.beforeImages ? JSON.parse(job.beforeImages) : [],
      afterImages: job.afterImages ? JSON.parse(job.afterImages) : [],
      usedInventory: job.usedInventory ? JSON.parse(job.usedInventory) : [],
    };

    return NextResponse.json(formattedJob);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update an existing job
 *     description: Updates an existing job by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The updated job
 *       404:
 *         description: Job not found
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Extract relations and json fields that need special handling
    const { 
      creatorId, 
      assignedEmployeeIds, 
      leadTechnicianId, 
      tasks, 
      departments,
      location,
      locationImages,
      attachments,
      usedInventory,
      beforeImages,
      afterImages,
      // relations that shouldn't be updated directly usually, but handle if needed
      // creator,
      // leadTechnician,
      // assignedEmployees,
      // workLogs,
      ...apiData 
    } = body;

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...apiData };

    // Handle JSON fields
    if (departments !== undefined) updateData.departments = departments ? JSON.stringify(departments) : null;
    if (location !== undefined) updateData.location = location ? JSON.stringify(location) : null;
    if (locationImages !== undefined) updateData.locationImages = locationImages ? JSON.stringify(locationImages) : null;
    if (attachments !== undefined) updateData.attachments = attachments ? JSON.stringify(attachments) : null;
    if (usedInventory !== undefined) updateData.usedInventory = usedInventory ? JSON.stringify(usedInventory) : null;
    if (beforeImages !== undefined) updateData.beforeImages = beforeImages ? JSON.stringify(beforeImages) : null;
    if (afterImages !== undefined) updateData.afterImages = afterImages ? JSON.stringify(afterImages) : null;

    // Handle Relations
    if (creatorId) {
      updateData.creator = { connect: { id: creatorId } };
    }

    if (leadTechnicianId !== undefined) {
      if (leadTechnicianId === null) {
        updateData.leadTechnician = { disconnect: true };
      } else {
        updateData.leadTechnician = { connect: { id: leadTechnicianId } };
      }
    }

    if (assignedEmployeeIds !== undefined) {
      updateData.assignedEmployees = {
        set: assignedEmployeeIds.map((id: string) => ({ id }))
      };
    }

    // Handle Tasks - Strategy: Delete old and create new to ensure sync (or update if complex logic needed)
    // For simplicity and to ensure order/content matches exactly what's sent:
    if (tasks !== undefined) {
        updateData.tasks = {
            deleteMany: {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: tasks.map((t: any, i: number) => ({
                description: t.description,
                details: t.details,
                order: t.order ?? i,
                isCompleted: t.isCompleted ?? false
            }))
        };
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        creator: true,
        leadTechnician: true,
        assignedEmployees: true,
        tasks: { orderBy: { order: 'asc' } },
        workLogs: { orderBy: { createdAt: 'desc' }, include: { updatedBy: true } }
      }
    });

    // Handle inventory deduction if status changes to 'completed'
    if (updateData.status === 'completed' && existingJob.status !== 'completed') {
      const itemsToDeduct = usedInventory || (existingJob.usedInventory ? JSON.parse(existingJob.usedInventory) : []);
      
      if (Array.isArray(itemsToDeduct) && itemsToDeduct.length > 0) {
        // Run sequentially to ensure updates don't conflict, or use transaction
        for (const item of itemsToDeduct) {
          if (item.id && item.qty) {
            await prisma.inventory.update({
              where: { id: item.id },
              data: {
                quantity: {
                  decrement: item.qty
                }
              }
            }).catch(err => console.error(`Failed to deduct inventory for ${item.id}:`, err));
          }
        }
      }
    }

    const formattedUpdatedJob = {
      ...updatedJob,
      departments: updatedJob.departments ? JSON.parse(updatedJob.departments) : [],
      location: updatedJob.location ? JSON.parse(updatedJob.location) : null,
      locationImages: updatedJob.locationImages ? JSON.parse(updatedJob.locationImages) : [],
      attachments: updatedJob.attachments ? JSON.parse(updatedJob.attachments) : [],
      beforeImages: updatedJob.beforeImages ? JSON.parse(updatedJob.beforeImages) : [],
      afterImages: updatedJob.afterImages ? JSON.parse(updatedJob.afterImages) : [],
      usedInventory: updatedJob.usedInventory ? JSON.parse(updatedJob.usedInventory) : [],
    };

    return NextResponse.json(formattedUpdatedJob);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job by ID
 *     description: Deletes a specific job.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success message
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.job.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
