"use client";

import { useState } from "react";
import { useUserStore } from "@/stores/faker/userStore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Calendar,
  ToolCase,
  PanelRight,
  PanelLeft,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Sidebar() {
  const { currentUser, logout } = useUserStore();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // ✅ เมนูตาม role
  const roleMenus: Record<string, { name: string; href: string; icon: any }[]> = {
    admin: [
      { name: "Dashboard", href: "/dashboard/admin/dashboard", icon: LayoutDashboard },
      { name: "Users", href: "/dashboard/admin/users", icon: Users },
      { name: "Jobs", href: "/dashboard/admin/jobs", icon: Briefcase },
      { name: "Notification", href: "/dashboard/admin/notification", icon: Bell },
      { name: "Reports", href: "/dashboard/admin/reports", icon: FileText },
      { name: "Calendar", href: "/dashboard/admin/calendar", icon: Calendar },
      { name: "Inventorys", href: "/dashboard/admin/inventorys", icon: ToolCase },
      { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ],
    manager: [
      { name: "Dashboard", href: "/dashboard/admin/dashboard", icon: LayoutDashboard },
      { name: "Team Jobs", href: "/dashboard/admin/jobs", icon: Briefcase },
      { name: "Calendar", href: "/dashboard/admin/calendar", icon: Calendar },
      { name: "Reports", href: "/dashboard/admin/reports", icon: FileText },
    ],
    lead_technician: [
      { name: "Dashboard", href: "/dashboard/admin/dashboard", icon: LayoutDashboard },
      { name: "Assigned Jobs", href: "/dashboard/admin/jobs", icon: Briefcase },
      { name: "Calendar", href: "/dashboard/admin/calendar", icon: Calendar },
      { name: "Inventory", href: "/dashboard/employee/inventory", icon: ToolCase },
      { name: "Reports", href: "/dashboard/admin/reports", icon: FileText },
    ],
    employee: [
      { name: "Overview", href: "/dashboard/employee/overview", icon: LayoutDashboard },
      { name: "My Jobs", href: "/dashboard/employee/jobs", icon: Briefcase },
      { name: "Reports", href: "/dashboard/employee/report", icon: FileText },
      { name: "Notification", href: "/dashboard/employee/notification", icon: Bell },
      { name: "Calendar", href: "/dashboard/employee/calendar", icon: Calendar },
      { name: "Inventorys", href: "/dashboard/employee/inventorys", icon: ToolCase },
      { name: "Profile", href: "/dashboard/employee/profile", icon: User },
      { name: "Settings", href: "/dashboard/employee/settings", icon: Settings },
    ],
  };

  const menus = roleMenus[currentUser?.role || "employee"] || [];

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "h-screen bg-white dark:bg-background  flex flex-col transition-all duration-300",
          collapsed ? "w-17" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 ">
          {!collapsed && (
            <h1 className="text-xl font-bold text-primary truncate">
              {currentUser
                ? currentUser.role.toUpperCase() + " PANEL"
                : "DASHBOARD"}
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-background"
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {menus.map((menu) => {
            const Icon = menu.icon;
            const isActive = pathname === menu.href;

            const menuItem = (
              <Link
                key={menu.href}
                href={menu.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary dark:bg-neutral-800 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="w-">{menu.name}</span>}
                {!collapsed && <div className="flex justify-end w-full">{isActive && <ChevronRight className="w-4 h-4" />}</div>}
              </Link>
            );

            return collapsed ? (
              <Tooltip key={menu.href}>
                <TooltipTrigger asChild>{menuItem}</TooltipTrigger>
                <TooltipContent side="right">
                  <p>{menu.name}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              menuItem
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
