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

    // Filter jobs according to current user's role (policy):
    // - admin: sees all jobs
    // - manager: sees jobs in their department OR jobs they created/lead/are assigned to
    // - lead_technician: sees jobs where they are leadTechnician OR assigned OR created
    // - employee: sees only jobs where they are assigned (or created)
    const userId = currentUser?.id

    const visibleJobs = (() => {
      if (!currentUser) return [] as typeof jobs
      const role = currentUser.role
      if (role === "admin") return jobs

      if (role === "manager") {
        return jobs.filter((job) => {
          const inDepartment = job.department && currentUser.department && job.department === currentUser.department
          const isAssigned = job.assignedEmployees?.some((u) => u.id === userId)
          const isCreator = job.creator?.id === userId
          const isLead = job.leadTechnician?.id === userId
          return !!(inDepartment || isAssigned || isCreator || isLead)
        })
      }

      if (role === "lead_technician") {
        return jobs.filter((job) => {
          const isLead = job.leadTechnician?.id === userId
          const isAssigned = job.assignedEmployees?.some((u) => u.id === userId)
          const isCreator = job.creator?.id === userId
          return !!(isLead || isAssigned || isCreator)
        })
      }

      // default (employee)
      return jobs.filter((job) => {
        const isAssigned = job.assignedEmployees?.some((u) => u.id === userId)
        const isCreator = job.creator?.id === userId
        return !!(isAssigned || isCreator)
      })
    })()

    return (visibleJobs || []).map((job) => {
      const start = job.startDate ? new Date(job.startDate) : new Date(job.createdAt)
      const end = job.endDate ? new Date(job.endDate) : new Date(start.getTime() + 1000 * 60 * 60 * 2)

      return {
        id: job.id,
        title: job.title,
        description: job.description || undefined,
        startTime: start,
        endTime: end,
        color: mapStatusToColor(job.status),
        category: job.department || "Job",
        attendees: job.assignedEmployees?.map((u) => u.name) || [],
        tags: [job.status],
      } as Event
  })
  }, [jobs])

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {jobEvents.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No events for your role</div>
      ) : (
        <EventManager
          events={jobEvents}
          onEventCreate={(event) => console.log("Created:", event)}
          onEventUpdate={(id, event) => console.log("Updated:", id, event)}
          onEventDelete={(id) => console.log("Deleted:", id)}
          categories={["Meeting", "Task", "Reminder", "Personal", "Job"]}
          availableTags={["Important", "Urgent", "Work", "Personal", "Team", "Client"]}
          defaultView="month"
        />
      )}
    </div>
  )
}

