"use client"; // ต้องเป็น Client Component เพราะมีการใช้ state

import * as React from "react";
import { useState, useCallback, useRef, memo, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation"; // ✅ 1. Import router
import { format } from "date-fns";
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
  ToolCase,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ 2. Import Store, Types, and Mocks
import { useJobStore } from "@/stores/features/jobStore"; // (แก้ path ถ้าจำเป็น)
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { MOCK_USERS } from "@/lib/mocks/user";
import { Task as JobTask } from "@/lib/types/job";
import { MapPicker } from '@/components/map/MapPicker';

// Import components จาก shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
// ✅ 3. Import Alert Dialog
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

interface InventoryOption {
  value: string;
  label: string;
  qty?: number;
}

// ✅ 4. สร้าง ALL_EMPLOYEES จาก MOCK_USERS ของเรา
const ALL_EMPLOYEES: Employee[] = MOCK_USERS
    .filter(u => u.role === 'employee')
    .map(u => ({ value: u.id, label: u.name }));

// (ข้อมูล initialTasks เดิมของคุณ)
const initialTasks: Task[] = [
  { id: 1, header: "Task 1", description: "Description 1" },
  { id: 2, header: "Task 2", description: "Description 2" },
  { id: 3, header: "Task 3", description: "Description 3" },
  { id: 4, header: "Task 4", description: "Description 4" },
  { id: 5, header: "Task 5", description: "Description 5" },
  { id: 6, header: "Task 6", description: "Description 6" },
];

// (TaskItem Component เดิมของคุณ)
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
const TaskItem = memo(function TaskItem({
  task,
  onDelete,
  onSelect,
  isChecked,
  onEdit,
  onMoveUp,
  onMoveDown,
  index,
  totalTasks,
}: TaskItemProps) {
  return (
    <div
      key={task.id}
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm transition-all",
        "hover:bg-muted/60 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={`task-${task.id}`}
          checked={isChecked}
          onCheckedChange={() => onSelect(task.id)}
          className="mt-1"
        />
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start gap-4">
            <Label
              htmlFor={`task-${task.id}`}
              className={cn(
                "flex-1 text-base font-medium leading-tight cursor-pointer",
                isChecked && "line-through text-muted-foreground"
              )}
            >
              {task.header}
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onMoveUp(task.id)}
                  disabled={index === 0}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Move Up
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMoveDown(task.id)}
                  disabled={index === totalTasks - 1}
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Move Down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {task.description && (
            <p
              className={cn(
                "text-sm text-muted-foreground pl-0",
                isChecked && "line-through"
              )}
            >
              {task.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

export default function CreateJobPage() {
  
  // ✅ --- 5. เพิ่ม Logic การเชื่อมต่อ Store และ Router --- ✅
  const router = useRouter();
  const createJob = useJobStore((state) => state.createJob);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // --- 1. STATE MANAGEMENT (เหมือนเดิม) ---
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [invPopoverOpen, setInvPopoverOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]); // ✅ แก้ไข: เริ่มต้นเป็น Array ว่าง
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTaskHeader, setNewTaskHeader] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editHeader, setEditHeader] = useState("");
  const [editDescription, setEditDescription] = useState("");
  // ✅ Inventory selection state
  const inventories = useInventoryStore((s) => s.inventories);
  const [selectedInventory, setSelectedInventory] = useState<InventoryOption[]>([]);
  // Location selected from MapPicker
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string | null } | null>(null);

  
  // ✅ 6. เพิ่ม State สำหรับ Department, Lead Tech, และ Alert
  const [department, setDepartment] = useState<string>("Electrical");
  const [leadTechnician, setLeadTechnician] = useState<string>("user-lead-1");
  const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ 7. เพิ่ม Logic กรองพนักงาน
  const availableEmployees: Employee[] = React.useMemo(() => {
    return MOCK_USERS
      .filter(u => u.role === 'employee' && u.department === department)
      .map(u => ({ value: u.id, label: u.name }));
  }, [department]);

  const availableInventories: InventoryOption[] = React.useMemo(() => {
    return inventories.map((i) => ({ value: i.id, label: i.name, qty: i.quantity }));
  }, [inventories]);

  const handleRemoveInventory = useCallback((value: string) => {
    setSelectedInventory((prev) => prev.filter((inv) => inv.value !== value));
  }, []);

  const handleChangeInventoryQty = useCallback((value: string, qty: number) => {
    setSelectedInventory((prev) => prev.map((inv) => (inv.value === value ? { ...inv, qty } : inv)));
  }, []);

  // --- 2. EVENT HANDLERS (เหมือนเดิม) ---
  const handleRemoveEmployee = useCallback((value: string) => {
    setSelectedEmployees((prev) => prev.filter((emp) => emp.value !== value));
  }, []);
  const deleteAttachment = useCallback((fileName: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== fileName));
  }, []);
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prevFiles) => [...prevFiles, ...files]);
  }, []);
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prevFiles) => [...prevFiles, ...files]);
  }, []);
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);
  const deleteTask = useCallback((id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setSelectedTasks((prev) => prev.filter((selectedId) => selectedId !== id));
  }, []);
  const handleTaskSelection = useCallback((taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  }, []);
  const deleteSelectedTasks = useCallback(() => {
    setTasks((prev) => prev.filter((task) => !selectedTasks.includes(task.id)));
    setSelectedTasks([]);
  }, [selectedTasks]);
  const deleteAllTasks = useCallback(() => {
    setTasks([]);
    setSelectedTasks([]);
  }, []);
  const handleSelectAll = useCallback(() => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((task) => task.id));
    }
  }, [selectedTasks.length, tasks]);
  const handleAddNewTask = useCallback(() => {
    if (newTaskHeader.trim() === "") return;
    const newTask: Task = {
      id: Date.now(),
      header: newTaskHeader,
      description: newTaskDescription,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setNewTaskHeader("");
    setNewTaskDescription("");
    setIsAddTaskDialogOpen(false);
  }, [newTaskHeader, newTaskDescription]);
  const handleOpenEditDialog = useCallback((task: Task) => {
    setTaskToEdit(task);
    setEditHeader(task.header);
    setEditDescription(task.description);
    setIsEditDialogOpen(true);
  }, []);
  const handleSaveEdit = useCallback(() => {
    if (!taskToEdit) return;
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskToEdit.id
          ? { ...task, header: editHeader, description: editDescription }
          : task
      )
    );
    setIsEditDialogOpen(false);
    setTaskToEdit(null);
    setEditHeader("");
    setEditDescription("");
  }, [taskToEdit, editHeader, editDescription]);
  const handleMoveTaskUp = useCallback((id: number) => {
    setTasks((prevTasks) => {
      const currentIndex = prevTasks.findIndex((t) => t.id === id);
      if (currentIndex <= 0) return prevTasks;
      const newTasks = [...prevTasks];
      [newTasks[currentIndex - 1], newTasks[currentIndex]] = [
        newTasks[currentIndex],
        newTasks[currentIndex - 1],
      ];
      return newTasks;
    });
  }, []);
  const handleMoveTaskDown = useCallback((id: number) => {
    setTasks((prevTasks) => {
      const currentIndex = prevTasks.findIndex((t) => t.id === id);
      if (currentIndex === -1 || currentIndex >= prevTasks.length - 1) {
        return prevTasks;
      }
      const newTasks = [...prevTasks];
      [newTasks[currentIndex + 1], newTasks[currentIndex]] = [
        newTasks[currentIndex],
        newTasks[currentIndex + 1],
      ];
      return newTasks;
    });
  }, []);

  // --- Derived State (เหมือนเดิม) ---
  const isAllSelected = tasks.length > 0 && selectedTasks.length === tasks.length;
  const isIndeterminate =
    selectedTasks.length > 0 && selectedTasks.length < tasks.length;

  // ✅ --- 8. สร้างฟังก์ชัน handleSubmit --- ✅
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formElements = e.currentTarget.elements as typeof e.currentTarget.elements & {
        jobTitle: { value: string };
        jobDescription: { value: string };
    };
    const title = formElements.jobTitle.value;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title || title.trim() === "") {
      setErrorMessage("กรุณากรอก Job Title ให้ครบถ้วน");
      setIsErrorAlertOpen(true);
      return; // หยุดการทำงาน
    }

    setIsSubmitting(true);
    const jobData = {
      title: title,
      description: formElements.jobDescription.value,
      leadTechnicianId: leadTechnician,
      department: department,
      assignedEmployeeIds: selectedEmployees.map(emp => emp.value),
  usedInventory: selectedInventory.map(inv => ({ id: inv.value, qty: inv.qty ?? 1 })),
  status: "pending" as const,
  startDate: startDate ? startDate.toISOString() : null,
  endDate: endDate ? endDate.toISOString() : null,
  tasks: tasks.map(t => ({ description: t.header })), // ส่ง Tasks ที่แปลงแล้ว
      creatorId: leadTechnician, // ใช้ Lead Tech เป็น Creator
      location: location ?? null,
    };

    createJob(jobData);
    router.push("/dashboard/admin/jobs");
  };


  // ==================================
  // === 3. RENDER / JSX ===
  // ==================================
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="items-center">
        <Badge variant="secondary">pending</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* ✅ 9. เพิ่ม onSubmit ที่นี่ */}
        <form id="create-job-form" className="md:col-span-3 space-y-6" onSubmit={handleSubmit}>
          {/* Job Title */}
          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            {/* ✅ 10. เพิ่ม name attribute */}
            <Input id="jobTitle" name="jobTitle" placeholder="Enter job title" className="mt-2" />
          </div>

          {/* Job Discriptions */}
          <div>
            <Label htmlFor="jobDescription">Job Discriptions</Label>
            {/* ✅ 10. เพิ่ม name attribute */}
            <Textarea
              id="jobDescription"
              name="jobDescription"
              placeholder="Enter job description"
              className="mt-2 resize-none h-15 overflow-y-auto"
            />
          </div>

          {/* Grid ย่อยสำหรับ Selects (Responsive อยู่แล้ว) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="leadTechnician">Lead technician</Label>
              {/* ✅ 11. เชื่อมต่อ State กับ Select */}
              <Select name="leadTechnician" value={leadTechnician} onValueChange={setLeadTechnician}>
                <SelectTrigger id="leadTechnician" className="w-full mt-2">
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
              {/* ✅ 11. เชื่อมต่อ State กับ Select */}
              <Select name="department" value={department} onValueChange={(value) => {
                  setDepartment(value);
                  setSelectedEmployees([]); // ล้างค่าพนักงานเมื่อเปลี่ยนแผนก
              }}>
                <SelectTrigger id="department" className="w-full mt-2">
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

          {/* Assign Employee */}
          <div>
            <Label>Assign employee</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between mt-2 h-auto min-h-10"
                >
                  <div className="flex gap-1 flex-wrap">
                    {selectedEmployees.length > 0 ? (
                      selectedEmployees.map((emp) => (
                        <Badge
                          key={emp.value}
                          variant="secondary"
                          className="gap-1.5"
                        >
                          {emp.label}
                          {/* ✅ 12. แก้ปัญหาปุ่มซ้อนปุ่ม (เปลี่ยนเป็น <div>) */}
                          <div
                            role="button" tabIndex={0}
                            aria-label={`Remove ${emp.label}`}
                            onClick={(e) => { e.stopPropagation(); handleRemoveEmployee(emp.value); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleRemoveEmployee(emp.value); } }}
                            className="rounded-full hover:bg-muted-foreground/20"
                          >
                            <X className="h-3 w-3" />
                          </div>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground font-normal">
                        Employee name
                      </span>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search employee..." />
                  <CommandList>
                    <CommandEmpty>No employee found in this department.</CommandEmpty>
                    <CommandGroup>
                      {/* ✅ 13. ใช้ 'availableEmployees' ที่กรองแล้ว */}
                      {availableEmployees.map((emp) => {
                        const isSelected = selectedEmployees.some(
                          (s) => s.value === emp.value
                        );
                        return (
                          <CommandItem
                            key={emp.value}
                            onSelect={() => {
                              if (isSelected) {
                                handleRemoveEmployee(emp.value);
                              } else {
                                setSelectedEmployees([...selectedEmployees, emp]);
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
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

          {/* Used Inventory */}
          <div>
            <Label>Used inventory <span className="text-xs text-muted-foreground">(select items used on site)</span></Label>
            <Popover open={invPopoverOpen} onOpenChange={setInvPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={invPopoverOpen}
                  className="w-full justify-between mt-2 h-auto min-h-10"
                >
                  <div className="flex gap-1 flex-wrap items-center">
                    <ToolCase className="h-4 w-4 text-muted-foreground mr-1" />
                      {selectedInventory.length > 0 ? (
                      selectedInventory.map((inv) => (
                        <div key={inv.value} className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="gap-1.5"
                            title={`${inv.label} — ${inv.qty ?? "-"} pcs`}
                          >
                            {inv.label}
                            <div
                              role="button" tabIndex={0}
                              aria-label={`Remove ${inv.label}`}
                              onClick={(e) => { e.stopPropagation(); handleRemoveInventory(inv.value); }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleRemoveInventory(inv.value); } }}
                              className="rounded-full hover:bg-muted-foreground/20"
                            >
                              <X className="h-3 w-3" />
                            </div>
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              value={String(inv.qty ?? 1)}
                              onChange={(e) => handleChangeInventoryQty(inv.value, Math.max(1, Number(e.target.value || 1)))}
                              className="w-16 h-7 text-sm"
                            />
                            <span className="text-xs text-muted-foreground">pcs</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground font-normal">No items selected</span>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search inventory..." />
                  <CommandList>
                    <CommandEmpty>No inventory found.</CommandEmpty>
                    <CommandGroup>
                      {availableInventories.map((inv) => {
                        const isSelected = selectedInventory.some((s) => s.value === inv.value);
                        return (
                          <CommandItem
                            key={inv.value}
                            onSelect={() => {
                              if (isSelected) {
                                handleRemoveInventory(inv.value);
                              } else {
                                setSelectedInventory([...selectedInventory, { ...inv, qty: 1 }]);
                              }
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                            <div className="flex items-center justify-between w-full">
                              <div className="truncate">{inv.label}</div>
                              <div className="text-xs text-muted-foreground">{inv.qty ?? 0} pcs</div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Grid ย่อยสำหรับ Date Pickers (Responsive อยู่แล้ว) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="startDate">Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDate">End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Attachments (FIXED) */}
          <div>
            <Label>Attachments</Label>
            {/* Dropzone Area (Main Container) */}
            <div
              className={cn(
                "mt-2 rounded-lg border border-dashed border-input transition-colors",
                "flex flex-col",
                "h-45.5",
                isDragging && "border-primary bg-muted/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Hidden File Input */}
              {/* ✅ 14. แก้ไข Typo 'handlerFileSelect' -> 'handleFileSelect' */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Conditional Content */}
              {attachments.length === 0 ? (
                // STATE 1: Empty. Show big prompt.
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center p-6 cursor-pointer"
                  onClick={openFileDialog} // Click anywhere in the empty box
                >
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      Drag 'n' drop
                    </span>{" "}
                    files here, or{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto font-semibold text-primary"
                      onClick={(e) => {
                        e.stopPropagation(); // Don't trigger parent onClick
                        openFileDialog();
                      }}
                    >
                      click to browse
                    </Button>
                    .
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 5MB
                  </p>
                </div>
              ) : (
                // STATE 2: Files exist. Show list + small prompt.
                <>
                  {/* Small prompt at the top */}
                  <div className="p-4 border-b border-dashed">
                    <p className="text-sm text-muted-foreground text-center">
                      <span className="font-semibold text-primary">
                        Drag 'n' drop
                      </span>{" "}
                      more files, or{" "}
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto font-semibold text-primary"
                        onClick={openFileDialog}
                      >
                        click to browse
                      </Button>
                      .
                    </p>
                  </div>

                  {/* Scrollable File List */}
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="space-y-2 p-4">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2.5 rounded-md border bg-muted/50"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileIcon className="h-4 w-4 flex-shrink-0" />
                            <span
                              className="text-sm truncate"
                              title={file.name}
                            >
                              {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => deleteAttachment(file.name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          </div>
        </form>

        {/* =================================== */}
        {/* ======     คอลัมน์ขวา (Map & Tasks)      ====== */}
        {/* =================================== */}
        <div className="md:col-span-2 space-y-8">
          {/* Map Picker */}
          <div className="space-y-2">
            <Label htmlFor="location">Map Picker</Label>
            <div className="mt-2">
              <MapPicker initialPosition={location} onPositionChange={setLocation} />
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-4">
            {/* Dialog นี้สำหรับ "View All" */}
            <Dialog>
              {/* Header (Main Page) */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all-tasks"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    data-state={
                      isIndeterminate
                        ? "indeterminate"
                        : isAllSelected
                        ? "checked"
                        : "unchecked"
                    }
                    disabled={tasks.length === 0}
                  />
                  <Label
                    htmlFor="select-all-tasks"
                    className="text-lg font-medium"
                  >
                    Tasks
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTasks.length > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedTasks}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete ({selectedTasks.length})
                    </Button>
                  )}
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tasks.length === 0}
                    >
                      View All ({tasks.length})
                    </Button>
                  </DialogTrigger>
                </div>
              </div>

              {/* Scroll Area (Main Page) */}
              <ScrollArea className="h-48 w-full rounded-md border">
                {tasks.length > 0 ? (
                  <div className="p-4 space-y-4">
                    {tasks.map((task, index) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onDelete={deleteTask}
                        onSelect={handleTaskSelection}
                        isChecked={selectedTasks.includes(task.id)}
                        onEdit={handleOpenEditDialog}
                        index={index}
                        totalTasks={tasks.length}
                        onMoveUp={handleMoveTaskUp}
                        onMoveDown={handleMoveTaskDown}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                      No tasks added yet.
                    </p>
                  </div>
                )}
              </ScrollArea>

              {/* ปุ่ม "Add task" (ห่อด้วย Dialog ของมันเอง) */}
              <Dialog
                open={isAddTaskDialogOpen}
                onOpenChange={setIsAddTaskDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add task
                  </Button>
                </DialogTrigger>

                <DialogPortal>
                  <DialogOverlay className="bg-black/40" />
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-task-header">Task Header</Label>
                        <Input
                          id="new-task-header"
                          placeholder="Enter task header"
                          value={newTaskHeader}
                          onChange={(e) => setNewTaskHeader(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-task-description">
                          Description
                        </Label>
                        <Textarea
                          id="new-task-description"
                          placeholder="Enter task description"
                          value={newTaskDescription}
                          onChange={(e) =>
                            setNewTaskDescription(e.target.value)
                          }
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="ghost">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="button" onClick={handleAddNewTask}>
                        Save Task
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </DialogPortal>
              </Dialog>

              {/* Dialog สำหรับ "Edit Task" */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogPortal>
                  <DialogOverlay className="bg-black/40" />
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-task-header">Task Header</Label>
                        <Input
                          id="edit-task-header"
                          value={editHeader}
                          onChange={(e) => setEditHeader(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-task-description">Description</Label>
                        <Textarea
                          id="edit-task-description"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="ghost">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="button" onClick={handleSaveEdit}>
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </DialogPortal>
              </Dialog>

              {/* DialogContent นี้สำหรับ "View All" */}
              <DialogPortal>
                <DialogOverlay className="bg-black/40" />
                <DialogContent className="sm:max-w-xl md:max-w-2xl h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>All Tasks ({tasks.length})</DialogTitle>
                  </DialogHeader>

                  <div className="flex justify-between items-center p-1 border-b pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="select-all-tasks-popup"
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        data-state={
                          isIndeterminate
                            ? "indeterminate"
                            : isAllSelected
                            ? "checked"
                            : "unchecked"
                        }
                        disabled={tasks.length === 0}
                      />
                      <Label
                        htmlFor="select-all-tasks-popup"
                        className="text-sm font-medium"
                      >
                        Select All
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTasks.length > 0 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={deleteSelectedTasks}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedTasks.length})
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={deleteAllTasks}
                        disabled={tasks.length === 0}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Delete All
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-1 space-y-4 pr-4">
                      {tasks.map((task, index) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onDelete={deleteTask}
                          onSelect={handleTaskSelection}
                          isChecked={selectedTasks.includes(task.id)}
                          onEdit={handleOpenEditDialog}
                          index={index}
                          totalTasks={tasks.length}
                          onMoveUp={handleMoveTaskUp}
                          onMoveDown={handleMoveTaskDown}
                        />
                      ))}
                    </div>
                  </ScrollArea>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </DialogPortal>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="ghost" type="button" onClick={() => router.back()}>cancel</Button>
        <Button
          type="submit"
          form="create-job-form"
          disabled={isSubmitting}
        >
          Save
        </Button>
      </div>

      {/* ✅ Alert Dialog สำหรับ Validation */}
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

    </div>
  );
}