import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Define the validation schema using Zod
const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  departments: z.any().optional().nullable(),
  creatorId: z.string().min(1, "Creator ID is required"),
  leadTechnicianId: z.string().optional().nullable(),
  assignedEmployeeIds: z.array(z.string()).optional().nullable(),
  tasks: z.array(z.object({
    description: z.string(),
    details: z.string().optional().nullable(),
    order: z.number().optional().nullable()
  })).optional().nullable(),
  location: z.any().optional().nullable(),
  locationImages: z.any().optional().nullable(),
  attachments: z.any().optional().nullable(),
  usedInventory: z.any().optional().nullable(),
  beforeImages: z.any().optional().nullable(),
  afterImages: z.any().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  customerType: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customerCompanyName: z.string().optional().nullable(),
  customerTaxId: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  signature: z.string().optional().nullable(),
});

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     description: Returns a list of all jobs with related data.
 *     responses:
 *       200:
 *         description: Array of jobs
 */
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Parse JSON fields
    const formattedJobs = jobs.map(job => ({
      ...job,
      departments: job.departments ? JSON.parse(job.departments) : [],
      location: job.location ? JSON.parse(job.location) : null,
      locationImages: job.locationImages ? JSON.parse(job.locationImages) : [],
      attachments: job.attachments ? JSON.parse(job.attachments) : [],
      beforeImages: job.beforeImages ? JSON.parse(job.beforeImages) : [],
      afterImages: job.afterImages ? JSON.parse(job.afterImages) : [],
      usedInventory: job.usedInventory ? JSON.parse(job.usedInventory) : [],
      // Ensure relations match frontend expectations mostly
      // workLogs updatedBy might need flattening if frontend expects just {id, name}
    }));

    return NextResponse.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     description: Creates a new job. Requires Admin or Manager role.
 *     responses:
 *       200:
 *         description: The newly created job
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function POST(request: Request) {
  try {
    // 1. Check Authentication and Role (RBAC)
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session?.user as any)?.role;

    if (!session || !userRole) {
      return NextResponse.json({ error: 'Unauthorized: You must be logged in to create jobs' }, { status: 401 });
    }

    if (userRole === 'employee') {
      return NextResponse.json({ error: 'Forbidden: Employees cannot create new jobs' }, { status: 403 });
    }

    const body = await request.json();
    
    // 2. Validate Input using Zod
    const validationResult = jobSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation Error:', validationResult.error.format());
      return NextResponse.json(
        { error: 'Invalid Input Data', details: validationResult.error.format() }, 
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;

    // 3. Extract relations and json fields
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
      startDate,
      endDate,
      ...apiData 
    } = validatedData;

    const newJob = await prisma.job.create({
      data: {
        ...apiData,
        status: apiData.status || 'pending',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        creator: { connect: { id: creatorId } },
        leadTechnician: leadTechnicianId ? { connect: { id: leadTechnicianId } } : undefined,
        assignedEmployees: {
          connect: assignedEmployeeIds?.filter(Boolean).map((id: string) => ({ id })) || []
        },
        tasks: {
          create: tasks?.map((t: any, i: number) => ({
             description: t.description,
             details: t.details || null,
             order: t.order ?? i,
             isCompleted: false
          })) || []
        },
        // Store JSON fields
        departments: departments ? JSON.stringify(departments) : null,
        location: location ? JSON.stringify(location) : null,
        locationImages: locationImages ? JSON.stringify(locationImages) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        usedInventory: usedInventory ? JSON.stringify(usedInventory) : null,
        beforeImages: beforeImages ? JSON.stringify(beforeImages) : null,
        afterImages: afterImages ? JSON.stringify(afterImages) : null,
        
        // Initial worklog
        workLogs: {
          create: {
            status: apiData.status || 'pending',
            note: "Job created",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updatedBy: { connect: { id: (session.user as any).id || creatorId } }
          }
        }
      },
      include: {
        creator: true,
        assignedEmployees: true,
        tasks: true
      }
    });

    // Format the response to match frontend expectations (parse JSON strings)
    const formattedNewJob = {
      ...newJob,
      departments: newJob.departments ? JSON.parse(newJob.departments) : [],
      location: newJob.location ? JSON.parse(newJob.location) : null,
      locationImages: newJob.locationImages ? JSON.parse(newJob.locationImages) : [],
      attachments: newJob.attachments ? JSON.parse(newJob.attachments) : [],
      beforeImages: newJob.beforeImages ? JSON.parse(newJob.beforeImages) : [],
      afterImages: newJob.afterImages ? JSON.parse(newJob.afterImages) : [],
      usedInventory: newJob.usedInventory ? JSON.parse(newJob.usedInventory) : [],
    };

    return NextResponse.json(formattedNewJob);

  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

