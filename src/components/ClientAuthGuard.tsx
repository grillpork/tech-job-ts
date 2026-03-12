"use client";

import { useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const currentUser = session?.user;

  useEffect(() => {
    if (isLoading) return;

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
          newRedirectPath = "/dashboard/admin/dashboard";
          break;
        case "employee":
          newRedirectPath = "/dashboard/employee/dashboard";
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
            redirectTo = "/dashboard/employee/dashboard"; // Fixed path to match dashboard structure
            break;
          default:
            redirectTo = "/dashboard/admin/dashboard";
        }

        // Avoid redirect loop if already on target (basic check)
        if (pathname !== redirectTo) { // Simplified check
          setIsRedirecting(true);
          router.replace(redirectTo);
        }
        return;
      }
    }
  }, [isLoading, isAuthenticated, currentUser, allowedRoles, redirectPath, router, pathname]);

  if (isLoading || isRedirecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">
          กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
        </span>
      </div>
    );
  }


  return <>{children}</>;
}
