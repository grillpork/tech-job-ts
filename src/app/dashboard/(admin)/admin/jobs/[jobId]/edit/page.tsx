"use client";

import * as React from "react";
import { useState, useEffect } from "react"; // ✅ เพิ่ม useEffect
import { useRouter, useParams } from "next/navigation"; // ✅ เพิ่ม useParams
import { format, parseISO } from "date-fns"; // ✅ เพิ่ม parseISO
import {
  Plus,
  File as FileIcon,
  X,
  Check,
  UploadCloud,
  Image as ImageIcon,
  User,
  Users,
  Package,
  MapPin,
  FileText,
  Camera,
  PenTool,
  Building2,
  CalendarIcon,
  AlertCircle,
  Settings,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { ToolCase } from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Import Store, Types, and Mocks
import { useJobStore, type Attachment } from "@/stores/features/jobStore"; // (แก้ path ถ้าจำเป็น)
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useUserStore } from "@/stores/features/userStore";
import { MOCK_USERS } from "@/lib/mocks/user";
import { Job } from "@/lib/types/job";
import { MapPicker } from '@/components/map/MapPicker';

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogPortal, DialogOverlay, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Interface และข้อมูลตัวอย่างสำหรับพนักงาน
interface Employee {
  value: string;
  label: string;
}

// สร้าง ALL_EMPLOYEES จาก MOCK_USERS ของเรา
const ALL_EMPLOYEES: Employee[] = MOCK_USERS
  .filter(u => u.role === 'employee')
  .map(u => ({ value: u.id, label: u.name }));


