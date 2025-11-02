"use client";

import * as React from "react";
import { useState, useEffect } from "react"; // ✅ เพิ่ม useEffect
import { useRouter, useParams } from "next/navigation"; // ✅ เพิ่ม useParams
import { format, parseISO } from "date-fns"; // ✅ เพิ่ม parseISO
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  File as FileIcon,
  X,
  Check,
  UploadCloud,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Import Store, Types, and Mocks
import { useJobStore } from "@/stores/features/jobStore"; // (แก้ path ถ้าจำเป็น)
import { MOCK_USERS } from "@/lib/mocks/user";
import { Job } from "@/lib/types/job";

// Import components จาก shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogPortal, DialogOverlay,DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Interface สำหรับ Task
interface Task {
  id: number;
  header: string;
  description: string;
}

// Interface และข้อมูลตัวอย่างสำหรับพนักงาน
interface Employee {
  value: string;
  label: string;
}

// สร้าง ALL_EMPLOYEES จาก MOCK_USERS ของเรา
const ALL_EMPLOYEES: Employee[] = MOCK_USERS
    .filter(u => u.role === 'employee')
    .map(u => ({ value: u.id, label: u.name }));

// (TaskItem Component เหมือนเดิม)
interface TaskItemProps {
  task: Task;
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
  isChecked: boolean;
  onEdit: (task: Task) => void;
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  index: number;
  totalTasks: number;
}

function TaskItem({
  task, onDelete, onSelect, isChecked, onEdit,
  onMoveUp, onMoveDown, index, totalTasks,
}: TaskItemProps) {
  // (โค้ด TaskItem ทั้งหมดเหมือนเดิม)
  return (
    <div key={task.id} className={cn("rounded-lg border bg-card p-4 shadow-sm transition-all hover:bg-muted/60 hover:shadow-md")}>
      <div className="flex items-start gap-3">
        <Checkbox id={`task-${task.id}`} checked={isChecked} onCheckedChange={() => onSelect(task.id)} className="mt-1" />
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start gap-4">
            <Label htmlFor={`task-${task.id}`} className={cn("flex-1 text-base font-medium leading-tight cursor-pointer", isChecked && "line-through text-muted-foreground")}>
              {task.header}
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMoveUp(task.id)} disabled={index === 0}><ArrowUp className="mr-2 h-4 w-4" /> Move Up</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoveDown(task.id)} disabled={index === totalTasks - 1}><ArrowDown className="mr-2 h-4 w-4" /> Move Down</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {task.description && (<p className={cn("text-sm text-muted-foreground pl-0", isChecked && "line-through")}>{task.description}</p>)}
        </div>
      </div>
    </div>
  );
}


