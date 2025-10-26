// src/components/Breadcrumbs.tsx
"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { ArrowRight, ChevronRight, Slash } from 'lucide-react'; // Icon สำหรับตัวคั่น

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Import Breadcrumb components ของ shadcn/ui

interface BreadcrumbItem {
  href: string;
  label: string;
  isCurrent: boolean;
}

// Optional: Function to make labels more readable (e.g., 'user-details' -> 'User Details')
const formatBreadcrumbLabel = (segment: string): string => {
  if (!segment) return "";
  // Capitalize first letter and replace hyphens/underscores with spaces
  const formatted = segment.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  
  // Special handling for dynamic segments like [userId]
  if (formatted.startsWith('[') && formatted.endsWith(']')) {
    return formatted.slice(1, -1) + ' ID'; // e.g., 'UserId' -> 'User ID'
  }
  
  // Add more specific mappings if needed
  if (segment === 'admin') return 'Admin Panel';
  if (segment === 'users') return 'Users';
  if (segment === 'settings') return 'Settings';
  if (segment === 'account') return 'Account';

  return formatted;
};


export function AppBreadcrumbs() {
  const pathname = usePathname(); // ดึงเส้นทางปัจจุบันจาก Next.js router
  
  // แบ่ง path ออกเป็น segment และกรองอันที่ว่างเปล่าออก (เช่น จาก `/dashboard/` จะได้ `['dashboard']`)
  const pathSegments = pathname.split('/').filter(segment => segment);

  // สร้าง array ของ Breadcrumb Items
  const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    // สร้าง href สำหรับแต่ละ item
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    // ตรวจสอบว่าเป็น item สุดท้ายหรือไม่
    const isCurrent = index === pathSegments.length - 1;

    return {
      href,
      label: formatBreadcrumbLabel(segment), // แปลง segment ให้เป็น Label ที่อ่านง่าย
      isCurrent,
    };
  });

  // ไม่แสดง Breadcrumbs ถ้าไม่มี segment หรืออยู่หน้าแรกสุด
  if (breadcrumbs.length === 0) {
    return null;
  }

  // ในบางกรณี เราอาจจะไม่ต้องการแสดง "Dashboard" เป็น Breadcrumb แรกสุด
  // ถ้าเราต้องการให้ Dashboard เป็น Root และ Breadcrumbs เริ่มจากถัดจาก Dashboard
  // if (breadcrumbs[0]?.label === 'Dashboard') {
  //   breadcrumbs.shift(); // ลบ "Dashboard" ออก
  // }
  // หรืออาจจะให้ Link แรกสุดเป็น "Home" แทน "Dashboard"
  if (breadcrumbs.length > 0 && breadcrumbs[0].label === 'Dashboard') {
      breadcrumbs[0].label = 'Home'; // เปลี่ยนจาก Dashboard เป็น Home
      breadcrumbs[0].href = '/dashboard'; // ให้แน่ใจว่า href ถูกต้อง
  }


  return (
    <Breadcrumb className="p-4"> {/* เพิ่ม padding และ border-b เพื่อให้ดูดี */}
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <Fragment key={item.href}>
            <BreadcrumbItem>
              {item.isCurrent ? (
                // ถ้าเป็น item สุดท้าย ไม่ต้องมี Link
                <span className="font-semibold text-foreground">
                  {item.label}
                </span>
              ) : (
                // ถ้าไม่ใช่ item สุดท้าย ให้มี Link
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {/* แสดง Separator ยกเว้น item สุดท้าย */}
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight/>
              </BreadcrumbSeparator>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}