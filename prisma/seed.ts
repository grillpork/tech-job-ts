import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { fakerTH } from '@faker-js/faker';
import { MOCK_USERS } from '../src/lib/mocks/user';
import { MOCK_INVENTORIES } from '../src/lib/mocks/inventory';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clean up
  await prisma.workLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.job.deleteMany();
  await prisma.report.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log('Deleted old data.');

  // 2. Seed Users
  for (const user of MOCK_USERS) {
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
        github: user.github,
        employmentType: user.employmentType,
        status: user.status || "active",
        password: user.password
      }
    });
  }
  console.log(`Seeded ${MOCK_USERS.length} users.`);

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
  console.log(`Seeded ${MOCK_INVENTORIES.length} inventory items.`);

  // 4. Seed Jobs using Faker
  const creator = MOCK_USERS.find(u => u.role === 'manager') || MOCK_USERS[0];
  const lead = MOCK_USERS.find(u => u.role === 'lead_technician') || MOCK_USERS[2];
  const emp = MOCK_USERS.find(u => u.role === 'employee') || MOCK_USERS[5];

  const statuses = ['pending', 'in_progress', 'completed', 'cancelled', 'pending_approval'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const types = ['อาคาร', 'ออฟฟิศ', 'ระบบไฟฟ้า', 'ประปา', 'แอร์', 'ทำความสะอาด'];

  // Thai localized dummy data
  const thaiJobTitles = [
    'ซ่อมแอร์ห้องประชุมใหญ่', 'ตรวจสอบระบบไฟฟ้าชั้น 2', 'เดินสาย LAN ใหม่แผนกบัญชี', 
    'แก้ไขปัญหาน้ำรั่วซึม', 'ล้างแอร์ประจำปี', 'ติดตั้งกล้องวงจรปิด', 
    'ซ่อมแซมฝ้าเพดาน', 'เปลี่ยนหลอดไฟสำนักงาน', 'ตรวจสอบโครงสร้างอาคาร', 
    'บำรุงรักษาระบบ Server', 'ซ่อมเครื่องถ่ายเอกสาร', 'อัปเกรดระบบเครือข่าย'
  ];

  const actualDepartments = [
    'ไฟฟ้า', 'เครื่องกล', 'โยธา', 'เทคนิค'
  ];

  for (let i = 0; i < 30; i++) {
    const isCompleted = fakerTH.datatype.boolean();
    
    // Pick a random Thai job title instead of generic lorem
    const jobTitle = fakerTH.helpers.arrayElement(thaiJobTitles);
    
    await prisma.job.create({
      data: {
        title: `${jobTitle} ${fakerTH.string.alphanumeric(4).toUpperCase()}`,
        description: `แจ้งซ่อมด่วน: ${jobTitle} บริเวณสถานที่ระบุ ต้องการช่างเข้าตรวจสอบและประเมินราคาซ่อมแซมเบื้องต้น`,
        status: fakerTH.helpers.arrayElement(statuses),
        departments: JSON.stringify([fakerTH.helpers.arrayElement(actualDepartments)]),
        type: fakerTH.helpers.arrayElement(types),
        priority: fakerTH.helpers.arrayElement(priorities),
        
        creatorId: creator.id,
        leadTechnicianId: fakerTH.datatype.boolean() ? lead.id : null,
        assignedEmployees: {
          connect: [{ id: emp.id }]
        },
        
        tasks: {
          create: [
            { description: 'ตรวจสอบหน้างานเบื้องต้น', order: 0, isCompleted: isCompleted },
            { description: 'ดำเนินการซ่อมแซม/แก้ไข', order: 1, isCompleted: false },
            { description: 'ทดสอบการใช้งานหลังซ่อม', order: 2, isCompleted: false }
          ]
        },
        
        location: JSON.stringify({ 
           lat: fakerTH.location.latitude({ max: 13.9, min: 13.5 }), 
           lng: fakerTH.location.longitude({ max: 100.9, min: 100.3 }), 
           name: `สถานที่: อาคาร ${fakerTH.company.name()}`
        }),
        
        // Add realistic Thai customer details
        customerName: `${fakerTH.person.firstName()} ${fakerTH.person.lastName()}`,
        customerPhone: fakerTH.phone.number({ style: 'national' }),
        customerCompanyName: fakerTH.company.name(),
        customerAddress: fakerTH.location.streetAddress(),
        customerType: fakerTH.helpers.arrayElement(['ลูกค้าองค์กร', 'ลูกค้าทั่วไป']),

        usedInventory: fakerTH.datatype.boolean() ? JSON.stringify([
           { id: "inv-001", qty: fakerTH.number.int({ min: 1, max: 3 }) }
        ]) : null,
        
        createdAt: fakerTH.date.recent({ days: 30 }),
        startDate: fakerTH.date.soon({ days: 5 }),
      }
    });
  }

  console.log(`Seeded 30 sample jobs using Faker.`);

  // 5. Seed Reports (For Dashboard 'openReports' feature)
  const reportTypes = ['bug', 'request', 'incident'];
  const reportStatuses = ['open', 'in_progress', 'resolved', 'closed'];

  const thaiReportIssues = [
    'แอร์ไม่เย็นเลย รบกวนตรวจสอบด่วน', 
    'น้ำประปาไหลอ่อนในห้องน้ำชั้น 3', 
    'อินเทอร์เน็ตหลุดบ่อยมาก แผนกการตลาด', 
    'ไฟทางเดินอาคาร B กะพริบ', 
    'ประตูอัตโนมัติค้าง ปิดไม่สนิท', 
    'คอมพิวเตอร์เปิดไม่ติด', 
    'ขอเบิกอุปกรณ์เพิ่มเติมสำหรับการซ่อมบำรุง', 
    'เครื่องพิมพ์แผนกบัญชีกระดาษติดบ่อย', 
    'ระบบเซิร์ฟเวอร์โหลดช้าผิดปกติ', 
    'พบรอยร้าวที่ผนังห้องประชุม'
  ];
  
  for (let i = 0; i < 30; i++) {
    const issueTitle = fakerTH.helpers.arrayElement(thaiReportIssues);
    await prisma.report.create({
      data: {
        title: `ปัญหาแจ้งเตือนขัดข้อง: ${issueTitle}`,
        description: `ผู้ใช้งานแจ้งปัญหา: ${issueTitle} ขอให้ทีมงานที่เกี่ยวข้องช่วยตรวจสอบและแก้ไขโดยด่วน`,
        type: fakerTH.helpers.arrayElement(reportTypes),
        status: fakerTH.helpers.arrayElement(reportStatuses),
        priority: fakerTH.helpers.arrayElement(priorities),
        reporterId: creator.id,
        assigneeId: fakerTH.datatype.boolean() ? lead.id : null,
        createdAt: fakerTH.date.recent({ days: 30 }),
      }
    });
  }
  
  console.log(`Seeded 30 sample reports using Faker.`);

  console.log('Seeding finished.');
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