export default function EditJobPage() {
  const router = useRouter();
  const params = useParams(); // ✅ 1. ดึง Params จาก URL
  const { getJobById, updateJob } = useJobStore(); // ✅ 2. ดึง Action ที่จำเป็น
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ✅ 3. State สำหรับ Job ที่ดึงมา
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  // --- State เดิมทั้งหมดของ Component ---
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // เริ่มต้นด้วย Array ว่าง
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [department, setDepartment] = useState<string>("Electrical");
  const [leadTechnician, setLeadTechnician] = useState<string>("user-lead-1");

  // (State อื่นๆ ของ UI เหมือนเดิม)
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTaskHeader, setNewTaskHeader] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editHeader, setEditHeader] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  
  // ✅ State สำหรับ Alert
  const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ --- Logic กรองพนักงาน (เหมือนหน้า Create) --- ✅
  const availableEmployees: Employee[] = React.useMemo(() => {
    return MOCK_USERS
      .filter(u => u.role === 'employee' && u.department === department)
      .map(u => ({ value: u.id, label: u.name }));
  }, [department]);
  
  // ✅ 4. Effect สำหรับดึงข้อมูล Job มาเติมใน State
  useEffect(() => {
    const jobId = params.jobId as string;
    const job = getJobById(jobId);

    if (job) {
      setJobToEdit(job);
      // เติมข้อมูลลงใน State ทั้งหมด
      setStartDate(job.startDate ? parseISO(job.startDate) : undefined);
      setEndDate(job.endDate ? parseISO(job.endDate) : undefined);
      
      // ดึง Tasks เก่ามาแสดง
      setTasks(job.tasks.map((t, i) => ({ 
        id: i, // ใช index เป็น id ชั่วคราว (หรือ t.id ถ้ามี)
        header: t.description, // Store ของคุณเก็บ header ไว้ใน description
        description: t.details || '' 
      })));

      setSelectedEmployees(job.assignedEmployees.map(u => ({ value: u.id, label: u.name })));
      setDepartment(job.department || 'Electrical'); // ใช้ค่าจาก job
      setLeadTechnician(job.leadTechnician?.id || 'user-lead-1'); // ใช้ค่าจาก job
    } else {
      router.push("/dashboard/admin/jobs"); // ถ้าไม่เจอ Job ให้เด้งกลับ
    }
  }, [params.jobId, getJobById, router]);
  
  // --- (ฟังก์ชันเดิมทั้งหมด) ---
  const deleteTask = (id: number) => { setTasks((prev) => prev.filter((task) => task.id !== id)); setSelectedTasks((prev) => prev.filter((selectedId) => selectedId !== id)); };
  const deleteAttachment = (fileName: string) => setAttachments(attachments.filter((file) => file.name !== fileName));
  const handleRemoveEmployee = (value: string) => setSelectedEmployees(selectedEmployees.filter((emp) => emp.value !== value));
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prevFiles) => [...prevFiles, ...files]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prevFiles) => [...prevFiles, ...files]);
  };
  const openFileDialog = () => fileInputRef.current?.click();
  const handleTaskSelection = (taskId: number) => { setSelectedTasks((prev) => prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]); };
  const deleteSelectedTasks = () => { setTasks((prev) => prev.filter((task) => !selectedTasks.includes(task.id))); setSelectedTasks([]); };
  const deleteAllTasks = () => { setTasks([]); setSelectedTasks([]); };
  const handleSelectAll = () => { if (selectedTasks.length === tasks.length) { setSelectedTasks([]); } else { setSelectedTasks(tasks.map((task) => task.id)); } };
  const handleAddNewTask = () => {
    if (newTaskHeader.trim() === "") return;
    const newTask: Task = { id: Date.now(), header: newTaskHeader, description: newTaskDescription };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setNewTaskHeader(""); setNewTaskDescription(""); setIsAddTaskDialogOpen(false);
  };
  const handleOpenEditDialog = (task: Task) => { setTaskToEdit(task); setEditHeader(task.header); setEditDescription(task.description); setIsEditDialogOpen(true); };
  const handleSaveEdit = () => {
    if (!taskToEdit) return;
    setTasks((prevTasks) => prevTasks.map((task) => task.id === taskToEdit.id ? { ...task, header: editHeader, description: editDescription } : task));
    setIsEditDialogOpen(false); setTaskToEdit(null); setEditHeader(""); setEditDescription("");
  };
  const handleMoveTaskUp = (id: number) => {
    setTasks((prevTasks) => {
      const currentIndex = prevTasks.findIndex((t) => t.id === id);
      if (currentIndex <= 0) return prevTasks;
      const newTasks = [...prevTasks];
      [newTasks[currentIndex - 1], newTasks[currentIndex]] = [newTasks[currentIndex], newTasks[currentIndex - 1]];
      return newTasks;
    });
  };
  const handleMoveTaskDown = (id: number) => {
    setTasks((prevTasks) => {
      const currentIndex = prevTasks.findIndex((t) => t.id === id);
      if (currentIndex === -1 || currentIndex >= prevTasks.length - 1) return prevTasks;
      const newTasks = [...prevTasks];
      [newTasks[currentIndex + 1], newTasks[currentIndex]] = [newTasks[currentIndex], newTasks[currentIndex + 1]];
      return newTasks;
    });
  };

  const isAllSelected = tasks.length > 0 && selectedTasks.length === tasks.length;
  const isIndeterminate = selectedTasks.length > 0 && selectedTasks.length < tasks.length;

  // ✅ 5. ฟังก์ชัน handleSubmit ที่เรียกใช้ "updateJob"
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!jobToEdit) return;
    
    const formElements = e.currentTarget.elements as typeof e.currentTarget.elements & {
        jobTitle: { value: string };
        jobDescription: { value: string };
    };
    const title = formElements.jobTitle.value;
    
    if (!title || title.trim() === "") {
      setErrorMessage("กรุณากรอก Job Title ให้ครบถ้วน");
      setIsErrorAlertOpen(true);
      return;
    }

    setIsSubmitting(true);
    const updatedData = {
      title: title,
      description: formElements.jobDescription.value,
      leadTechnicianId: leadTechnician,
      department: department,
      assignedEmployeeIds: selectedEmployees.map(emp => emp.value),
      startDate: startDate,
      endDate: endDate,
      tasks: tasks.map(t => ({ description: t.header })),
      attachments: attachments,
    };

    updateJob(jobToEdit.id, updatedData);
    router.push("/dashboard/admin/jobs");
  };

  if (!jobToEdit) {
    return <div>Loading...</div>; // แสดงหน้าโหลดขณะดึงข้อมูล
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="items-center">
        <Badge variant="secondary">{jobToEdit.status}</Badge> 
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <form id="edit-job-form" className="md:col-span-3 space-y-6" onSubmit={handleSubmit}>
          
          {/* ✅ 6. เติมข้อมูลเดิมลงในฟอร์ม (defaultValue) */}
          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" name="jobTitle" placeholder="Enter job title" className="mt-2" defaultValue={jobToEdit.title} />
          </div>
          <div>
            <Label htmlFor="jobDescription">Job Discriptions</Label>
            <Textarea id="jobDescription" name="jobDescription" placeholder="Enter job description" rows={5} className="mt-2" defaultValue={jobToEdit.description || ''} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="leadTechnician">Lead technician</Label>
              <Select name="leadTechnician" value={leadTechnician} onValueChange={setLeadTechnician}>
                <SelectTrigger id="leadTechnician" className="mt-2">
                  <SelectValue placeholder="Select leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user-lead-1">สมศักดิ์ ช่างใหญ่</SelectItem>
                  <SelectItem value="user-manager-1">วิภา หัวหน้าทีม</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Select Department</Label>
              <Select name="department" value={department} onValueChange={(value) => {
                  setDepartment(value);
                  setSelectedEmployees([]); // ✅ ล้างค่าพนักงานที่เลือกไว้เมื่อเปลี่ยนแผนก
              }}>
                <SelectTrigger id="department" className="mt-2">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electrical">แผนกช่างไฟ (Electrical)</SelectItem>
                  <SelectItem value="Mechanical">แผนกช่างกล (Mechanical)</SelectItem>
                  <SelectItem value="Technical">แผนกช่างเทคนิค (Technical)</SelectItem>
                  <SelectItem value="Civil">แผนกช่างโยธา (Civil)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assign employee</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between mt-2 h-auto min-h-10">
                  <div className="flex gap-1 flex-wrap">
                    {selectedEmployees.length > 0 ? (
                      selectedEmployees.map((emp) => (
                        <Badge key={emp.value} variant="secondary" className="gap-1.5">
                          {emp.label}
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={`Remove ${emp.label}`}
                            onClick={(e) => {
                              e.stopPropagation(); 
                              handleRemoveEmployee(emp.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                handleRemoveEmployee(emp.value);
                              }
                            }}
                            className="rounded-full hover:bg-muted-foreground/20"
                          >
                            <X className="h-3 w-3" />
                          </div>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground font-normal">Employee name</span>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search employee..." />
                  <CommandList>
                    <CommandEmpty>No employee found in this department.</CommandEmpty>
                    <CommandGroup>
                      {availableEmployees.map((emp) => {
                        const isSelected = selectedEmployees.some((s) => s.value === emp.value);
                        return (
                          <CommandItem key={emp.value} onSelect={() => {
                            if (isSelected) {
                              handleRemoveEmployee(emp.value);
                            } else {
                              setSelectedEmployees([...selectedEmployees, emp]);
                            }
                          }}>
                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                            {emp.label}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-2", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-2", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Attachments</Label>
            <div className={cn("mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 transition-colors", isDragging && "border-primary bg-muted/50")} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Drag 'n' drop</span> files here, or{" "}
                  <Button type="button" variant="link" className="p-0 h-auto font-semibold text-primary" onClick={openFileDialog}>click to browse</Button>.
                </p>
                <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
            </div>
            <div className="space-y-2 mt-4">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2.5 rounded-md border bg-muted/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate" title={file.name}>{file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => deleteAttachment(file.name)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="md:col-span-2 space-y-8">
          <div className="space-y-2">
            <Label htmlFor="location">Map Picker</Label>
            <div className="flex gap-2 mt-2">
              <Input id="location" placeholder="location name...." />
              <Button variant="ghost">clear</Button>
            </div>
            <div className="h-64 w-full rounded-md bg-muted flex items-center justify-center">
              <p className="text-muted-foreground text-sm">[Map Component (e.g., Google Maps, Leaflet) goes here]</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Checkbox id="select-all-tasks" checked={isAllSelected} onCheckedChange={handleSelectAll} data-state={isIndeterminate ? "indeterminate" : isAllSelected ? "checked" : "unchecked"} disabled={tasks.length === 0} />
                <Label htmlFor="select-all-tasks" className="text-lg font-medium">Tasks</Label>
              </div>
              <div className="flex items-center gap-2">
                {selectedTasks.length > 0 && (
                  <Button type="button" variant="destructive" size="sm" onClick={deleteSelectedTasks}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedTasks.length})
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={tasks.length === 0}>
                      View All ({tasks.length})
                    </Button>
                  </DialogTrigger>
                  <DialogPortal>
                    <DialogOverlay className="bg-black/40" />
                    <DialogContent className="sm:max-w-xl md:max-w-2xl h-[80vh] flex flex-col">
                      <DialogHeader><DialogTitle>All Tasks ({tasks.length})</DialogTitle></DialogHeader>
                      <div className="flex justify-between items-center p-1 border-b pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          <Checkbox id="select-all-tasks-popup" checked={isAllSelected} onCheckedChange={handleSelectAll} data-state={isIndeterminate ? "indeterminate" : isAllSelected ? "checked" : "unchecked"} disabled={tasks.length === 0} />
                          <Label htmlFor="select-all-tasks-popup" className="text-sm font-medium">Select All</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedTasks.length > 0 && (
                            <Button type="button" variant="destructive" size="sm" onClick={deleteSelectedTasks}><Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedTasks.length})</Button>
                          )}
                          <Button type="button" variant="ghost" size="sm" onClick={deleteAllTasks} disabled={tasks.length === 0} className="text-destructive hover:text-destructive hover:bg-destructive/10">Delete All</Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="p-1 space-y-4 pr-4">
                          {tasks.map((task, index) => (
                            <TaskItem key={task.id} task={task} onDelete={deleteTask} onSelect={handleTaskSelection} isChecked={selectedTasks.includes(task.id)} onEdit={handleOpenEditDialog} index={index} totalTasks={tasks.length} onMoveUp={handleMoveTaskUp} onMoveDown={handleMoveTaskDown} />
                          ))}
                        </div>
                      </ScrollArea>
                      <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </DialogPortal>
                </Dialog>
              </div>
            </div>
            <ScrollArea className="h-48 w-full rounded-md border">
              {tasks.length > 0 ? (
                <div className="p-4 space-y-4">
                  {tasks.map((task, index) => (
                    <TaskItem key={task.id} task={task} onDelete={deleteTask} onSelect={handleTaskSelection} isChecked={selectedTasks.includes(task.id)} onEdit={handleOpenEditDialog} index={index} totalTasks={tasks.length} onMoveUp={handleMoveTaskUp} onMoveDown={handleMoveTaskDown} />
                  ))}
                </div>
              ) : (
                <div className="p-4"><p className="text-sm text-muted-foreground text-center">No tasks added yet.</p></div>
              )}
            </ScrollArea>
            <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="w-full"><Plus className="mr-2 h-4 w-4" /> Add task</Button>
              </DialogTrigger>
              <DialogPortal>
                <DialogOverlay className="bg-black/40" />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-task-header">Task Header</Label>
                      <Input id="new-task-header" placeholder="Enter task header" value={newTaskHeader} onChange={(e) => setNewTaskHeader(e.target.value)} className="mt-1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-task-description">Description</Label>
                      <Textarea id="new-task-description" placeholder="Enter task description" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} rows={3} className="mt-1" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleAddNewTask}>Save Task</Button>
                  </DialogFooter>
                </DialogContent>
              </DialogPortal>
            </Dialog>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogPortal>
                <DialogOverlay className="bg-black/40" />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-task-header">Task Header</Label>
                      <Input id="edit-task-header" value={editHeader} onChange={(e) => setEditHeader(e.target.value)} className="mt-1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-task-description">Description</Label>
                      <Textarea id="edit-task-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="mt-1" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSaveEdit}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </DialogPortal>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="ghost" type="button" onClick={() => router.back()}>cancel</Button>
        <Button type="submit" form="edit-job-form" disabled={isSubmitting}>
          Save Changes
        </Button>
      </div>

      {/* ✅ --- Dialog สำหรับแจ้งเตือน --- ✅ */}
      <AlertDialog open={isErrorAlertOpen} onOpenChange={setIsErrorAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ข้อมูลไม่ครบถ้วน</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsErrorAlertOpen(false)}>
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --- สิ้นสุด Dialog --- */}

    </div>
  );
}