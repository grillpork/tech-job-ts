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
} from "lucide-react";
import { cn } from "@/lib/utils"; // Import utility ของ shadcn

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

import { MapPicker } from "@/components/map/MapPicker";

// Interface สำหรับ Task
interface Task {
  id: number;
  header: string;
  description: string;
}

export default function CreateJobPage() {
  // State สำหรับ Date Pickers
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();

  // State สำหรับ Attachments
  const [attachments, setAttachments] = useState(["attachment.pef"]);

  // State สำหรับ Tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, header: "task header", description: "Task discription" },
  ]);

  // ฟังก์ชันเพิ่ม Task
  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), header: "", description: "" }]);
  };

  // ฟังก์ชันลบ Task
  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // ฟังก์ชันลบ Attachment
  const deleteAttachment = (fileName: string) => {
    setAttachments(attachments.filter((file) => file !== fileName));
  };

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
            <Label htmlFor="assignEmployee">Assign employee</Label>
            <Select>
              <SelectTrigger id="assignEmployee" className="mt-2">
                <SelectValue placeholder="Employee name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emp1">Employee 1</SelectItem>
                <SelectItem value="emp2">Employee 2</SelectItem>
              </SelectContent>
            </Select>
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

          {/* Attachments */}
          <div>
            <Label>Attachments</Label>
            <div className="space-y-2 mt-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-md border bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-sm">{file}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => deleteAttachment(file)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <Button type="button" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add new file
              </Button>
              <span className="text-sm text-muted-foreground">
                This file 5 mb.
              </span>
            </div>
          </div>
        </form>

        {/* =================================== */}
        {/* ======     คอลัมน์ขวา (Map & Tasks)    ====== */}
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
                    {/* ใช้ Input ที่ดูเหมือน Text ธรรมดา */}
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
                  {/* ใช้ Textarea ที่ดูเหมือน Text ธรรมดา */}
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
      {/* ======     Footer Buttons    ====== */}
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