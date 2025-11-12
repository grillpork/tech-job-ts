"use client";

// ✅ Tweak 1: ต้อง import React เข้ามาเพื่อใช้ React.use()
import * as React from "react";
import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation"; // ไม่ได้ใช้แล้ว
import dayjs from "dayjs";
import 'dayjs/locale/th'; // สำหรับภาษาไทย (ถ้าต้องการ)

// Zustand Store
import { useJobStore } from "@/stores/features/jobStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useUserStore } from "@/stores/features/userStore";

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
import { useParams } from "next/navigation";

const StaticMapView = dynamic(
  () => import('@/components/map/MapContainer'),
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
    case 'completed':
      return 'default';
    case 'pending_approval':
      return 'secondary';
    case 'in_progress':
      return 'outline';
    case 'cancelled':
    case 'rejected':
      return 'destructive';
    default:
      return 'default';
  }
};

export default function JobViewPage() {
  // ✅ Tweak 1: แก้ไข Error โดยใช้ React.use() เพื่อ "แกะ" Promise params
  const params = useParams();
  const jobId = params.jobId as string;

  const getJobById = useJobStore((state) => state.getJobById);
  const { inventories } = useInventoryStore();
  const { currentUser } = useUserStore();
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
    <div className="p-">
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
              {job.attachments && job.attachments.length > 0 ? (
                <div className="space-y-2">
                  {job.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-md hover:bg-secondary transition-colors"
                    >
                      <Paperclip className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-blue-400 hover:underline block truncate">
                          {attachment.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dayjs(attachment.uploadedAt).format('DD/MM/YY HH:mm')}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-4 border rounded-md text-center">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <span className="text-sm text-muted-foreground">ไม่มีไฟล์แนบสำหรับงานนี้</span>
                </div>
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
                  <StaticMapView
                    location={job.location}
                    className="h-[280px] sm:h-[320px] md:h-[380px] w-full rounded-md overflow-hidden relative z-0"
                  />
                </div>
              ) : (
                <span className="text-sm text-white">No specific location assigned.</span>
              )}
            </div>

            {/* --- Section: Location Images --- */}
            {job.locationImages && job.locationImages.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">รูปภาพสถานที่</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {job.locationImages.map((imageUrl, index) => (
                    <div key={index} className="relative group aspect-video rounded-md border overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt={`Location image ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* --- Section: Work Log & History --- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Work Log & History</h3>
                {job.workLogs && job.workLogs.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {job.workLogs.length} รายการ
                  </Badge>
                )}
              </div>
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
                    {job.workLogs && job.workLogs.length > 0 ? (
                      job.workLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {dayjs(log.date).format('DD/MM/YY HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs">
                                  {log.updatedBy.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{log.updatedBy.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(log.status)} className="text-xs capitalize">
                              {log.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {log.note}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardList className="h-8 w-8 opacity-50" />
                            <span>ไม่มีประวัติการทำงาน</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* --- Section: Required Inventory --- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Required Inventory</h3>
                {job.usedInventory && job.usedInventory.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {job.usedInventory.length} รายการ
                  </Badge>
                )}
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Item Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.usedInventory && job.usedInventory.length > 0 ? (
                      job.usedInventory.map((usedInv) => {
                        const inventoryItem = inventories.find((inv) => inv.id === usedInv.id);
                        if (!inventoryItem) {
                          return (
                            <TableRow key={usedInv.id}>
                              <TableCell colSpan={4} className="text-sm text-muted-foreground">
                                ไม่พบข้อมูลอุปกรณ์ (ID: {usedInv.id})
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return (
                          <TableRow key={usedInv.id}>
                            <TableCell className="font-medium">
                              {inventoryItem.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {inventoryItem.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">{usedInv.qty}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                / {inventoryItem.quantity} available
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  inventoryItem.status === "Available"
                                    ? "default"
                                    : inventoryItem.status === "In Use"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {inventoryItem.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Building className="h-8 w-8 opacity-50" />
                            <span>ไม่มีอุปกรณ์ที่ต้องการ</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
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