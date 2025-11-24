"use client"; // ต้องเป็น Client Component เพราะมีการใช้ state

import * as React from "react";
import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation"; // ✅ 1. Import router
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  File as FileIcon,
  X,
  Check,
  UploadCloud,
  ToolCase,
  Image as ImageIcon,
  Plus,
  FileText,
  User,
  Users,
  Camera,
  PenTool,
  Building2,
  AlertCircle,
  MapPin
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { cn } from "@/lib/utils";

// ✅ 2. Import Store, Types, and Mocks
import { useJobStore, type Attachment } from "@/stores/features/jobStore"; // (แก้ path ถ้าจำเป็น)
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useUserStore } from "@/stores/features/userStore";
import { MOCK_USERS } from "@/lib/mocks/user";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";


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

export default function CreateJobPage() {

  // ✅ --- 5. เพิ่ม Logic การเชื่อมต่อ Store และ Router --- ✅
  const router = useRouter();
  const createJob = useJobStore((state) => state.createJob);
  const jobs = useJobStore((state) => state.jobs);
  const { currentUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Role-based permissions
  const isAdmin = currentUser?.role === 'admin';
  const isLeadTechnician = currentUser?.role === 'lead_technician';
  const isEmployee = currentUser?.role === 'employee';
  const canEditBeforeAfterImages = isLeadTechnician || isEmployee;

  // --- 1. STATE MANAGEMENT (เหมือนเดิม) ---
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [invPopoverOpen, setInvPopoverOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // ✅ Inventory selection state
  const inventories = useInventoryStore((s) => s.inventories);
  const [selectedInventory, setSelectedInventory] = useState<InventoryOption[]>([]);
  // Location selected from MapPicker
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string | null } | null>(null);
  // Location images
  const [locationImages, setLocationImages] = useState<File[]>([]);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const locationImageInputRef = useRef<HTMLInputElement>(null);
  // Before/After images
  const [beforeImages, setBeforeImages] = useState<File[]>([]);
  const [afterImages, setAfterImages] = useState<File[]>([]);
  const [isDraggingBefore, setIsDraggingBefore] = useState(false);
  const [isDraggingAfter, setIsDraggingAfter] = useState(false);
  const beforeImageInputRef = useRef<HTMLInputElement>(null);
  const afterImageInputRef = useRef<HTMLInputElement>(null);
  // Customer information
  const [customerType, setCustomerType] = useState<"individual" | "organization">("individual");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerCompanyName, setCustomerCompanyName] = useState<string>("");
  const [customerTaxId, setCustomerTaxId] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  // Signature
  const signatureRef = useRef<SignatureCanvas>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);


  // ✅ 6. เพิ่ม State สำหรับ Departments (หลายตัว), Lead Tech, Priority, Type และ Alert
  const [departments, setDepartments] = useState<string[]>([]);
  const [leadTechnician, setLeadTechnician] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [type, setType] = useState<string>("");
  const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [departmentsPopoverOpen, setDepartmentsPopoverOpen] = useState(false);

  // ✅ 7. เพิ่ม Logic กรอง lead technician และพนักงานตาม departments และตรวจสอบว่าว่าง (available)
  // ฟังก์ชันตรวจสอบว่า employee ว่างหรือไม่ (ไม่ถูก assign ใน job ที่ active)
  // Lead technician สามารถถูกเลือกได้มากกว่า 1 ใบงาน
  const isEmployeeAvailable = React.useCallback((employeeId: string) => {
    const activeStatuses = ["pending", "in_progress", "pending_approval"];
    return !jobs.some(job => 
      activeStatuses.includes(job.status) &&
      job.assignedEmployees.some(emp => emp.id === employeeId)
    );
  }, [jobs]);

  // Lead technician ไม่ถูกกรองตาม department (เลือกได้ทั้งหมด)
  const availableLeadTechnicians: Employee[] = React.useMemo(() => {
    return MOCK_USERS
      .filter(u => u.role === 'lead_technician')
      .map(u => ({ value: u.id, label: u.name }));
  }, []);

  // Employee ถูกกรองตาม departments ที่เลือก และตรวจสอบว่าว่าง
  const availableEmployees: Employee[] = React.useMemo(() => {
    if (departments.length === 0) return [];
    return MOCK_USERS
      .filter(u => u.role === 'employee' && u.department && departments.includes(u.department))
      .filter(u => isEmployeeAvailable(u.id))
      .map(u => ({ value: u.id, label: u.name }));
  }, [departments, isEmployeeAvailable]);

  // รายการ departments ทั้งหมด
  const allDepartments = [
    { value: "Electrical", label: "แผนกช่างไฟ (Electrical)" },
    { value: "Mechanical", label: "แผนกช่างกล (Mechanical)" },
    { value: "Technical", label: "แผนกช่างเทคนิค (Technical)" },
    { value: "Civil", label: "แผนกช่างโยธา (Civil)" },
  ];

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

  // Location Images handlers
  const handleLocationImageSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setLocationImages((prevFiles) => [...prevFiles, ...imageFiles]);
    },
    []
  );

  const handleLocationImageDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImages(true);
  }, []);

  const handleLocationImageDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImages(false);
  }, []);

  const handleLocationImageDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImages(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setLocationImages((prevFiles) => [...prevFiles, ...imageFiles]);
  }, []);

  const deleteLocationImage = useCallback((fileName: string) => {
    setLocationImages((prev) => prev.filter((file) => file.name !== fileName));
  }, []);

  const openLocationImageDialog = useCallback(() => {
    locationImageInputRef.current?.click();
  }, []);

  // Before/After images handlers
  const handleBeforeImageSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setBeforeImages((prevFiles) => [...prevFiles, ...imageFiles]);
    },
    []
  );

  const handleBeforeImageDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingBefore(true);
  }, []);

  const handleBeforeImageDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingBefore(false);
  }, []);

  const handleBeforeImageDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingBefore(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setBeforeImages((prevFiles) => [...prevFiles, ...imageFiles]);
  }, []);

  const deleteBeforeImage = useCallback((fileName: string) => {
    setBeforeImages((prev) => prev.filter((file) => file.name !== fileName));
  }, []);

  const openBeforeImageDialog = useCallback(() => {
    beforeImageInputRef.current?.click();
  }, []);

  const handleAfterImageSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setAfterImages((prevFiles) => [...prevFiles, ...imageFiles]);
    },
    []
  );

  const handleAfterImageDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAfter(true);
  }, []);

  const handleAfterImageDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAfter(false);
  }, []);

  const handleAfterImageDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAfter(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setAfterImages((prevFiles) => [...prevFiles, ...imageFiles]);
  }, []);

  const deleteAfterImage = useCallback((fileName: string) => {
    setAfterImages((prev) => prev.filter((file) => file.name !== fileName));
  }, []);

  const openAfterImageDialog = useCallback(() => {
    afterImageInputRef.current?.click();
  }, []);

  // Signature handlers
  const getSignatureImage = useCallback(() => {
    const ref = signatureRef.current;
    if (!ref) return null;
    if (ref.isEmpty()) return null;
    const dataURL = ref.toDataURL("image/png");
    if (!dataURL || dataURL.length < 50) return null;
    const emptyPNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    if (dataURL === emptyPNG) return null;
    return dataURL;
  }, []);

  const checkSignature = useCallback(() => {
    const result = getSignatureImage();
    setSignatureData(result);
  }, [getSignatureImage]);

  const handleSignatureEnd = useCallback(() => {
    setTimeout(() => checkSignature(), 80);
  }, [checkSignature]);

  const handleClearSignature = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignatureData(null);
    }
  }, []);

  // Helper function: แปลง File เป็น base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // ✅ --- 8. สร้างฟังก์ชัน handleSubmit --- ✅
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formElements = e.currentTarget.elements as typeof e.currentTarget.elements & {
      jobTitle?: HTMLInputElement;
      jobDescription?: HTMLTextAreaElement;
      customerName?: HTMLInputElement;
      customerPhone?: HTMLInputElement;
    };
    const title = formElements.jobTitle?.value ?? "";

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title || title.trim() === "") {
      setErrorMessage("กรุณากรอก Job Title ให้ครบถ้วน");
      setIsErrorAlertOpen(true);
      return; // หยุดการทำงาน
    }

    if (!leadTechnician || leadTechnician.trim() === "") {
      setErrorMessage("กรุณาเลือกหัวหน้าช่าง (Lead Technician)");
      setIsErrorAlertOpen(true);
      return;
    }

    // Validation สำหรับลูกค้าองค์กร
    if (customerType === "organization" && !customerCompanyName.trim()) {
      setErrorMessage("กรุณากรอกชื่อบริษัท/องค์กร");
      setIsErrorAlertOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ แปลง File[] เป็น Attachment[] (ใช้ base64 สำหรับ url)
      const attachmentsData: Attachment[] = await Promise.all(
        attachments.map(async (file) => ({
          id: crypto.randomUUID(),
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          size: file.size,
          url: await fileToBase64(file), // แปลงเป็น base64 string
          uploadedAt: new Date().toISOString(),
        }))
      );

      // ✅ แปลง locationImages File[] เป็น base64 string[]
      const locationImagesUrls: string[] = await Promise.all(
        locationImages.map((file) => fileToBase64(file))
      );

      // ✅ แปลง beforeImages File[] เป็น base64 string[]
      const beforeImagesUrls: string[] = await Promise.all(
        beforeImages.map((file) => fileToBase64(file))
      );

      // ✅ แปลง afterImages File[] เป็น base64 string[]
      const afterImagesUrls: string[] = await Promise.all(
        afterImages.map((file) => fileToBase64(file))
      );

      // Get signature if available
      const signature = getSignatureImage();

    const jobData = {
      department: departments[0] || "",
      title,
      description: formElements.jobDescription?.value ?? "",
        leadTechnicianId: leadTechnician,
        departments: departments,
        priority: priority as "low" | "medium" | "high" | "urgent" | null,
        type: (type || null) as "บ้าน" | "คอนโด" | null,
        assignedEmployeeIds: selectedEmployees.map(emp => emp.value),
        usedInventory: selectedInventory.map(inv => ({ id: inv.value, qty: inv.qty ?? 1 })),
        status: "pending" as const,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        tasks: [], // ไม่มี tasks
        creatorId: leadTechnician, // ใช้ Lead Tech เป็น Creator
        location: location ?? null,
        locationImages: locationImagesUrls.length > 0 ? locationImagesUrls : undefined,
        beforeImages: beforeImagesUrls.length > 0 ? beforeImagesUrls : undefined,
        afterImages: afterImagesUrls.length > 0 ? afterImagesUrls : undefined,
        customerType: customerType,
        customerName: formElements.customerName?.value || customerName || null,
        customerPhone: formElements.customerPhone?.value || customerPhone || null,
        customerCompanyName: customerType === "organization" ? (customerCompanyName || null) : null,
        customerTaxId: customerType === "organization" ? (customerTaxId || null) : null,
        customerAddress: customerType === "organization" ? (customerAddress || null) : null,
        signature: signature || null,
      };

      // ✅ ส่ง attachments ไปกับ jobData
      const jobDataWithAttachments = {
        ...jobData,
        attachments: attachmentsData,
      };

      createJob(jobDataWithAttachments);
      router.push("/dashboard/admin/jobs");
    } catch (error) {
      console.error("Error converting files to base64:", error);
      setErrorMessage("เกิดข้อผิดพลาดในการแปลงไฟล์ กรุณาลองใหม่อีกครั้ง");
      setIsErrorAlertOpen(true);
      setIsSubmitting(false);
    }
  };


  // ==================================
  // === 3. RENDER / JSX ===
  // ==================================
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">สร้างงานใหม่</h1>
            <Badge variant="secondary" className="text-sm px-3 py-1 uppercase tracking-wide">
              Draft
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ✅ 9. เพิ่ม onSubmit ที่นี่ */}
          <form id="create-job-form" className="lg:col-span-2 space-y-6" onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">ข้อมูลพื้นฐาน</span>
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">ลูกค้า</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">ทีมงาน</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">ไฟล์ & สื่อ</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" forceMount className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    ข้อมูลงาน
                  </CardTitle>
                  <CardDescription>กำหนดรายละเอียดหลักและช่วงเวลาดำเนินงาน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" name="jobTitle" placeholder="Enter job title" className="mt-1.5" disabled={isLeadTechnician} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobDescription">Job Description</Label>
                    <Textarea
                      id="jobDescription"
                      name="jobDescription"
                      placeholder="Enter job description"
                      className="mt-1.5 resize-none h-32 overflow-y-auto"
                      disabled={isLeadTechnician}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Priority
                      </Label>
                      <Select 
                        name="priority" 
                        value={priority} 
                        onValueChange={setPriority}
                        disabled={isLeadTechnician}
                      >
                        <SelectTrigger id="priority" className="w-full h-11">
                          <SelectValue placeholder="เลือกความสำคัญ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Type
                      </Label>
                      <Select 
                        name="type" 
                        value={type} 
                        onValueChange={setType}
                        disabled={isLeadTechnician}
                      >
                        <SelectTrigger id="type" className="w-full h-11">
                          <SelectValue placeholder="เลือกประเภท" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="บ้าน">บ้าน</SelectItem>
                          <SelectItem value="คอนโด">คอนโด</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Start date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal h-11",
                              !startDate && "text-muted-foreground"
                            )}
                            disabled={isLeadTechnician}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
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
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        End date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal h-11",
                              !endDate && "text-muted-foreground"
                            )}
                            disabled={isLeadTechnician}
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customer" forceMount className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    ข้อมูลลูกค้า
                  </CardTitle>
                  <CardDescription>กำหนดประเภทลูกค้าและข้อมูลติดต่อ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>ประเภทลูกค้า</Label>
                    <div className="flex gap-6 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="customerType-individual"
                          name="customerType"
                          value="individual"
                          checked={customerType === "individual"}
                          onChange={(e) => {
                            setCustomerType(e.target.value as "individual" | "organization");
                            if (e.target.value === "individual") {
                              setCustomerCompanyName("");
                              setCustomerTaxId("");
                              setCustomerAddress("");
                            }
                          }}
                          disabled={isLeadTechnician}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="customerType-individual" className="font-normal cursor-pointer">
                          ลูกค้าปกติ
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="customerType-organization"
                          name="customerType"
                          value="organization"
                          checked={customerType === "organization"}
                          onChange={(e) => setCustomerType(e.target.value as "individual" | "organization")}
                          disabled={isLeadTechnician}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="customerType-organization" className="font-normal cursor-pointer">
                          องค์กร/บริษัท
                        </Label>
                      </div>
                    </div>
                  </div>

                  {customerType === "individual" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="customerName">ชื่อลูกค้า</Label>
                        <Input
                          id="customerName"
                          name="customerName"
                          placeholder="กรอกชื่อลูกค้า"
                          className="mt-2"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          disabled={isLeadTechnician}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">เบอร์โทรลูกค้า</Label>
                        <Input
                          id="customerPhone"
                          name="customerPhone"
                          placeholder="กรอกเบอร์โทรลูกค้า"
                          className="mt-2"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          disabled={isLeadTechnician}
                        />
                      </div>
                    </div>
                  )}

                  {customerType === "organization" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="customerCompanyName">ชื่อบริษัท/องค์กร <span className="text-destructive">*</span></Label>
                          <Input
                            id="customerCompanyName"
                            name="customerCompanyName"
                            placeholder="กรอกชื่อบริษัท/องค์กร"
                            className="mt-2"
                            value={customerCompanyName}
                            onChange={(e) => setCustomerCompanyName(e.target.value)}
                            disabled={isLeadTechnician}
                          />
                        </div>
                        <div>
                          <Label htmlFor="customerTaxId">เลขประจำตัวผู้เสียภาษี</Label>
                          <Input
                            id="customerTaxId"
                            name="customerTaxId"
                            placeholder="กรอกเลขประจำตัวผู้เสียภาษี"
                            className="mt-2"
                            value={customerTaxId}
                            onChange={(e) => setCustomerTaxId(e.target.value)}
                            disabled={isLeadTechnician}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="customerAddress">ที่อยู่บริษัท</Label>
                        <Textarea
                          id="customerAddress"
                          name="customerAddress"
                          placeholder="กรอกที่อยู่บริษัท"
                          className="mt-2"
                          rows={3}
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          disabled={isLeadTechnician}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="customerName">ชื่อผู้ติดต่อ</Label>
                          <Input
                            id="customerName"
                            name="customerName"
                            placeholder="กรอกชื่อผู้ติดต่อ"
                            className="mt-2"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            disabled={isLeadTechnician}
                          />
                        </div>
                        <div>
                          <Label htmlFor="customerPhone">เบอร์โทรติดต่อ</Label>
                          <Input
                            id="customerPhone"
                            name="customerPhone"
                            placeholder="กรอกเบอร์โทรติดต่อ"
                            className="mt-2"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            disabled={isLeadTechnician}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      ลายเซ็นลูกค้า
                    </Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 bg-muted/20">
                      <div className="w-full" style={{ maxWidth: "100%" }}>
                        <SignatureCanvas
                          ref={signatureRef}
                          onEnd={handleSignatureEnd}
                          canvasProps={{
                            className: "signature-canvas w-full h-[200px]",
                            style: { width: "100%", height: "200px" },
                          }}
                          backgroundColor="white"
                          penColor="#000000"
                        />
                      </div>
                    </div>
                    {signatureData && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>ลายเซ็นพร้อมแล้ว</span>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearSignature}
                      >
                        <X className="h-4 w-4 mr-2" />
                        ลบลายเซ็น
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" forceMount className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    ทีมงานและทรัพยากร
                  </CardTitle>
                  <CardDescription>เลือกหัวหน้าช่าง แผนก ทีมงาน และวัสดุที่ใช้</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="leadTechnician">Lead technician <span className="text-destructive">*</span></Label>
                    <Select 
                      name="leadTechnician" 
                      value={leadTechnician} 
                      onValueChange={(value) => {
                        setLeadTechnician(value);
                        setDepartments([]);
                        setSelectedEmployees([]);
                      }}
                      disabled={isLeadTechnician}
                    >
                      <SelectTrigger id="leadTechnician" className="w-full h-11">
                        <SelectValue placeholder="เลือกหัวหน้าช่างก่อน" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLeadTechnicians.map((lead) => (
                          <SelectItem key={lead.value} value={lead.value}>
                            {lead.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>เลือกแผนก</Label>
                    <Popover open={departmentsPopoverOpen} onOpenChange={setDepartmentsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={departmentsPopoverOpen}
                          className="w-full justify-between h-auto min-h-11"
                          disabled={!leadTechnician || !isLeadTechnician}
                        >
                          <div className="flex gap-1 flex-wrap">
                            {departments.length > 0 ? (
                              departments.map((dept) => {
                                const deptLabel = allDepartments.find(d => d.value === dept)?.label || dept;
                                return (
                                  <Badge key={dept} variant="secondary" className="gap-1.5">
                                    {deptLabel}
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      aria-label={`Remove ${deptLabel}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isLeadTechnician) {
                                          setDepartments(departments.filter(d => d !== dept));
                                          const deptEmployees = MOCK_USERS
                                            .filter(u => u.role === 'employee' && u.department === dept)
                                            .map(u => u.id);
                                          setSelectedEmployees(selectedEmployees.filter(emp => !deptEmployees.includes(emp.value)));
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation();
                                          if (isLeadTechnician) {
                                            setDepartments(departments.filter(d => d !== dept));
                                            const deptEmployees = MOCK_USERS
                                              .filter(u => u.role === 'employee' && u.department === dept)
                                              .map(u => u.id);
                                            setSelectedEmployees(selectedEmployees.filter(emp => !deptEmployees.includes(emp.value)));
                                          }
                                        }
                                      }}
                                      className={cn(
                                        "rounded-full hover:bg-muted-foreground/20",
                                        !isLeadTechnician && "opacity-50 cursor-not-allowed"
                                      )}
                                    >
                                      <X className="h-3 w-3" />
                                    </div>
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground font-normal">
                                {!leadTechnician ? "เลือกหัวหน้าช่างก่อน" : "เลือกแผนก"}
                              </span>
                            )}
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search departments..." />
                          <CommandList>
                            <CommandEmpty>No department found.</CommandEmpty>
                            <CommandGroup>
                              {allDepartments.map((dept) => {
                                const isSelected = departments.includes(dept.value);
                                return (
                                  <CommandItem
                                    key={dept.value}
                                    onSelect={() => {
                                      if (isLeadTechnician) {
                                        if (isSelected) {
                                          setDepartments(departments.filter(d => d !== dept.value));
                                          const deptEmployees = MOCK_USERS
                                            .filter(u => u.role === 'employee' && u.department === dept.value)
                                            .map(u => u.id);
                                          setSelectedEmployees(selectedEmployees.filter(emp => !deptEmployees.includes(emp.value)));
                                        } else {
                                          setDepartments([...departments, dept.value]);
                                        }
                                      }
                                    }}
                                    disabled={!isLeadTechnician}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {dept.label}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign employee</Label>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={popoverOpen}
                          className="w-full justify-between h-auto min-h-11"
                          disabled={departments.length === 0 || isAdmin}
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
                                  <div
                                    role="button" tabIndex={0}
                                    aria-label={`Remove ${emp.label}`}
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (!isAdmin) handleRemoveEmployee(emp.value); 
                                    }}
                                    onKeyDown={(e) => { 
                                      if (e.key === 'Enter' || e.key === ' ') { 
                                        e.stopPropagation(); 
                                        if (!isAdmin) handleRemoveEmployee(emp.value); 
                                      } 
                                    }}
                                    className={cn(
                                      "rounded-full hover:bg-muted-foreground/20",
                                      isAdmin && "opacity-50 cursor-not-allowed"
                                    )}
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
                            <CommandEmpty>No employee found in selected departments.</CommandEmpty>
                            <CommandGroup>
                              {availableEmployees.map((emp) => {
                                const isSelected = selectedEmployees.some(
                                  (s) => s.value === emp.value
                                );
                                return (
                                  <CommandItem
                                    key={emp.value}
                                    onSelect={() => {
                                      if (!isAdmin) {
                                        if (isSelected) {
                                          handleRemoveEmployee(emp.value);
                                        } else {
                                          setSelectedEmployees([...selectedEmployees, emp]);
                                        }
                                      }
                                    }}
                                    disabled={isAdmin}
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

                  <Separator />

                  <div className="space-y-2">
                    <Label>Used inventory <span className="text-xs text-muted-foreground">(select items used on site)</span></Label>
                    <Popover open={invPopoverOpen} onOpenChange={setInvPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={invPopoverOpen} className="w-full justify-between h-11">
                          <div className="flex items-center gap-2">
                            <ToolCase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground font-normal">
                              {selectedInventory.length > 0 ? `เพิ่มวัสดุ (${selectedInventory.length})` : "เลือกวัสดุ"}
                            </span>
                          </div>
                          <Plus className="h-4 w-4 opacity-50" />
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
                                  <CommandItem key={inv.value} onSelect={() => {
                                    if (isSelected) {
                                      handleRemoveInventory(inv.value);
                                    } else {
                                      setSelectedInventory([...selectedInventory, { ...inv, qty: 1 }]);
                                    }
                                  }}>
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
                    
                    {selectedInventory.length > 0 ? (
                      <div className="mt-3 border rounded-md overflow-hidden">
                        <ScrollArea className="h-[300px] w-full">
                          <div className="p-3 space-y-2">
                            {selectedInventory.map((inv) => (
                              <div key={inv.value} className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{inv.label}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">Stock: {inv.qty ?? 0} pcs</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="flex items-center gap-1">
                                    <Label htmlFor={`qty-${inv.value}`} className="text-xs text-muted-foreground whitespace-nowrap">
                                      จำนวน:
                                    </Label>
                                    <Input 
                                      id={`qty-${inv.value}`}
                                      type="number" 
                                      min={1} 
                                      value={String(inv.qty ?? 1)} 
                                      onChange={(e) => handleChangeInventoryQty(inv.value, Math.max(1, Number(e.target.value || 1)))} 
                                      className="w-20 h-8 text-sm"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">pcs</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveInventory(inv.value)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="mt-3 p-6 border rounded-md border-dashed text-center">
                        <ToolCase className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">ยังไม่มีวัสดุที่เลือก</p>
                        <p className="text-xs text-muted-foreground mt-1">คลิกปุ่มด้านบนเพื่อเลือกวัสดุ</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" forceMount className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    ไฟล์แนบ
                  </CardTitle>
                  <CardDescription>อัปโหลดไฟล์หรือเอกสารที่เกี่ยวข้องกับงาน</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "mt-2 rounded-lg border border-dashed border-input transition-colors",
                      "flex flex-col",
                      "min-h-[200px]",
                      isDragging && "border-primary bg-muted/50",
                      isAdmin && "opacity-50 pointer-events-none"
                    )}
                    onDragOver={!isAdmin ? handleDragOver : undefined}
                    onDragLeave={!isAdmin ? handleDragLeave : undefined}
                    onDrop={!isAdmin ? handleDrop : undefined}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isAdmin}
                    />

                    {attachments.length === 0 ? (
                      <div
                        className={cn(
                          "flex-1 flex flex-col items-center justify-center text-center p-6",
                          !isAdmin && "cursor-pointer"
                        )}
                        onClick={!isAdmin ? openFileDialog : undefined}
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
                              e.stopPropagation();
                              if (!isAdmin) openFileDialog();
                            }}
                            disabled={isAdmin}
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
                      <>
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
                              disabled={isAdmin}
                            >
                              click to browse
                            </Button>
                            .
                          </p>
                        </div>
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
                                  disabled={isAdmin}
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                ข้อมูลเพิ่มเติม
              </CardTitle>
              <CardDescription>แผนที่และรูปภาพประกอบงาน</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="location" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>แผนที่</span>
                  </TabsTrigger>
                  <TabsTrigger value="images" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span>Before/After</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="location" forceMount className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">ตำแหน่งงาน</Label>
                    <div className="rounded-lg border overflow-hidden">
                      <MapPicker 
                        initialPosition={location} 
                        onPositionChange={setLocation}
                        disabled={isLeadTechnician}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">รูปภาพสถานที่</Label>
                    <CardDescription className="text-xs">อัปโหลดภาพหน้างานก่อนเริ่มดำเนินการ</CardDescription>
                    <div
                      className={cn(
                        "rounded-lg border border-dashed border-input transition-colors",
                        "flex flex-col",
                        "min-h-[120px]",
                        isDraggingImages && "border-primary bg-muted/50",
                        isLeadTechnician && "opacity-50 pointer-events-none"
                      )}
                      onDragOver={!isLeadTechnician ? handleLocationImageDragOver : undefined}
                      onDragLeave={!isLeadTechnician ? handleLocationImageDragLeave : undefined}
                      onDrop={!isLeadTechnician ? handleLocationImageDrop : undefined}
                    >
                      <input
                        ref={locationImageInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleLocationImageSelect}
                        disabled={isLeadTechnician}
                      />

                      {locationImages.length === 0 ? (
                        <div
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center text-center p-6",
                            !isLeadTechnician && "cursor-pointer"
                          )}
                          onClick={!isLeadTechnician ? openLocationImageDialog : undefined}
                        >
                          <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-3 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">Drag 'n' drop</span> images here, or{" "}
                            <Button
                              type="button"
                              variant="link"
                              className="p-0 h-auto font-semibold text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isLeadTechnician) openLocationImageDialog();
                              }}
                              disabled={isLeadTechnician}
                            >
                              click to browse
                            </Button>
                            .
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">รองรับไฟล์รูปภาพเท่านั้น</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 border-b border-dashed">
                            <p className="text-xs text-muted-foreground text-center">
                              <span className="font-semibold text-primary">Drag 'n' drop</span> more images, or{" "}
                              <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-xs font-semibold text-primary"
                                onClick={openLocationImageDialog}
                                disabled={isLeadTechnician}
                              >
                                click to browse
                              </Button>
                              .
                            </p>
                          </div>
                          <ScrollArea className="flex-1 min-h-0 max-h-[300px]">
                            <div className="grid grid-cols-2 gap-2 p-3">
                              {locationImages.map((file, index) => (
                                <div key={index} className="relative group">
                                  <div className="aspect-video rounded-md border overflow-hidden bg-muted">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteLocationImage(file.name)}
                                    disabled={isLeadTechnician}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1 truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" forceMount className="space-y-4 mt-4">

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      รูปภาพก่อนซ่อม (Before)
                    </Label>
                    <CardDescription className="text-xs">อัปโหลดภาพก่อนดำเนินงานเพื่อใช้อ้างอิง</CardDescription>
                    <div
                      className={cn(
                        "rounded-lg border border-dashed border-input transition-colors",
                        "flex flex-col",
                        "min-h-[120px]",
                        isDraggingBefore && "border-primary bg-muted/50",
                        !canEditBeforeAfterImages && "opacity-50 pointer-events-none"
                      )}
                      onDragOver={canEditBeforeAfterImages ? handleBeforeImageDragOver : undefined}
                      onDragLeave={canEditBeforeAfterImages ? handleBeforeImageDragLeave : undefined}
                      onDrop={canEditBeforeAfterImages ? handleBeforeImageDrop : undefined}
                    >
                      <input
                        ref={beforeImageInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleBeforeImageSelect}
                        disabled={!canEditBeforeAfterImages}
                      />

                      {beforeImages.length === 0 ? (
                        <div
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center text-center p-4",
                            canEditBeforeAfterImages && "cursor-pointer"
                          )}
                          onClick={canEditBeforeAfterImages ? openBeforeImageDialog : undefined}
                        >
                          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-primary">Drag 'n' drop</span> images here, or{" "}
                            <Button
                              type="button"
                              variant="link"
                              className="p-0 h-auto text-xs font-semibold text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openBeforeImageDialog();
                              }}
                            >
                              click to browse
                            </Button>
                            .
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="p-2 border-b border-dashed">
                            <p className="text-xs text-muted-foreground text-center">
                              <span className="font-semibold text-primary">Drag 'n' drop</span> more, or{" "}
                              <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-xs font-semibold text-primary"
                                onClick={openBeforeImageDialog}
                              >
                                browse
                              </Button>
                            </p>
                          </div>
                          <ScrollArea className="flex-1 min-h-0 max-h-[200px]">
                            <div className="grid grid-cols-2 gap-2 p-2">
                              {beforeImages.map((file, index) => (
                                <div key={index} className="group relative">
                                  <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteBeforeImage(file.name)}
                                    disabled={!canEditBeforeAfterImages}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1 truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      รูปภาพหลังซ่อม (After)
                    </Label>
                    <CardDescription className="text-xs">เก็บหลักฐานผลงานหลังดำเนินการเสร็จ</CardDescription>
                    <div
                      className={cn(
                        "rounded-lg border border-dashed border-input transition-colors",
                        "flex flex-col",
                        "min-h-[120px]",
                        isDraggingAfter && "border-primary bg-muted/50",
                        !canEditBeforeAfterImages && "opacity-50 pointer-events-none"
                      )}
                      onDragOver={canEditBeforeAfterImages ? handleAfterImageDragOver : undefined}
                      onDragLeave={canEditBeforeAfterImages ? handleAfterImageDragLeave : undefined}
                      onDrop={canEditBeforeAfterImages ? handleAfterImageDrop : undefined}
                    >
                      <input
                        ref={afterImageInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleAfterImageSelect}
                        disabled={!canEditBeforeAfterImages}
                      />

                      {afterImages.length === 0 ? (
                        <div
                          className={cn(
                            "flex-1 flex flex-col items-center justify-center text-center p-4",
                            canEditBeforeAfterImages && "cursor-pointer"
                          )}
                          onClick={canEditBeforeAfterImages ? openAfterImageDialog : undefined}
                        >
                          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-primary">Drag 'n' drop</span> images here, or{" "}
                            <Button
                              type="button"
                              variant="link"
                              className="p-0 h-auto text-xs font-semibold text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAfterImageDialog();
                              }}
                            >
                              click to browse
                            </Button>
                            .
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="p-2 border-b border-dashed">
                            <p className="text-xs text-muted-foreground text-center">
                              <span className="font-semibold text-primary">Drag 'n' drop</span> more, or{" "}
                              <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-xs font-semibold text-primary"
                                onClick={openAfterImageDialog}
                              >
                                browse
                              </Button>
                            </p>
                          </div>
                          <ScrollArea className="flex-1 min-h-0 max-h-[200px]">
                            <div className="grid grid-cols-2 gap-2 p-2">
                              {afterImages.map((file, index) => (
                                <div key={index} className="group relative">
                                  <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteAfterImage(file.name)}
                                    disabled={!canEditBeforeAfterImages}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1 truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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
  </div>
  );
}