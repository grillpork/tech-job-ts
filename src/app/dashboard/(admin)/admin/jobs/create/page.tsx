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
  UploadCloud, // <-- NEW: Import ไอคอนสำหรับ Dropzone
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

export default function CreateJobPage() {
  // State สำหรับ Date Pickers
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // <-- UPDATED: State สำหรับ Attachments (เปลี่ยนเป็น File[])
  const [attachments, setAttachments] = useState<File[]>([]);

  // State สำหรับ Tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, header: "task header", description: "Task discription" },
  ]);

  // State สำหรับ Popover และ พนักงานที่ถูกเลือก
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  // <-- NEW: State สำหรับ Drag and Drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ฟังก์ชันเพิ่ม Task
  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), header: "", description: "" }]);
  };

  // ฟังก์ชันลบ Task
  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // <-- UPDATED: ฟังก์ชันลบ Attachment (ลบจาก File[])
  const deleteAttachment = (fileName: string) => {
    setAttachments(attachments.filter((file) => file.name !== fileName));
  };

  // ฟังก์ชันสำหรับลบพนักงานออกจาก Badge
  const handleRemoveEmployee = (value: string) => {
    setSelectedEmployees(
      selectedEmployees.filter((emp) => emp.value !== value)
    );
  };

  // <-- NEW: 5 ฟังก์ชันสำหรับจัดการ Drag and Drop
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

  // สำหรับการคลิกเลือกไฟล์
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prevFiles) => [...prevFiles, ...files]);
  };

  // สำหรับการคลิกปุ่ม "browse"
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  // --> END NEW

  return (
    // Container หลักของหน้า
    <div className="p-4 md:p-8 space-y-8">
      {/* ส่วน Header ของหน้า */}
      <div className="items-center">
        <Badge variant="secondary">pending</Badge>
      </div>

      {/* Main Content Grid (Responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ================================== */}
        {/* ======     คอลัมน์ซ้าย (ฟอร์ม)    ====== */}
        {/* ================================== */}
        <form id="create-job-form" className="lg:col-span-3 space-y-6">
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
              rows={5}
              className="mt-2"
            />
          </div>

          {/* Grid ย่อยสำหรับ Selects */}
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

          {/* Grid ย่อยสำหรับ Date Pickers */}
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

          {/* ================================================== */}
          {/* <-- START: Attachments (เวอร์ชัน Drag and Drop) --> */}
          {/* ================================================== */}
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
          {/* ================================================ */}
          {/* <-- END: Attachments (เวอร์ชัน Drag and Drop) --> */}
          {/* ================================================ */}
        </form>

        {/* =================================== */}
        {/* ======    คอลัมน์ขวา (Map & Tasks)    ====== */}
        {/* =================================== */}
        <div className="lg:col-span-2 space-y-8">
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

          {/* Tasks */}
          <div className="space-y-4">
            <Label className="text-lg font-medium">Tasks</Label>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-md border space-y-3 bg-muted/50"
                >
                  <div className="flex justify-between items-start">
                    <Input
                      placeholder="task header"
                      defaultValue={task.header}
                      className="font-semibold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1.5 h-auto bg-transparent"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                    >
                      delete
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Task discription"
                    defaultValue={task.description}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent"
                    rows={2}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addTask}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add task
            </Button>
          </div>
        </div>
      </div>

      {/* =================================== */}
      {/* ======     Footer Buttons     ====== */}
      {/* =================================== */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="ghost">cancel</Button>
        <Button type="submit" form="create-job-form">
          Save
        </Button>
      </div>
    </div>
  );
}