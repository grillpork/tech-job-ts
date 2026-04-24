import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// แผนที่สำหรับแปลงชื่อแผนก (ไทย <-> อังกฤษ) เพื่อความสม่ำเสมอในการกรอง
const DEPARTMENT_MAP: Record<string, string[]> = {
  "Electrical": ["Electrical", "ไฟฟ้า", "แผนกช่างไฟ"],
  "Mechanical": ["Mechanical", "เครื่องกล", "แผนกช่างกล"],
  "Technical": ["Technical", "เทคนิค", "แผนกช่างเทคนิค"],
  "Civil": ["Civil", "โยธา", "แผนกช่างโยธา"]
};

// ฟังก์ชันสำหรับหาชื่อที่เกี่ยวข้องทั้งหมด (Case-insensitive)
const getRelatedDeptNames = (dept: string) => {
  const searchDept = dept.toLowerCase();
  for (const [key, aliases] of Object.entries(DEPARTMENT_MAP)) {
    const keyMatch = key.toLowerCase() === searchDept;
    const aliasMatch = aliases.some(a => a.toLowerCase() === searchDept);
    if (keyMatch || aliasMatch) {
      return aliases.map(a => a.toLowerCase());
    }
  }
  return [searchDept];
};

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports with smart department filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const department = searchParams.get('department');

    // Build the query
    const query: any = {
      include: {
        reporter: { select: { id: true, name: true, imageUrl: true, department: true } },
        assignee: { select: { id: true, name: true, imageUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    };

    let where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    query.where = where;

    const reports = await prisma.report.findMany(query);

    // Parse JSON fields
    let formattedReports = reports.map(r => ({
      ...r,
      attachments: r.attachments ? JSON.parse(r.attachments) : [],
      tags: r.tags ? JSON.parse(r.tags) : [],
      departments: r.departments ? JSON.parse(r.departments) : [],
      resolvedDepts: r.resolvedDepts ? JSON.parse(r.resolvedDepts) : [],
      forwardedTo: r.forwardedTo ? JSON.parse(r.forwardedTo) : [],
    }));

    // Logic: กรองเฉพาะงานที่ Lead มีส่วนเกี่ยวข้อง
    if (department) {
      const relatedNames = getRelatedDeptNames(department);
      
      formattedReports = formattedReports.filter(r => {
        const reportDepts: string[] = (r.departments || []).map((d: string) => d.toLowerCase());
        const reportTags: string[] = (r.tags || []).map((t: string) => t.toLowerCase());
        
        // เช็คว่าในแผนกที่ระบุใน Report มีชื่อใดชื่อหนึ่งที่ตรงกับสายงานของ Lead หรือไม่
        const hasMatch = reportDepts.some(d => relatedNames.includes(d)) || 
                         reportTags.some(t => relatedNames.includes(t));
        
        return hasMatch;
      });
    }

    return NextResponse.json(formattedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new report
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.title || !body.type || !body.reporterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type,
        status: body.status || 'open',
        priority: body.priority || 'medium',
        reporterId: body.reporterId,
        assigneeId: body.assigneeId || null,
        relatedJobId: body.relatedJobId || null,
        relatedInventoryId: body.relatedInventoryId || null,
        attachments: body.attachments ? JSON.stringify(body.attachments) : null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
        departments: body.departments ? JSON.stringify(body.departments) : 
                     (body.tags ? JSON.stringify(body.tags) : null),
        isMultiDept: body.isMultiDept ?? false,
      },
      include: {
        reporter: { select: { id: true, name: true, imageUrl: true, department: true } },
        assignee: true,
      }
    });

    return NextResponse.json({
      ...report,
      attachments: report.attachments ? JSON.parse(report.attachments) : [],
      tags: report.tags ? JSON.parse(report.tags) : [],
      departments: report.departments ? JSON.parse(report.departments) : [],
      resolvedDepts: [],
      forwardedTo: [],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
