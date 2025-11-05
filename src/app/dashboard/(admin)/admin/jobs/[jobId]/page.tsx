"use client";

// ✅ Tweak 1: ต้อง import React เข้ามาเพื่อใช้ React.use()
import * as React from "react";
import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation"; // ไม่ได้ใช้แล้ว
import dayjs from "dayjs";
import 'dayjs/locale/th'; // สำหรับภาษาไทย (ถ้าต้องการ)

// Zustand Store
import { useJobStore } from "@/stores/features/jobStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  MapPin,
  Calendar,
  User,
  ClipboardList,
  Paperclip,
  Building,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Loader2 } from "lucide-react";

import dynamic from 'next/dynamic';

const StaticMapView = dynamic(
  () => import('@/components/map/MapMockup'),
  {
    loading: () => (
      <div className="h-[300px] w-full flex items-center justify-center bg-secondary rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'pending_approval': return 'secondary';
    case 'in_progress': return 'info';
    case 'cancelled':
    case 'rejected': return 'destructive';
    default: return 'default';
  }
};

interface JobViewPageProps {
  params: { jobId: string };
}

export default function JobViewPage({ params }: JobViewPageProps) {
  // ✅ Tweak 1: แก้ไข Error โดยใช้ React.use() เพื่อ "แกะ" Promise params
  const { jobId } = React.use(params);

  const getJobById = useJobStore((state) => state.getJobById);
  const job = getJobById(jobId);

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [tasksCompletion, setTasksCompletion] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (job?.tasks) {
      const initialCompletion = job.tasks.reduce((acc, task) => {
        acc[String(task.id)] = task.isCompleted;
        return acc;
      }, {} as { [key: string]: boolean });
      setTasksCompletion(initialCompletion);
    }
  }, [job?.tasks]);

  const handleTaskCompletionChange = (taskId: string, checked: boolean) => {
    setTasksCompletion(prev => ({ ...prev, [taskId]: checked }));
    toast.info(`Task "${job?.tasks?.find(t => t.id === taskId)?.description}" marked as ${checked ? 'completed' : 'pending'}. (No actual update to store)`);
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  if (!job) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading job details...</p>
      </div>
    );
  }

  const completedTasksCount = job.tasks.filter(task => tasksCompletion[String(task.id)]).length;
  const totalTasksCount = job.tasks.length;
  const progressPercentage = totalTasksCount === 0 ? 0 : Math.round((completedTasksCount / totalTasksCount) * 100);

  dayjs.locale('th');

  return (
    <div className="p-4">
      <div className="border rounded-lg p-6"> 
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* --- คอลัมน์ซ้าย (Main Details) --- */}
          <div className="lg:col-span-3 space-y-6">

            {/* --- Section: Header (Status, Create, Title) --- */}
            <div className="space-y-3">
              <Badge variant={getStatusVariant(job.status)} className="capitalize">
                {job.status.replace(/_/g, ' ')}
              </Badge>

              <h1 className="text-3xl font-bold">{job.title}</h1>
              
              <p className="text-sm">
                <span className="text-muted-foreground">Job ID: </span>
                <span className="text-foreground">{job.id.substring(0, 8)}...</span>
              </p>
              
              <p className="text-sm pt-2">
                <span className="text-muted-foreground">Create by: </span>
                <span className="text-foreground">{job.creator.name}</span>
              </p>
              
              <p className="text-sm">
                <span className="text-muted-foreground">Create at: </span>
                <span className="text-foreground">{dayjs(job.createdAt).format('DD/MM/YY')}</span>
              </p>
            </div>

            {/* --- Section: Description --- */}
            {job.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-foreground/90 leading-relaxed break-words">
                  {job.description}
                </p>
              </div>
            )}

            {/* --- Section: Department --- */}
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="text-foreground/90">{job.department || 'N/A'}</p>
            </div>

            {/* --- Section: Team --- */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Lead technician</p>
                {job.leadTechnician ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={job.leadTechnician.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${job.leadTechnician.name}`} alt={job.leadTechnician.name} />
                      <AvatarFallback>{job.leadTechnician.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{job.leadTechnician.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Not assigned</span>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Employees</p>
                {job.assignedEmployees.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {job.assignedEmployees.map(employee => (
                      <div key={employee.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={employee.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${employee.name}`} alt={employee.name} />
                          <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{employee.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No employees assigned</span>
                )}
              </div>
            </div>

            {/* --- Section: Dates --- */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date:</p>
                <p className="text-foreground/90">{job.startDate ? dayjs(job.startDate).format('DD/MM/YY') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date:</p>
                <p className="text-foreground/90">{job.endDate ? dayjs(job.endDate).format('DD/MM/YY') : 'N/A'}</p>
              </div>
            </div>

            {/* --- Section: Attachments --- */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Attachments</p>
              {job.attachments.length > 0 ? (
                <div className="space-y-2">
                  {job.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-md hover:bg-secondary"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm font-medium text-blue-400 hover:underline">
                        {attachment.fileName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-white">No attachments for this job.</span>
              )}
            </div>

            {/* --- Section: Map --- */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Map</p>
              {job.location && job.location.lat != null && job.location.lng != null ? (
                <div className="space-y-2">
                  {job.location.name && (
                    <p className="text-sm font-medium">{job.location.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Latitude: {job.location.lat.toFixed(6)}, Longitude: {job.location.lng.toFixed(6)}
                  </p>
                  <StaticMapView location={job.location} />
                </div>
              ) : (
                <span className="text-sm text-white">No specific location assigned.</span>
              )}
            </div>

          </div>

          {/* --- คอลัมน์ขวา (Tasks, Logs, Inventory) --- */}
          <div className="lg:col-span-2 space-y-8">

            {/* --- Section: All Tasks --- */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">All Tasks</h3>
                <span className="text-sm text-muted-foreground">{completedTasksCount}/{totalTasksCount}</span>
              </div>
              <Progress value={progressPercentage} className="h-2 w-full" />

              {totalTasksCount > 0 ? (
                <div className="space-y-2">
                  {job.tasks.map((task) => (
                    <div key={task.id} className="border border-secondary-foreground/20 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={!!tasksCompletion[String(task.id)]}
                            onCheckedChange={(checked) => handleTaskCompletionChange(String(task.id), checked === true)}
                          />
                          <Label
                            htmlFor={`task-${task.id}`}
                            className={tasksCompletion[String(task.id)] ? "line-through text-muted-foreground" : ""}
                          >
                            {task.description}
                          </Label>
                        </div>
                        {task.details && (
                          <Button variant="ghost" size="icon" onClick={() => toggleTaskExpand(String(task.id))}>
                            {expandedTasks.has(String(task.id)) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                      {expandedTasks.has(String(task.id)) && task.details && (
                        <p className="text-sm text-muted-foreground mt-2 pl-6 border-l-2 border-primary/50">
                          {task.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No tasks defined for this job.</span>
              )}
            </div>

            {/* --- Section: Work Log & History (Placeholder) --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Work Log & History</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow> 
                      <TableHead>Date</TableHead>
                      <TableHead>Update By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* ✅ Tweak 2: ลบข้อมูลเก่าออก และใส่ "Empty State" */}
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No work log history available.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* --- Section: Required Inventory (Placeholder) --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Required Inventory</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Item Type</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* ✅ Tweak 2: ลบข้อมูลเก่าออก และใส่ "Empty State" */}
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No required inventory.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}