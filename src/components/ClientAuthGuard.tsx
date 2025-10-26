"use client";

import { useUserStore } from "@/stores/faker/userStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ClientAuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

export function ClientAuthGuard({
  children,
  allowedRoles,
  redirectPath = "/login",
}: ClientAuthGuardProps) {
  const { isAuthenticated, currentUser, isHydrated } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    // ❌ ยังไม่ได้ล็อกอิน
    if (!isAuthenticated) {
      if (pathname !== redirectPath) {
        setIsRedirecting(true);
        router.replace(redirectPath);
      }
      return;
    }

    // ⚠️ ไม่มี currentUser (state ผิดปกติ)
    if (!currentUser) {
      setIsRedirecting(true);
      router.replace(redirectPath);
      return;
    }

    // ✅ ถ้าล็อกอินอยู่หน้า /login → redirect ไป dashboard ที่ใช้ร่วมกัน
    if (pathname === redirectPath) {
      let newRedirectPath = "/dashboard";
      switch (currentUser.role) {
        case "admin":
        case "manager":
        case "lead_technician":
          newRedirectPath = "/dashboard/admin"; 
          break;
        case "employee":
          newRedirectPath = "/dashboard/employee";
          break;
      }
      setIsRedirecting(true);
      router.replace(newRedirectPath);
      return;
    }

    // 🔒 ตรวจสอบสิทธิ์
    if (allowedRoles) {
      const userRole = currentUser.role;

      // ✅ รวมกลุ่ม role ที่ใช้ dashboard เดียวกัน
      const sharedDashboardRoles = ["admin", "manager", "lead_technician", "lead_tech"];

      // ถ้า allowedRoles มี dashboard กลุ่มนี้ → ให้ role ในกลุ่มเข้าร่วมได้ทั้งหมด
      const expandedAllowedRoles = allowedRoles.includes("admin")
        ? [...allowedRoles, ...sharedDashboardRoles]
        : allowedRoles;

      if (!expandedAllowedRoles.includes(userRole)) {
        let redirectTo = "/dashboard";
        switch (userRole) {
          case "employee":
            redirectTo = "/dashboard/employee";
            break;
          default:
            redirectTo = "/dashboard";
        }

        setIsRedirecting(true);
        router.replace(redirectTo);
        return;
      }
    }
  }, [isHydrated, isAuthenticated, currentUser, allowedRoles, redirectPath, router, pathname]);

  if (!isHydrated || isRedirecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          Checking authentication and permissions...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
