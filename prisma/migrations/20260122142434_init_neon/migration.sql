-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "department" TEXT,
    "imageUrl" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "skills" TEXT,
    "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "linkedin" TEXT,
    "employeeId" TEXT,
    "github" TEXT,
    "employmentType" TEXT,
    "status" TEXT DEFAULT 'active',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "departments" TEXT,
    "type" TEXT,
    "priority" TEXT,
    "creatorId" TEXT NOT NULL,
    "leadTechnicianId" TEXT,
    "usedInventory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "locationImages" TEXT,
    "beforeImages" TEXT,
    "afterImages" TEXT,
    "attachments" TEXT,
    "customerType" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerCompanyName" TEXT,
    "customerTaxId" TEXT,
    "customerAddress" TEXT,
    "signature" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'พร้อมใช้',
    "type" TEXT NOT NULL DEFAULT 'ไม่ต้องคืน',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requireFrom" TEXT,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "reporterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "relatedJobId" TEXT,
    "relatedInventoryId" TEXT,
    "attachments" TEXT,
    "tags" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedByName" TEXT NOT NULL,
    "performedByRole" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "changes" TEXT,
    "metadata" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JobAssigned" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_JobAssigned_AB_unique" ON "_JobAssigned"("A", "B");

-- CreateIndex
CREATE INDEX "_JobAssigned_B_index" ON "_JobAssigned"("B");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_leadTechnicianId_fkey" FOREIGN KEY ("leadTechnicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_relatedJobId_fkey" FOREIGN KEY ("relatedJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobAssigned" ADD CONSTRAINT "_JobAssigned_A_fkey" FOREIGN KEY ("A") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobAssigned" ADD CONSTRAINT "_JobAssigned_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