export default function EditJobPage() {
  const router = useRouter();
  const params = useParams(); // ✅ 1. ดึง Params จาก URL
  const { getJobById, updateJob } = useJobStore(); // ✅ 2. ดึง Action ที่จำเป็น
  const jobs = useJobStore((state) => state.jobs);
  const { currentUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Role-based permissions
  const isAdmin = currentUser?.role === 'admin';
  const isLeadTechnician = currentUser?.role === 'lead_technician';
  const isEmployee = currentUser?.role === 'employee';
  const canEditBeforeAfterImages = isLeadTechnician || isEmployee;

  // ✅ 3. State สำหรับ Job ที่ดึงมา
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);

  // --- State เดิมทั้งหมดของ Component ---
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [leadTechnician, setLeadTechnician] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [type, setType] = useState<string>("");
  const [departmentsPopoverOpen, setDepartmentsPopoverOpen] = useState(false);

  // (State อื่นๆ ของ UI เหมือนเดิม)
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Inventory selection state
  const inventories = useInventoryStore((s) => s.inventories);
  const [selectedInventory, setSelectedInventory] = useState<{ value: string; label: string; qty?: number }[]>([]);
  const [invPopoverOpen, setInvPopoverOpen] = useState(false);
  // location selected from MapPicker
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string | null } | null>(null);
  // Location images
  const [locationImages, setLocationImages] = useState<File[]>([]);
  const [existingLocationImages, setExistingLocationImages] = useState<string[]>([]);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const locationImageInputRef = React.useRef<HTMLInputElement>(null);
  // Before/After images
  const [beforeImages, setBeforeImages] = useState<File[]>([]);
  const [afterImages, setAfterImages] = useState<File[]>([]);
  const [existingBeforeImages, setExistingBeforeImages] = useState<string[]>([]);
  const [existingAfterImages, setExistingAfterImages] = useState<string[]>([]);
  const [isDraggingBefore, setIsDraggingBefore] = useState(false);
  const [isDraggingAfter, setIsDraggingAfter] = useState(false);
  const beforeImageInputRef = React.useRef<HTMLInputElement>(null);
  const afterImageInputRef = React.useRef<HTMLInputElement>(null);
  // Customer information
  const [customerType, setCustomerType] = useState<"individual" | "organization">("individual");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerCompanyName, setCustomerCompanyName] = useState<string>("");
  const [customerTaxId, setCustomerTaxId] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  // Signature
  const signatureRef = React.useRef<SignatureCanvas>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const availableInventories = React.useMemo(() => inventories.map(i => ({ value: i.id, label: i.name, qty: i.quantity })), [inventories]);

  // ✅ State สำหรับ Alert
  const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ --- Logic กรอง lead technician และพนักงานตาม departments และตรวจสอบว่าว่าง (available) --- ✅
  // ฟังก์ชันตรวจสอบว่า employee ว่างหรือไม่ (ไม่ถูก assign ใน job ที่ active ยกเว้น job ปัจจุบันที่กำลังแก้ไข)
  // Lead technician สามารถถูกเลือกได้มากกว่า 1 ใบงาน
  const isEmployeeAvailable = React.useCallback((employeeId: string) => {
    const activeStatuses = ["pending", "in_progress", "pending_approval"];
    const currentJobId = jobToEdit?.id;

    // ถ้า employee คนนี้ถูก assign ใน job ปัจจุบัน ให้แสดง (available)
    const isAssignedInCurrentJob =
      jobToEdit?.assignedEmployees.some(emp => emp.id === employeeId);

    if (isAssignedInCurrentJob) return true;

    // ตรวจสอบว่าถูก assign ใน job อื่นที่ active หรือไม่
    return !jobs.some(job =>
      job.id !== currentJobId && // ยกเว้น job ปัจจุบันที่กำลังแก้ไข
      activeStatuses.includes(job.status) &&
      job.assignedEmployees.some(emp => emp.id === employeeId)
    );
  }, [jobs, jobToEdit]);

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

  // Helper function to get localStorage key for signature
  const getSignatureStorageKey = (jobId: string) => {
    return `job-signature-${jobId}`;
  };

  // Load signature from localStorage
  const loadSignatureFromLocalStorage = React.useCallback((jobId: string): string | null => {
    try {
      const saved = localStorage.getItem(getSignatureStorageKey(jobId));
      return saved || null;
    } catch (error) {
      console.error('Error loading signature from localStorage:', error);
      return null;
    }
  }, []);

  // Save signature to localStorage
  const saveSignatureToLocalStorage = React.useCallback((jobId: string, signature: string | null) => {
    try {
      if (signature) {
        localStorage.setItem(getSignatureStorageKey(jobId), signature);
      } else {
        localStorage.removeItem(getSignatureStorageKey(jobId));
      }
    } catch (error) {
      console.error('Error saving signature to localStorage:', error);
    }
  }, []);

  // ✅ 4. Effect สำหรับดึงข้อมูล Job มาเติมใน State
  useEffect(() => {
    const jobId = params.jobId as string;
    const job = getJobById(jobId);

    if (job) {
      setJobToEdit(job);
      // เติมข้อมูลลงใน State ทั้งหมด
      setStartDate(job.startDate ? parseISO(job.startDate) : undefined);
      setEndDate(job.endDate ? parseISO(job.endDate) : undefined);

      setSelectedEmployees(job.assignedEmployees.map(u => ({ value: u.id, label: u.name })));
      // แปลง department เดิมเป็น array (backward compatibility)
      setDepartments(Array.isArray(job.departments) ? job.departments : (job.departments ? [job.departments] : []));
      setLeadTechnician(job.leadTechnician?.id || ''); // ใช้ค่าจาก job
      setPriority(job.priority || 'medium'); // ใช้ค่าจาก job
      setType(job.type || ''); // ใช้ค่าจาก job
      // load used inventory if present
      if (job.usedInventory && Array.isArray(job.usedInventory)) {
        setSelectedInventory(job.usedInventory.map((ui) => ({ value: ui.id, label: inventories.find(i => i.id === ui.id)?.name || ui.id, qty: ui.qty })));
      }
      // load location if present
      setLocation(job.location ?? null);
      // load existing attachments
      setExistingAttachments(job.attachments || []);
      // load existing location images (URLs)
      setExistingLocationImages(job.locationImages || []);
      // load existing before/after images (URLs)
      setExistingBeforeImages(job.beforeImages || []);
      setExistingAfterImages(job.afterImages || []);
      // load customer information
      setCustomerType(job.customerType || "individual");
      setCustomerName(job.customerName || "");
      setCustomerPhone(job.customerPhone || "");
      setCustomerCompanyName(job.customerCompanyName || "");
      setCustomerTaxId(job.customerTaxId || "");
      setCustomerAddress(job.customerAddress || "");
      // load signature - prioritize job signature, fallback to localStorage
      const jobSignature = job.signature || null;
      const localStorageSignature = jobSignature ? null : loadSignatureFromLocalStorage(job.id);
      setSignatureData(jobSignature || localStorageSignature);
    } else {
      router.push("/dashboard/admin/jobs"); // ถ้าไม่เจอ Job ให้เด้งกลับ
    }
  }, [params.jobId, getJobById, router, inventories, loadSignatureFromLocalStorage]);



  // --- (ฟังก์ชันเดิมทั้งหมด) ---
  const deleteAttachment = (fileName: string) => setAttachments(attachments.filter((file) => file.name !== fileName));
  const deleteExistingAttachment = (attachmentId: string) => setExistingAttachments(existingAttachments.filter((att) => att.id !== attachmentId));
  const deleteLocationImage = (fileName: string) => setLocationImages(locationImages.filter((file) => file.name !== fileName));
  const deleteExistingLocationImage = (imageUrl: string) => setExistingLocationImages(existingLocationImages.filter((url) => url !== imageUrl));
  const handleLocationImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setLocationImages((prevFiles) => [...prevFiles, ...imageFiles]);
  };
  const handleLocationImageDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingImages(true); };
  const handleLocationImageDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingImages(false); };
  const handleLocationImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImages(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setLocationImages((prevFiles) => [...prevFiles, ...imageFiles]);
  };
  const openLocationImageDialog = () => locationImageInputRef.current?.click();

  // Before/After images handlers
  const handleBeforeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setBeforeImages((prevFiles) => [...prevFiles, ...imageFiles]);
  };

  const handleBeforeImageDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingBefore(true); };
  const handleBeforeImageDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingBefore(false); };
  const handleBeforeImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingBefore(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setBeforeImages((prevFiles) => [...prevFiles, ...imageFiles]);
  };

  const deleteBeforeImage = (fileName: string) => setBeforeImages(beforeImages.filter((file) => file.name !== fileName));
  const deleteExistingBeforeImage = (imageUrl: string) => setExistingBeforeImages(existingBeforeImages.filter((url) => url !== imageUrl));
  const openBeforeImageDialog = () => beforeImageInputRef.current?.click();

  const handleAfterImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setAfterImages((prevFiles) => [...prevFiles, ...imageFiles]);
  };

  const handleAfterImageDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingAfter(true); };
  const handleAfterImageDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingAfter(false); };
  const handleAfterImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAfter(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setAfterImages((prevFiles) => [...prevFiles, ...imageFiles]);
  };

  const deleteAfterImage = (fileName: string) => setAfterImages(afterImages.filter((file) => file.name !== fileName));
  const deleteExistingAfterImage = (imageUrl: string) => setExistingAfterImages(existingAfterImages.filter((url) => url !== imageUrl));
  const openAfterImageDialog = () => afterImageInputRef.current?.click();
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

  const handleRemoveInventory = (value: string) => setSelectedInventory((prev) => prev.filter((inv) => inv.value !== value));
  const handleChangeInventoryQty = (value: string, qty: number) => setSelectedInventory((prev) => prev.map((inv) => inv.value === value ? { ...inv, qty } : inv));

  // Signature handlers
  const getSignatureImage = () => {
    const ref = signatureRef.current;
    if (!ref) return null;
    try {
      // Check if isEmpty method exists and canvas is ready
      if (typeof ref.isEmpty !== 'function') return null;
      if (ref.isEmpty()) return null;

      // Check if toDataURL method exists
      if (typeof ref.toDataURL !== 'function') return null;
      const dataURL = ref.toDataURL("image/png");
      if (!dataURL || dataURL.length < 50) return null;
      const emptyPNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      if (dataURL === emptyPNG) return null;
      return dataURL;
    } catch (error) {
      console.error('Error getting signature image:', error);
      return null;
    }
  };

  const checkSignature = React.useCallback(() => {
    const result = getSignatureImage();
    const finalSignature = result || jobToEdit?.signature || null;
    setSignatureData(finalSignature);

    // Save to localStorage when signature changes
    if (jobToEdit?.id && finalSignature) {
      saveSignatureToLocalStorage(jobToEdit.id, finalSignature);
    }
  }, [jobToEdit?.signature, jobToEdit?.id, saveSignatureToLocalStorage]);

  // Load existing signature into canvas (from job or localStorage)
  React.useEffect(() => {
    if (!signatureData || !signatureRef.current) return;

    const loadSignatureToCanvas = () => {
      const ref = signatureRef.current;
      if (!ref || !signatureData) return;

      try {
        // Check if clear method exists
        if (typeof ref.clear !== 'function') return;

        // Clear first
        ref.clear();

        // Wait a bit before loading image to ensure clear is complete
        setTimeout(() => {
          if (!signatureRef.current || !signatureData) return;

          // Load image from data URL
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = signatureData;
          img.onload = () => {
            const ref = signatureRef.current;
            if (!ref) return;

            try {
              const canvas = ref.getCanvas();
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (ctx && signatureData) {
                ctx.drawImage(img, 0, 0);
              }
            } catch (error) {
              console.error('Error drawing signature image:', error);
            }
          };
          img.onerror = (error) => {
            console.error('Error loading signature image:', error);
          };
        }, 50);
      } catch (error) {
        console.error('Error loading signature to canvas:', error);
      }
    };

    // Wait for canvas to be ready and SignaturePad initialized
    const timer = setTimeout(() => {
      const ref = signatureRef.current;
      if (!ref) return;

      // Check if getCanvas method exists
      if (typeof ref.getCanvas !== 'function') {
        // Retry after a bit more time if not ready
        setTimeout(() => {
          if (signatureRef.current && signatureData) {
            loadSignatureToCanvas();
          }
        }, 300);
        return;
      }

      loadSignatureToCanvas();
    }, 300);

    return () => clearTimeout(timer);
  }, [signatureData]);

  // Only check signature when user is actively drawing (not continuously)
  // Removed the interval check to prevent conflicts with SignaturePad initialization

  const handleSignatureEnd = () => {
    // Wait a bit longer to ensure SignaturePad has finished processing
    setTimeout(() => {
      if (signatureRef.current) {
        checkSignature();
      }
    }, 150);
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      try {
        signatureRef.current.clear();
        setSignatureData(null);
        // Remove from localStorage
        if (jobToEdit?.id) {
          saveSignatureToLocalStorage(jobToEdit.id, null);
        }
      } catch (error) {
        console.error('Error clearing signature:', error);
      }
    }
  };


  // Helper function: แปลง File เป็น base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // ✅ 5. ฟังก์ชัน handleSubmit ที่เรียกใช้ "updateJob"
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!jobToEdit) return;

    // Use FormData to get form values (works better with nested components)
    const formData = new FormData(e.currentTarget);
    const title = formData.get('jobTitle') as string;

    // Fallback to querySelector if FormData doesn't work
    const titleInput = e.currentTarget.querySelector<HTMLInputElement>('[name="jobTitle"]');
    const descriptionTextarea = e.currentTarget.querySelector<HTMLTextAreaElement>('[name="jobDescription"]');

    const finalTitle = title || titleInput?.value || '';
    const description = (formData.get('jobDescription') as string) || descriptionTextarea?.value || '';

    if (!finalTitle || finalTitle.trim() === "") {
      setErrorMessage("กรุณากรอก Job Title ให้ครบถ้วน");
      setIsErrorAlertOpen(true);
      return;
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
      // ✅ แปลง File[] เป็น Attachment[] และรวมกับ existing attachments (ใช้ base64)
      const newAttachments: Attachment[] = await Promise.all(
        attachments.map(async (file) => ({
          id: crypto.randomUUID(),
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          size: file.size,
          url: await fileToBase64(file), // แปลงเป็น base64 string
          uploadedAt: new Date().toISOString(),
        }))
      );

      // รวม attachments เก่าและใหม่
      const allAttachments = [...existingAttachments, ...newAttachments];

      // ✅ แปลง locationImages File[] เป็น base64 string[] และรวมกับ existing
      const newLocationImagesUrls: string[] = await Promise.all(
        locationImages.map((file: File) => fileToBase64(file))
      );
      const allLocationImages = [...existingLocationImages, ...newLocationImagesUrls];

      // ✅ แปลง beforeImages File[] เป็น base64 string[] และรวมกับ existing
      const newBeforeImagesUrls: string[] = await Promise.all(
        beforeImages.map((file: File) => fileToBase64(file))
      );
      const allBeforeImages = [...existingBeforeImages, ...newBeforeImagesUrls];

      // ✅ แปลง afterImages File[] เป็น base64 string[] และรวมกับ existing
      const newAfterImagesUrls: string[] = await Promise.all(
        afterImages.map((file: File) => fileToBase64(file))
      );
      const allAfterImages = [...existingAfterImages, ...newAfterImagesUrls];

      // Get signature - use new signature if available, otherwise keep existing
      const newSignature = getSignatureImage();
      const finalSignature = newSignature || signatureData || jobToEdit.signature || null;

      const updatedData = {
        title: finalTitle,
        description: description,
        leadTechnicianId: leadTechnician,
        departments: departments,
        priority: priority as "low" | "medium" | "high" | "urgent" | null,
        type: (type || null) as "บ้าน" | "คอนโด" | null,
        assignedEmployeeIds: selectedEmployees.map(emp => emp.value),
        usedInventory: selectedInventory.map(inv => ({ id: inv.value, qty: inv.qty ?? 1 })),
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        tasks: [], // ไม่มี tasks
        location: location ?? null,
        attachments: allAttachments,
        locationImages: allLocationImages.length > 0 ? allLocationImages : undefined,
        beforeImages: allBeforeImages.length > 0 ? allBeforeImages : undefined,
        afterImages: allAfterImages.length > 0 ? allAfterImages : undefined,
        customerType: customerType,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerCompanyName: customerType === "organization" ? (customerCompanyName || null) : null,
        customerTaxId: customerType === "organization" ? (customerTaxId || null) : null,
        customerAddress: customerType === "organization" ? (customerAddress || null) : null,
        signature: finalSignature,
      };

      updateJob(jobToEdit.id, updatedData);
      router.push("/dashboard/admin/jobs");
    } catch (error) {
      console.error("Error converting files to base64:", error);
      setErrorMessage("เกิดข้อผิดพลาดในการแปลงไฟล์ กรุณาลองใหม่อีกครั้ง");
      setIsErrorAlertOpen(true);
      setIsSubmitting(false);
    }
  };

  if (!jobToEdit) {
    return <div>Loading...</div>; // แสดงหน้าโหลดขณะดึงข้อมูล
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">แก้ไขงาน</h1>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {jobToEdit.status}
            </Badge>
          </div>
        </div>

        <form id="edit-job-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
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
                    <span className="hidden sm:inline">สื่อ</span>
                  </TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" forceMount={true} className="space-y-6 mt-6 data-[state=inactive]:hidden">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        ข้อมูลงาน
                      </CardTitle>
                      <CardDescription>กรอกข้อมูลพื้นฐานของงาน</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                      <div className="space-y-2">
                        <Label htmlFor="jobTitle" className="text-base font-medium">
                          ชื่องาน <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="jobTitle"
                          name="jobTitle"
                          placeholder="กรอกชื่องาน"
                          className="h-11"
                          defaultValue={jobToEdit.title}
                          disabled={isLeadTechnician}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jobDescription" className="text-base font-medium">
                          รายละเอียดงาน
                        </Label>
                        <Textarea
                          id="jobDescription"
                          name="jobDescription"
                          placeholder="กรอกรายละเอียดงาน"
                          rows={5}
                          className="resize-none"
                          defaultValue={jobToEdit.description || ''}
                          disabled={isLeadTechnician}
                        />
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="priority" className="text-base font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            ความสำคัญ
                          </Label>
                          <Select
                            name="priority"
                            value={priority}
                            onValueChange={setPriority}
                            disabled={isLeadTechnician}

                          >
                            <SelectTrigger id="priority" className="h-11 w-full">
                              <SelectValue placeholder="เลือกความสำคัญ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">ต่ำ (Low)</SelectItem>
                              <SelectItem value="medium">ปานกลาง (Medium)</SelectItem>
                              <SelectItem value="high">สูง (High)</SelectItem>
                              <SelectItem value="urgent">ด่วน (Urgent)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-base font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            ประเภท
                          </Label>
                          <Select
                            name="type"
                            value={type}
                            onValueChange={setType}
                            disabled={isLeadTechnician}
                          >
                            <SelectTrigger id="type" className="h-11 w-full">
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
                          <Label htmlFor="startDate" className="text-base font-medium flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            วันที่เริ่มงาน
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal h-11", !startDate && "text-muted-foreground")}
                                disabled={isLeadTechnician}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>เลือกวันที่</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate" className="text-base font-medium flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            วันที่สิ้นสุดงาน
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal h-11", !endDate && "text-muted-foreground")}
                                disabled={isLeadTechnician}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>เลือกวันที่</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Customer Information Tab */}
                <TabsContent value="customer" forceMount={true} className="space-y-6 mt-6 data-[state=inactive]:hidden">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        ข้อมูลลูกค้า
                      </CardTitle>
                      <CardDescription>กรอกข้อมูลลูกค้าและลายเซ็น</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                      {/* Customer Type Selection */}
                      <div className="space-y-3">
                        <Label className="text-base font-medium">ประเภทลูกค้า</Label>
                        <div className="flex gap-6">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="customerType-individual"
                              name="customerType"
                              value="individual"
                              checked={customerType === "individual"}
                              onChange={(e) => {
                                setCustomerType(e.target.value as "individual" | "organization");
                                // ล้างข้อมูลองค์กรเมื่อเปลี่ยนเป็นลูกค้าปกติ
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
                              onChange={(e) => {
                                setCustomerType(e.target.value as "individual" | "organization");
                              }}
                              disabled={isLeadTechnician}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="customerType-organization" className="font-normal cursor-pointer">
                              องค์กร/บริษัท
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Individual Customer Fields */}
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

                      {/* Organization Customer Fields */}
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

                      {/* Signature */}
                      <div className="space-y-3">
                        <Label className="text-base font-medium flex items-center gap-2">
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
                                style: { width: "100%", height: "200px", touchAction: "none" },
                              }}
                              backgroundColor="white"
                              penColor="#000000"
                              clearOnResize={false}
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

                {/* Team & Resources Tab */}
                <TabsContent value="team" forceMount={true} className="space-y-6 mt-6 data-[state=inactive]:hidden" >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        ทีมงานและทรัพยากร
                      </CardTitle>
                      <CardDescription>จัดการทีมงาน แผนก และวัสดุที่ใช้</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Lead Technician - เลือกก่อน */}
                      <div className="space-y-2">
                        <Label htmlFor="leadTechnician" className="text-base font-medium">
                          หัวหน้าช่าง <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          name="leadTechnician"
                          value={leadTechnician}
                          onValueChange={(value) => {
                            setLeadTechnician(value);
                            setDepartments([]); // ล้าง departments เมื่อเปลี่ยน lead technician
                            setSelectedEmployees([]); // ล้างค่าพนักงานเมื่อเปลี่ยน lead technician
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

                      <Separator />

                      {/* Departments - เลือกได้หลายตัว หลังจากเลือก lead technician */}
                      <div className="space-y-2">
                        <Label className="text-base font-medium">เลือกแผนก</Label>
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
                                              // ล้าง employees ที่อยู่ใน department ที่ถูกลบ
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
                                              // ล้าง employees ที่อยู่ใน department ที่ถูกลบ
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

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          มอบหมายพนักงาน
                        </Label>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between h-auto min-h-11" disabled={departments.length === 0 || isAdmin}>
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
                                  <span className="text-muted-foreground font-normal">Employee name</span>
                                )}
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search employee..." />
                              <CommandList>
                                <CommandEmpty>No employee found in selected departments.</CommandEmpty>
                                <CommandGroup>
                                  {availableEmployees.map((emp) => {
                                    const isSelected = selectedEmployees.some((s) => s.value === emp.value);
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

                      <Separator />

                      {/* Used Inventory */}
                      <div className="space-y-3">
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          วัสดุที่ใช้ <span className="text-xs text-muted-foreground font-normal">(เลือกวัสดุที่ใช้ในงาน)</span>
                        </Label>
                        <Popover open={invPopoverOpen} onOpenChange={setInvPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={invPopoverOpen} className="w-full justify-between h-11" disabled={isAdmin}>
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

                        {/* Selected Inventory List */}
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
                                          disabled={isAdmin}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">pcs</span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveInventory(inv.value)}
                                        disabled={isAdmin}
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

                {/* Media & Attachments Tab */}
                <TabsContent value="media" forceMount={true} className="space-y-6 mt-6 data-[state=inactive]:hidden">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileIcon className="h-5 w-5" />
                        ไฟล์แนบ
                      </CardTitle>
                      <CardDescription>อัปโหลดไฟล์เอกสารที่เกี่ยวข้อง</CardDescription>
                    </CardHeader>
                    <CardContent>

                      {/* Existing Attachments */}
                      {existingAttachments.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-muted-foreground">ไฟล์ที่มีอยู่แล้ว:</p>
                          {existingAttachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-2.5 rounded-md border bg-muted/30">
                              <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <FileIcon className="h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-400 hover:underline block truncate"
                                  >
                                    {attachment.fileName}
                                  </a>
                                  <span className="text-xs text-muted-foreground">
                                    {(attachment.size / 1024 / 1024).toFixed(2)} MB • {new Date(attachment.uploadedAt).toLocaleDateString('th-TH')}
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0 text-destructive hover:text-destructive"
                                onClick={() => deleteExistingAttachment(attachment.id)}
                                disabled={isAdmin}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File Upload Area */}
                      <div
                        className={cn(
                          "rounded-lg border border-dashed border-input transition-colors",
                          "flex flex-col",
                          "min-h-[180px]",
                          isDragging && "border-primary bg-muted/50",
                          isAdmin && "opacity-50 pointer-events-none"
                        )}
                        onDragOver={!isAdmin ? handleDragOver : undefined}
                        onDragLeave={!isAdmin ? handleDragLeave : undefined}
                        onDrop={!isAdmin ? handleDrop : undefined}
                      >
                        {/* Hidden File Input */}
                        {/* ✅ 14. แก้ไข Typo 'handlerFileSelect' -> 'handleFileSelect' */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={isAdmin}
                        />

                        {/* Conditional Content */}
                        {attachments.length === 0 ? (
                          // STATE 1: Empty. Show big prompt.
                          <div
                            className={cn(
                              "flex-1 flex flex-col items-center justify-center text-center p-6",
                              !isAdmin && "cursor-pointer"
                            )}
                            onClick={!isAdmin ? openFileDialog : undefined} // Click anywhere in the empty box
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
                                  disabled={isAdmin}
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
            </div>

            {/* Right Column - Location & Images */}
            <div className="lg:col-span-1 space-y-6">
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

                    <TabsContent value="location" className="space-y-4 mt-4">
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

                        {/* Existing Location Images */}
                        {existingLocationImages.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <p className="text-xs text-muted-foreground">รูปภาพที่มีอยู่แล้ว:</p>
                            <ScrollArea className="max-h-[200px]">
                              <div className="grid grid-cols-2 gap-2">
                                {existingLocationImages.map((imageUrl: string, index: number) => (
                                  <div key={index} className="relative group">
                                    <div className="aspect-video rounded-md border overflow-hidden bg-muted">
                                      <img
                                        src={imageUrl}
                                        alt={`Location ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => deleteExistingLocationImage(imageUrl)}
                                      disabled={isLeadTechnician}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {/* File Upload Area */}
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
                                "flex-1 flex flex-col items-center justify-center text-center p-4",
                                !isLeadTechnician && "cursor-pointer"
                              )}
                              onClick={!isLeadTechnician ? openLocationImageDialog : undefined}
                            >
                              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-primary">Drag 'n' drop</span> images here, or{" "}
                                <Button
                                  type="button"
                                  variant="link"
                                  className="p-0 h-auto text-xs font-semibold text-primary"
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
                                  <span className="font-semibold text-primary">Drag 'n' drop</span> more, or{" "}
                                  <Button
                                    type="button"
                                    variant="link"
                                    className="p-0 h-auto text-xs font-semibold text-primary"
                                    onClick={openLocationImageDialog}
                                    disabled={isLeadTechnician}
                                  >
                                    browse
                                  </Button>
                                </p>
                              </div>
                              <ScrollArea className="flex-1 min-h-0 max-h-[200px]">
                                <div className="grid grid-cols-2 gap-2 p-2">
                                  {locationImages.map((file: File, index: number) => (
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

                    <TabsContent value="images" className="space-y-4 mt-4">

                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          รูปภาพก่อนซ่อม (Before)
                        </Label>
                        <CardDescription className="text-xs">อัปโหลดรูปภาพก่อนเริ่มงาน</CardDescription>
                        {/* Existing Before Images */}
                        {existingBeforeImages.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <p className="text-xs text-muted-foreground">รูปภาพที่มีอยู่แล้ว:</p>
                            <ScrollArea className="max-h-[150px]">
                              <div className="grid grid-cols-2 gap-2">
                                {existingBeforeImages.map((imageUrl: string, index: number) => (
                                  <div key={index} className="group relative">
                                    <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                                      <img src={imageUrl} alt={`Before ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => deleteExistingBeforeImage(imageUrl)}
                                      disabled={!canEditBeforeAfterImages}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

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
                              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-primary">Drag 'n' drop</span> images here, or{" "}
                                <Button
                                  type="button"
                                  variant="link"
                                  className="p-0 h-auto text-xs font-semibold text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (canEditBeforeAfterImages) openBeforeImageDialog();
                                  }}
                                  disabled={!canEditBeforeAfterImages}
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
                                    disabled={!canEditBeforeAfterImages}
                                  >
                                    browse
                                  </Button>
                                </p>
                              </div>
                              <ScrollArea className="flex-1 min-h-0 max-h-[150px]">
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
                        <CardDescription className="text-xs">อัปโหลดรูปภาพหลังเสร็จงาน</CardDescription>
                        {/* Existing After Images */}
                        {existingAfterImages.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <p className="text-xs text-muted-foreground">รูปภาพที่มีอยู่แล้ว:</p>
                            <ScrollArea className="max-h-[150px]">
                              <div className="grid grid-cols-2 gap-2">
                                {existingAfterImages.map((imageUrl: string, index: number) => (
                                  <div key={index} className="group relative">
                                    <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                                      <img src={imageUrl} alt={`After ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => deleteExistingAfterImage(imageUrl)}
                                      disabled={!canEditBeforeAfterImages}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

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
                              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-primary">Drag 'n' drop</span> images here, or{" "}
                                <Button
                                  type="button"
                                  variant="link"
                                  className="p-0 h-auto text-xs font-semibold text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (canEditBeforeAfterImages) openAfterImageDialog();
                                  }}
                                  disabled={!canEditBeforeAfterImages}
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
                                    disabled={!canEditBeforeAfterImages}
                                  >
                                    browse
                                  </Button>
                                </p>
                              </div>
                              <ScrollArea className="flex-1 min-h-0 max-h-[150px]">
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t sticky bottom-0 bg-background z-10">
            <Button variant="ghost" type="button" onClick={() => router.back()} className="h-11">
              ยกเลิก
            </Button>
            <Button type="submit" form="edit-job-form" disabled={isSubmitting} className="h-11 min-w-[120px]">
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </div>
        </form>

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
    </div>
  );
}