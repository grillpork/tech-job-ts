"use client"; // ต้องเป็น Client Component เพราะมีการใช้ state

import * as React from "react";
import { useState } from "react";
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
  // ==================================
  // NEW: เพิ่ม Icons สำหรับปุ่มย้าย
  // ==================================
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  // ==================================
  // NEW: เพิ่ม Separator
  // ==================================
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// import { MapPicker } from "@/components/map/MapPicker"; // (ถ้ามี)

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

const ALL_EMPLOYEES: Employee[] = [
  { value: "emp1", label: "ณัฐพล (Nattapon)" },
  { value: "emp2", label: "สมชาย (Somchai)" },
  { value: "emp3", label: "สุภาพร (Supaporn)" },
  { value: "emp4", label: "อลิสา (Alisa)" },
  { value: "emp5", label: "เจฟ (Jeff)" },
];

// ==================================
// ==================================
// NEW: Task Item Component (อัปเดต Props)
// ==================================
// ==================================
interface TaskItemProps {
  task: Task;
  onDelete: (id: number) => void;
  onSelect: (id: number) => void;
  isChecked: boolean;
  onEdit: (task: Task) => void;
  // ==================================
  // NEW: เพิ่ม Props สำหรับการย้ายตำแหน่ง
  // ==================================
  onMoveUp: (id: number) => void;
  onMoveDown: (id: number) => void;
  index: number;
  totalTasks: number;
  // ==================================
}

function TaskItem({
  task,
  onDelete,
  onSelect,
  isChecked,
  onEdit,
  // ==================================
  // NEW: รับ Props ใหม่
  // ==================================
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
        {/* Checkbox */}
        <Checkbox
          id={`task-${task.id}`}
          checked={isChecked}
          onCheckedChange={() => onSelect(task.id)}
          className="mt-1"
        />

        {/* Main content */}
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
                {/* ================================== */}
                {/* NEW: ปุ่ม Move Up / Move Down */}
                {/* ================================== */}
                <DropdownMenuItem
                  onClick={() => onMoveUp(task.id)}
                  disabled={index === 0} // ปิดปุ่มถ้าอยู่บนสุด
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Move Up
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMoveDown(task.id)}
                  disabled={index === totalTasks - 1} // ปิดปุ่มถ้าอยู่ล่างสุด
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Move Down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* ================================== */}
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
}
// ==================================
// ==================================

