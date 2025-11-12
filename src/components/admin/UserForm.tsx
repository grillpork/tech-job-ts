"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserStore } from "@/stores/features/userStore";
import { notificationHelpers } from "@/stores/notificationStore";
import { toast } from "sonner";

type User = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  imageUrl?: string | null;
  password?: string;
};

export default function UserForm({ user, onClose }: { user?: User; onClose: () => void }) {
  const { createUser, updateUser } = useUserStore();
  const isEditMode = !!user?.id;
  
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: user || {
      name: "",
      email: "",
      role: "employee",
      status: "active",
      imageUrl: null,
      password: "",
    },
  });

  const roleValue = watch("role");
  const statusValue = watch("status");

  const onSubmit = (values: any) => {
    if (isEditMode && user?.id) {
      // แก้ไขผู้ใช้
      updateUser(user.id, values);
      toast.success("อัปเดตข้อมูลผู้ใช้สำเร็จ");
    } else {
      // สร้างผู้ใช้ใหม่
      if (!values.name || !values.email) {
        toast.error("กรุณากรอกชื่อและอีเมล");
        return;
      }
      
      const newUser = {
        name: values.name,
        email: values.email,
        role: (values.role || "employee") as "admin" | "manager" | "lead_technician" | "employee",
        status: values.status || "active",
        imageUrl: values.imageUrl || null,
        password: values.password || "password123",
        department: values.department || null,
      };
      
      createUser(newUser);
      
      // ✅ สร้าง notification เมื่อสร้างผู้ใช้สำเร็จ
      const createdUser = useUserStore.getState().users.find(u => u.email === values.email);
      if (createdUser) {
        notificationHelpers.userCreated(
          createdUser.name,
          createdUser.id
        );
      }
      
      toast.success("สร้างบัญชีผู้ใช้สำเร็จ");
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">
          ชื่อ <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="name"
          className="mt-1" 
          {...register("name", { required: true })} 
          placeholder="กรอกชื่อผู้ใช้"
        />
      </div>

      <div>
        <Label htmlFor="email">
          อีเมล <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="email"
          type="email" 
          className="mt-1" 
          {...register("email", { required: true })} 
          placeholder="example@company.com"
          disabled={isEditMode}
        />
      </div>

      <div>
        <Label htmlFor="role">บทบาท</Label>
        <Select
          value={roleValue || "employee"}
          onValueChange={(value) => setValue("role", value)}
        >
          <SelectTrigger id="role" className="mt-1">
            <SelectValue placeholder="เลือกบทบาท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="lead_technician">Lead Technician</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">สถานะ</Label>
        <Select
          value={statusValue || "active"}
          onValueChange={(value) => setValue("status", value)}
        >
          <SelectTrigger id="status" className="mt-1">
            <SelectValue placeholder="เลือกสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isEditMode && (
        <div>
          <Label htmlFor="password">รหัสผ่าน</Label>
          <Input 
            id="password"
            type="password" 
            className="mt-1" 
            {...register("password")} 
            placeholder="เว้นว่างไว้จะใช้รหัสผ่านเริ่มต้น: password123"
          />
          <p className="text-xs text-muted-foreground mt-1">
            หากไม่กรอกจะใช้รหัสผ่านเริ่มต้น: password123
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="imageUrl">URL รูปภาพ</Label>
        <Input 
          id="imageUrl"
          className="mt-1" 
          {...register("imageUrl")} 
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <Label htmlFor="department">แผนก/ฝ่าย</Label>
        <Input 
          id="department"
          className="mt-1" 
          {...register("department")} 
          placeholder="เช่น ช่างไฟฟ้า, ช่างประปา"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} type="button">
          ยกเลิก
        </Button>
        <Button type="submit">
          {isEditMode ? "บันทึกการแก้ไข" : "สร้างบัญชี"}
        </Button>
      </div>
    </form>
  );
}
