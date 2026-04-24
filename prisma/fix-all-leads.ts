import { PrismaClient } from '@prisma/client';
import { MOCK_USERS } from '../src/lib/mocks/user';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Re-syncing ALL Leads from Mock to Database...');

  // กรองเฉพาะหัวหน้างาน (Leads) จาก Mock
  const allLeads = MOCK_USERS.filter(u => u.role === 'lead_technician');

  for (const lead of allLeads) {
    if (!lead.department) {
      console.log(`⚠️ Warning: Lead ${lead.name} has no department in MOCK. Skipping...`);
      continue;
    }

    const updated = await prisma.user.update({
      where: { email: lead.email },
      data: {
        department: lead.department,
        role: 'lead_technician'
      }
    });

    console.log(`✅ Updated: ${updated.name} | Department: ${updated.department} | Email: ${updated.email}`);
  }

  console.log('✨ Sync complete. All leads now have their departments in DB.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
