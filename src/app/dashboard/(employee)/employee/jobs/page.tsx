"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { MoreHorizontal, Search, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { type Dispatch } from '@uiw/react-signature';

// Zustand Store
import { useJobStore } from "@/stores/features/jobStore";

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type
import { Job } from "@/lib/types/job";

export default function JobManagementPage() {
  const router = useRouter();

  const allJobs = useJobStore((state) => state.jobs);
  const completeJob = useJobStore((state) => state.completeJob);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const handleComplete = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };

  const confirmComplete = () => {
    if (jobToDelete) {
      completeJob(jobToDelete.id);
      toast.success("Job completed successfully!");
      setIsDeleteDialogOpen(false);
    }
  };

  const filteredJobs = allJobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Job Management</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={(id) =>
                    router.push(`/dashboard/employee/jobs/${id}`)
                  }
                  onEdit={(id) =>
                    router.push(`/dashboard/employee/jobs/edit/${id}`)
                  }
                  onDelete={handleComplete}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-12">
                <p>No jobs found.</p>
                <p className="text-sm">
                  Try adjusting your search or add a new job.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the job titled "{jobToDelete?.title}" as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmComplete}>
                Complete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Job Card Component ---
interface JobCardProps {
  job: Job;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (job: Job) => void;
}

function JobCard({ job, onView, onEdit, onDelete }: JobCardProps) {
  const employees = job.assignedEmployees;

  return (
    <Card className="flex flex-col justify-between shadow-sm hover:scale-105 hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle
              className="text-lg font-semibold leading-tight hover:underline cursor-pointer"
              onClick={() => onView(job.id)}
            >
              {job.title}
            </CardTitle>
            <Badge className="capitalize mt-2" variant={getStatusVariant(job.status)}>
              {job.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(job.id)}>
                View
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => onEdit(job.id)}>
                Edit
              </DropdownMenuItem> */}
              <DropdownMenuItem
                onClick={() => onDelete(job)}
              >
               Comleted
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Created by: {job.creator?.name ?? "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Created on: {dayjs(job.createdAt).format("DD MMM YYYY")}</span>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex flex-col w-full">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            ASSIGNED TO:
          </p>
          {!employees || employees.length === 0 ? (
            <span className="text-sm text-muted-foreground italic">
              Unassigned
            </span>
          ) : (
            <div className="flex -space-x-2">
              <TooltipProvider>
                {employees.slice(0, 4).map((emp) => (
                  <Tooltip key={emp.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage
                          src={
                            emp.imageUrl ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${emp.name}`
                          }
                          alt={emp.name}
                        />
                        <AvatarFallback>
                          {emp.name.substring(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{emp.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
              {employees.length > 4 && (
                <Avatar className="h-8 w-8 border-2 border-background bg-muted text-muted-foreground flex items-center justify-center text-xs">
                  +{employees.length - 4}
                </Avatar>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// --- Helper ---
const getStatusVariant = (
  status: string
): "outline" | "default" | "destructive" | "secondary" | null | undefined => {
  switch (status) {
    case "completed":
      return "default";
    case "pending_approval":
      return "secondary";
    case "in_progress":
      return "outline";
    case "cancelled":
    case "rejected":
      return "destructive";
    default:
      return "default";
  }
};
