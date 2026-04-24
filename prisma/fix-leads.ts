import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Manual Updating Lead Departments...');

  const leads = [
    { email: 'somsak.lead@company.com', dept: 'Electrical' },
    { email: 'prayut.lead@company.com', dept: 'Mechanical' },
    { email: 'sommai.lead@company.com', dept: 'Civil' },
    { email: 'somchai.tech@company.com', dept: 'Technical' },
  ];

  for (const lead of leads) {
    const updated = await prisma.user.update({
      where: { email: lead.email },
      data: { department: lead.dept }
    });
    console.log(`✅ Updated ${updated.name} to department: ${updated.department}`);
  }

  console.log('✨ All Leads updated successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
