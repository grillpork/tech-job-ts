import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { z } from 'zod';

// Define the validation schema using Zod
const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  departments: z.any().optional(),
  creatorId: z.string().min(1, "Creator ID is required"),
  leadTechnicianId: z.string().optional().nullable(),
  assignedEmployeeIds: z.array(z.string()).optional(),
  tasks: z.array(z.object({
    description: z.string(),
    details: z.string().optional(),
    order: z.number().optional()
  })).optional(),
  location: z.any().optional(),
  locationImages: z.any().optional(),
  attachments: z.any().optional(),
  usedInventory: z.any().optional(),
  beforeImages: z.any().optional(),
  afterImages: z.any().optional(),
  // Add more fields if needed
}).passthrough();


/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs
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
      ...apiData 
    } = validatedData;

    const newJob = await prisma.job.create({
      data: {
        ...apiData,
        creator: { connect: { id: creatorId } },
        // Conditionally connect lead if present
        ...(leadTechnicianId ? { leadTechnician: { connect: { id: leadTechnicianId } } } : {}),
        assignedEmployees: {
          connect: assignedEmployeeIds?.map((id: string) => ({ id })) || []
        },
        tasks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: tasks?.map((t: any, i: number) => ({
             description: t.description,
             details: t.details,
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

