// src/components/ClientAuthGuard.tsx
"use client";

import { useUserStore } from "@/stores/userStore";
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

  // 🔍 Debug log (เฉพาะตอน dev)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("ClientAuthGuard: Current State -", {
        isHydrated,
        isAuthenticated,
        currentUser: currentUser
          ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
          : null,
        pathname,
        allowedRoles,
      });
    }
  }, [isHydrated, isAuthenticated, currentUser, pathname, allowedRoles]);

  useEffect(() => {
    if (!isHydrated) return; // 🕓 รอ store hydrate ก่อน

    // ❌ ยังไม่ได้ล็อกอิน
    if (!isAuthenticated) {
      if (pathname !== redirectPath) {
        if (process.env.NODE_ENV === "development") {
          console.warn("ClientAuthGuard: Not authenticated. Redirecting to login.");
        }
        setIsRedirecting(true);
        router.replace(redirectPath);
      }
      return;
    }

    // ⚠️ ล็อกอินแล้วแต่ไม่มี currentUser (state ผิดปกติ)
    if (!currentUser) {
      if (process.env.NODE_ENV === "development") {
        console.warn("ClientAuthGuard: Authenticated but currentUser is null. Redirecting to login.");
      }
      setIsRedirecting(true);
      router.replace(redirectPath);
      return;
    }

    // ✅ ถ้าอยู่หน้า /login แล้วแต่ล็อกอินแล้ว → ไป dashboard ตาม role
    if (pathname === redirectPath) {
      if (process.env.NODE_ENV === "development") {
        console.log("ClientAuthGuard: Authenticated on login page. Redirecting by role.");
      }

      let newRedirectPath = "/dashboard";
      switch (currentUser.role) {
        case "admin":
          newRedirectPath = "/dashboard/admin";
          break;
        case "manager":
          newRedirectPath = "/dashboard/manager";
          break;
        case "lead_technician":
          newRedirectPath = "/dashboard/lead-technician";
          break;
        case "employee":
          newRedirectPath = "/dashboard/employee";
          break;
      }

      setIsRedirecting(true);
      router.replace(newRedirectPath);
      return;
    }

    // 🔒 ตรวจสอบสิทธิ์ตาม role (ถ้ามีการกำหนด allowedRoles)
    if (allowedRoles) {
      if (process.env.NODE_ENV === "development") {
        console.log(`ClientAuthGuard: Checking authorization for '${pathname}'`);
        console.log(`  - User Role: ${currentUser.role}`);
        console.log(`  - Allowed: [${allowedRoles.join(", ")}]`);
      }

      if (!allowedRoles.includes(currentUser.role)) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `ClientAuthGuard: Authorization FAILED. '${currentUser.role}' not allowed for '${pathname}'.`
          );
        }

        let newRedirectPath = "/dashboard";
        switch (currentUser.role) {
          case "admin":
            newRedirectPath = "/dashboard/admin";
            break;
          case "manager":
            newRedirectPath = "/dashboard/manager";
            break;
          case "lead_technician":
            newRedirectPath = "/dashboard/lead-technician";
            break;
          case "employee":
            newRedirectPath = "/dashboard/employee";
            break;
        }

        if (pathname !== newRedirectPath) {
          setIsRedirecting(true);
          router.replace(newRedirectPath);
        }
        return;
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log(`ClientAuthGuard: Authorization PASSED for '${pathname}'.`);
        }
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `ClientAuthGuard: All checks passed. '${currentUser.name}' (${currentUser.role}) authorized for '${pathname}'.`
      );
    }
  }, [
    isHydrated,
    isAuthenticated,
    currentUser,
    allowedRoles,
    redirectPath,
    router,
    pathname,
  ]);

  // 🌀 แสดง Loader ระหว่าง Hydrating หรือ Redirecting
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

  // ✅ แสดง children เมื่อผ่านทุกเงื่อนไข
  return <>{children}</>;
}
