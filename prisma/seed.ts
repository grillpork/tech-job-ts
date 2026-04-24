import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { fakerTH } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { MOCK_USERS } from '../src/lib/mocks/user';
import { MOCK_INVENTORIES } from '../src/lib/mocks/inventory';

const prisma = new PrismaClient();

const DEPT_OPTIONS = ["Electrical", "Mechanical", "Civil", "Technical"];

async function main() {
  console.log('🚀 Start corrected comprehensive seeding...');

  // 1. Clean up
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Could not truncate table ${tablename}: ${error}`);
      }
    }
  }
  console.log('🗑️ Database cleared.');

  // 2. Seed Users
  for (const user of MOCK_USERS) {
    const hashedPassword = user.password ? await bcrypt.hash(user.password, 10) : null;
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || null,
        imageUrl: user.imageUrl,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills ? JSON.stringify(user.skills) : null,
        joinedAt: user.joinedAt ? new Date(user.joinedAt) : null,
        address: user.address,
        linkedin: user.linkedin,
        employeeId: user.employeeId,
        employmentType: user.employmentType,
        status: user.status || "active",
        password: hashedPassword
      }
    });
  }
  
  const allUsers = await prisma.user.findMany();
  const leads = allUsers.filter(u => u.role.startsWith('lead_'));
  const employees = allUsers.filter(u => u.role === 'employee');
  const managers = allUsers.filter(u => u.role === 'manager' || u.role === 'admin');

  console.log(`👤 Seeded ${allUsers.length} users.`);

  // 3. Seed Inventory
  for (const inv of MOCK_INVENTORIES) {
    await prisma.inventory.create({
      data: {
        id: inv.id,
        name: inv.name,
        imageUrl: inv.imageUrl,
        quantity: inv.quantity,
        location: inv.location,
        status: inv.status,
        type: inv.type,
        price: inv.price,
        requireFrom: inv.requireFrom
      }
    });
  }
  console.log(`📦 Seeded inventory items.`);

  // 4. Seed Reports (50 Items)
  console.log('📝 Seeding 50 reports...');
  const reportStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  
  for (let i = 0; i < 50; i++) {
    const isMulti = fakerTH.datatype.boolean({ probability: 0.3 });
    const status = fakerTH.helpers.arrayElement(reportStatuses);
    const selectedDepts = isMulti 
      ? fakerTH.helpers.arrayElements(DEPT_OPTIONS, { min: 2, max: 3 })
      : [fakerTH.helpers.arrayElement(DEPT_OPTIONS)];
    
    await prisma.report.create({
      data: {
        title: fakerTH.hacker.phrase(),
        description: fakerTH.lorem.paragraph(),
        type: fakerTH.helpers.arrayElement(['bug', 'request', 'incident']),
        status: status,
        priority: fakerTH.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
        isMultiDept: isMulti,
        departments: JSON.stringify(selectedDepts),
        resolvedDepts: JSON.stringify(status === 'resolved' ? selectedDepts : []),
        reporterId: fakerTH.helpers.arrayElement([...managers, ...employees]).id,
        createdAt: fakerTH.date.recent({ days: 30 }),
        resolutionNote: status === 'resolved' ? 'แก้ไขเสร็จสิ้น ตรวจสอบระบบแล้วปกติดี' : null,
      }
    });
  }

  // 5. Seed Jobs (5 Items)
  console.log('🛠️ Seeding 5 items with minimal teams...');
  const jobStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];

  for (let i = 0; i < 5; i++) {
    const status = fakerTH.helpers.arrayElement(jobStatuses);
    const dept = fakerTH.helpers.arrayElement(DEPT_OPTIONS);
    const creator = fakerTH.helpers.arrayElement(managers);
    const lead = leads.find(l => l.department === dept) || fakerTH.helpers.arrayElement(leads);
    const teamSize = fakerTH.number.int({ min: 1, max: 2 });
    const team = fakerTH.helpers.arrayElements(employees, teamSize);

    const job = await prisma.job.create({
      data: {
        title: `${fakerTH.helpers.arrayElement(['งานซ่อม', 'ติดตั้งระบบ', 'ตรวจสอบ', 'บำรุงรักษา'])} ${dept} #${i + 1}`,
        description: fakerTH.lorem.sentence(),
        status: status,
        priority: fakerTH.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
        type: fakerTH.helpers.arrayElement(['maintenance', 'repair', 'installation', 'emergency']),
        creator: { connect: { id: creator.id } },
        leadTechnician: { connect: { id: lead.id } },
        assignedEmployees: { connect: team.map(t => ({ id: t.id })) },
        departments: JSON.stringify([dept]),
        location: JSON.stringify({ 
          lat: 13.75 + (Math.random() - 0.5) * 0.1, 
          lng: 100.5 + (Math.random() - 0.5) * 0.1, 
          name: fakerTH.location.streetAddress() 
        }),
        customerName: fakerTH.person.fullName(),
        customerPhone: fakerTH.phone.number(),
        createdAt: fakerTH.date.recent({ days: 20 }),
      }
    });

    // Seed tasks
    const taskCount = fakerTH.number.int({ min: 2, max: 5 });
    for (let j = 0; j < taskCount; j++) {
      await prisma.task.create({
        data: {
          jobId: job.id,
          description: `ขั้นตอนที่ ${j+1}: ${fakerTH.lorem.words(3)}`,
          isCompleted: status === 'completed' ? true : fakerTH.datatype.boolean(),
          order: j
        }
      });
    }

    // Seed worklogs
    if (status !== 'pending') {
      const logCount = fakerTH.number.int({ min: 1, max: 3 });
      for (let k = 0; k < logCount; k++) {
        await prisma.workLog.create({
          data: {
            jobId: job.id,
            updatedById: fakerTH.helpers.arrayElement([lead, ...team]).id,
            status: fakerTH.helpers.arrayElement(['เริมงาน', 'พักเที่ยง', 'แก้ไขเสร็จสิ้น', 'รออะไหล่']),
            note: fakerTH.lorem.sentence(),
            createdAt: fakerTH.date.recent({ days: 2 })
          }
        });
      }
    }
  }

  console.log('✅ Corrected seeding finished successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
