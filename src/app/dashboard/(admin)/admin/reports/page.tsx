"use client"

import { useSession } from "next-auth/react"
import AdminReportPage from "./admin-page"
import LeadReportPage from "./lead-page"
import { Loader2 } from "lucide-react"

/**
 * /dashboard/admin/reports
 * - admin / manager  → เห็น report ทั้งหมด (AdminReportPage)
 * - lead_technician  → เห็นเฉพาะ report ของแผนกตัวเอง (LeadReportPage)
 */
export default function ReportPage() {
  const { data: session, status } = useSession()
  const role = session?.user?.role

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (role && (role === "lead_technician" || role.startsWith("lead_"))) {
    return <LeadReportPage />
  }

  return <AdminReportPage />
}