export default function CreateJobPage() {
  // State สำหรับ Date Pickers
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // State สำหรับ Attachments (File[])
  const [attachments, setAttachments] = useState<File[]>([]);

  // State สำหรับ Tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, header: "Task 1", description: "Description 1" },
    { id: 2, header: "Task 2", description: "Description 2" },
    { id: 3, header: "Task 3", description: "Description 3" },
    { id: 4, header: "Task 4", description: "Description 4" },
    { id: 5, header: "Task 5", description: "Description 5" },
    { id: 6, header: "Task 6", description: "Description 6" },
  ]); // เพิ่ม Task เริ่มต้นให้เห็นผลชัดเจน

  // NEW: State สำหรับ Task ที่ถูกเลือก
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

  // State สำหรับ Popover และ พนักงานที่ถูกเลือก
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  // State สำหรับ Drag and Drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // State สำหรับ Popup "Add Task"
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTaskHeader, setNewTaskHeader] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  // State สำหรับ Popup "Edit Task"
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editHeader, setEditHeader] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // (ฟังก์ชันจัดการ Task ส่วนใหญ่ ... เหมือนเดิม)
  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setSelectedTasks((prev) => prev.filter((selectedId) => selectedId !== id));
  };

  const deleteAttachment = (fileName: string) => {
    setAttachments(attachments.filter((file) => file.name !== fileName));
  };

  const handleRemoveEmployee = (value: string) => {
    setSelectedEmployees(
      selectedEmployees.filter((emp) => emp.value !== value)
    );
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
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
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleTaskSelection = (taskId: number) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };
  const deleteSelectedTasks = () => {
    setTasks((prev) => prev.filter((task) => !selectedTasks.includes(task.id)));
    setSelectedTasks([]);
  };
  const deleteAllTasks = () => {
    setTasks([]);
    setSelectedTasks([]);
  };
  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((task) => task.id));
    }
  };
  const handleAddNewTask = () => {
    if (newTaskHeader.trim() === "") return;
    const newTask: Task = {
      id: Date.now(),
      header: newTaskHeader,
      description: newTaskDescription,
    };
    // CHANGED: เพิ่ม Task ใหม่ *ต่อท้าย* array
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setNewTaskHeader("");
    setNewTaskDescription("");
    setIsAddTaskDialogOpen(false);
  };

  // (ฟังก์ชัน Edit Task ... เหมือนเดิม)
  const handleOpenEditDialog = (task: Task) => {
    setTaskToEdit(task);
    setEditHeader(task.header);
    setEditDescription(task.description);
    setIsEditDialogOpen(true);
  };
  const handleSaveEdit = () => {
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
  };

  // ==================================
  // NEW: ฟังก์ชันสำหรับย้ายตำแหน่ง Task
  // ==================================
  const handleMoveTaskUp = (id: number) => {
    setTasks((prevTasks) => {
      const currentIndex = prevTasks.findIndex((t) => t.id === id);
      if (currentIndex <= 0) return prevTasks; // อยู่บนสุดแล้ว

      const newTasks = [...prevTasks];
      // สลับตำแหน่ง
      [newTasks[currentIndex - 1], newTasks[currentIndex]] = [
        newTasks[currentIndex],
        newTasks[currentIndex - 1],
      ];
      return newTasks;
    });
  };

  const handleMoveTaskDown = (id: number) => {
    setTasks((prevTasks) => {
      const currentIndex = prevTasks.findIndex((t) => t.id === id);
      if (currentIndex === -1 || currentIndex >= prevTasks.length - 1) {
        return prevTasks; // ไม่พบ หรือ อยู่ล่างสุดแล้ว
      }

      const newTasks = [...prevTasks];
      // สลับตำแหน่ง
      [newTasks[currentIndex + 1], newTasks[currentIndex]] = [
        newTasks[currentIndex],
        newTasks[currentIndex + 1],
      ];
      return newTasks;
    });
  };
  // ==================================

  // ตัวแปรช่วยเช็คสถานะ Checkbox
  const isAllSelected = tasks.length > 0 && selectedTasks.length === tasks.length;
  const isIndeterminate =
    selectedTasks.length > 0 && selectedTasks.length < tasks.length;

  return (
    // Container หลักของหน้า (p-4 สำหรับ mobile, md:p-8 สำหรับ tablet ขึ้นไป)
    <div className="p-4 md:p-8 space-y-8">
      {/* ส่วน Header ของหน้า */}
      <div className="items-center">
        <Badge variant="secondary">pending</Badge>
      </div>

      {/* Main Content Grid (Responsive) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* ================================== */}
        {/* ======       คอลัมน์ซ้าย (ฟอร์ม)        ====== */}
        {/* ================================== */}
        <form id="create-job-form" className="md:col-span-3 space-y-6">
          {/* Job Title */}
          <div>
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" placeholder="Enter job title" className="mt-2" />
          </div>

          {/* Job Discriptions */}
          <div>
            <Label htmlFor="jobDescription">Job Discriptions</Label>
            <Textarea
              id="jobDescription"
              placeholder="Enter job description"
              className="mt-2 resize-none h-26overflow-y-auto" // (FIXED: h-32)
            />
          </div>

          {/* Grid ย่อยสำหรับ Selects (Responsive อยู่แล้ว) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="leadTechnician">Lead technician</Label>
              <Select defaultValue="leader1">
                <SelectTrigger id="leadTechnician" className="mt-2">
                  <SelectValue placeholder="Select leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leader1">Leader1</SelectItem>
                  <SelectItem value="leader2">Leader2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Select Department</Label>
              <Select defaultValue="it">
                <SelectTrigger id="department" className="mt-2">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT Suport</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="ops">Operations</SelectItem>
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveEmployee(emp.value);
                            }}
                            className="rounded-full hover:bg-muted-foreground/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
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
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandGroup>
                      {ALL_EMPLOYEES.map((emp) => {
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

          {/* Attachments (เวอร์ชัน Drag and Drop) */}
          <div>
            <Label>Attachments</Label>
            {/* Dropzone Area */}
            <div
              className={cn(
                "mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 transition-colors",
                isDragging && "border-primary bg-muted/50" // Visual feedback
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
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
                    onClick={openFileDialog}
                  >
                    click to browse
                  </Button>
                  .
                </p>
                <p className="text-xs text-muted-foreground">
                  Max file size: 5MB
                </p>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* File List */}
            <div className="space-y-2 mt-4">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-md border bg-muted/50"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate" title={file.name}>
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
          </div>
        </form>

        {/* =================================== */}
        {/* ======     คอลัมน์ขวา (Map & Tasks)      ====== */}
        {/* =================================== */}
        <div className="md:col-span-2 space-y-8">
          {/* Map Picker */}
          <div className="space-y-2">
            <Label htmlFor="location">Map Picker</Label>
            <div className="flex gap-2 mt-2">
              <Input id="location" placeholder="location name...." />
              <Button variant="ghost">clear</Button>
            </div>
            {/* Map Placeholder */}
            <div className="h-64 w-full rounded-md bg-muted flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                [Map Component (e.g., Google Maps, Leaflet) goes here]
              </p>
            </div>
          </div>

          {/* =================================== */}
          {/* ======         NEW: Tasks Section       ====== */}
          {/* =================================== */}
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
                    {/* ================================== */}
                    {/* NEW: ส่ง Props (index, total, handlers) */}
                    {/* ================================== */}
                    {tasks.map((task, index) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onDelete={deleteTask}
                        onSelect={handleTaskSelection}
                        isChecked={selectedTasks.includes(task.id)}
                        onEdit={handleOpenEditDialog}
                        // NEW
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

                {/* (FIXED: Overlay) */}
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
                {/* (FIXED: Overlay) */}
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
                        <Label htmlFor="edit-task-description">
                          Description
                        </Label>
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
              {/* (FIXED: Overlay) */}
              <DialogPortal>
                <DialogOverlay className="bg-black/40" />
                <DialogContent className="sm:max-w-xl md:max-w-2xl h-[80vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>All Tasks ({tasks.length})</DialogTitle>
                  </DialogHeader>

                  {/* แถบควบคุม (Select All, Delete Selected, Delete All) ใน Popup "View All" */}
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
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete ({selectedTasks.length})
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

                  {/* Scroll Area (Dialog) */}
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-1 space-y-4 pr-4">
                      {/* ================================== */}
                      {/* NEW: ส่ง Props (index, total, handlers) */}
                      {/* ================================== */}
                      {tasks.map((task, index) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onDelete={deleteTask}
                          onSelect={handleTaskSelection}
                          isChecked={selectedTasks.includes(task.id)}
                          onEdit={handleOpenEditDialog}
                          // NEW
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
          {/* =================================== */}
        </div>
      </div>

      {/* =================================== */}
      {/* ======         Footer Buttons         ====== */}
      {/* =================================== */}
      <div className="grid grid-cols-2 sm:flex sm:justify-end gap-4 pt-6 border-t">
        <Button variant="ghost" className="w-full sm:w-auto">
          cancel
        </Button>
        <Button
          type="submit"
          form="create-job-form"
          className="w-full sm:w-auto"
        >
          Save
        </Button>
      </div>
    </div>
  );
}