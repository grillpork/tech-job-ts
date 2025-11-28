"use client"

import { EventManager, type Event } from "@/components/ui/event-manager"
import { useMemo } from "react"
import { useJobStore } from "@/stores/features/jobStore"
import { useUserStore } from "@/stores/features/userStore"

export default function EventManagerDemo() {
  const jobs = useJobStore((s) => s.jobs)
  const currentUser = useUserStore((s) => s.currentUser)

  // Map Job -> Event shape expected by EventManager
  const jobEvents: Event[] = useMemo(() => {
    const mapStatusToColor = (status: string) => {
      switch (status) {
        case "in_progress":
          return "blue"
        case "pending_approval":
          return "purple"
        case "completed":
          return "green"
        case "cancelled":
          return "gray"
        case "rejected":
          return "red"
        default:
          return "orange"
      }
    }

    // Filter jobs according to current user's role:
    // - admin sees all jobs
    // - others see jobs where they are assigned, lead technician, or the creator
    const visibleJobs = currentUser?.role === "admin" ? jobs : jobs.filter((job) => {
      if (!currentUser) return false
      const userId = currentUser.id
      const isAssigned = job.assignedEmployees?.some((u) => u.id === userId)
      const isCreator = job.creator?.id === userId
      const isLead = job.leadTechnician?.id === userId
      return !!(isAssigned || isCreator || isLead)
    })

    return (visibleJobs || []).map((job) => {
      const start = job.startDate ? new Date(job.startDate) : new Date(job.createdAt)
      const end = job.endDate ? new Date(job.endDate) : new Date(start.getTime() + 1000 * 60 * 60 * 2)

      return {
        id: job.id,
        title: job.title,
        description: job.description || undefined,
        startTime: start,
        endTime: end,
        color: mapStatusToColor(job.status), // ยังคงใช้สีตามสถานะเพื่อการแสดงผล
        category: job.department || "Job", // Legacy support
        attendees: job.assignedEmployees?.map((u) => u.name) || [],
        tags: [job.status], // Legacy support
        // New fields for filtering
        priority: job.priority || undefined,
        status: job.status,
        departments: job.departments || (job.department ? [job.department] : []),
      } as Event
    })
  }, [jobs])

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <EventManager
        events={jobEvents}
        onEventCreate={(event) => console.log("Created:", event)}
        onEventUpdate={(id, event) => console.log("Updated:", id, event)}
        onEventDelete={(id) => console.log("Deleted:", id)}
        categories={["Meeting", "Task", "Reminder", "Personal", "Job"]}
        availableTags={["Important", "Urgent", "Work", "Personal", "Team", "Client"]}
        defaultView="month"
      />
    </div>
  )
}

