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
  ChevronRight,
  Bell,
  User,
  Calendar,
  ToolCase,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

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
      { name: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
      { name: "Reports", href: "/dashboard/admin/reports", icon: FileText },
      { name: "Calendar", href: "/dashboard/admin/calendar", icon: Calendar },
      { name: "AI", href: "/dashboard/admin/agent", icon: Bot },
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
      { name: "Dashboard", href: "/dashboard/employee/dashboard", icon: LayoutDashboard },
      { name: "My Jobs", href: "/dashboard/employee/jobs", icon: Briefcase },
      { name: "Reports", href: "/dashboard/employee/report", icon: FileText },
      { name: "Notifications", href: "/dashboard/employee/notifications", icon: Bell },
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
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {menus.map((menu) => {
            const Icon = menu.icon;
            const isActive = pathname.startsWith(menu.href);
            const menuItem = (
              <Link
                key={menu.href}
                href={menu.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors group relative",
                  isActive
                    ? "bg-neutral-100 dark:bg-neutral-800 btn-link"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 "
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0 group-hover:animate-bounce"  />
                {!collapsed && <span className="w-full">{menu.name}</span>}
                {!collapsed && <div className="flex justify-end w-full">
                  {/* Active indicator */}
                  {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-5 bg-green-500 dark:bg-green-500 rounded-full shadow-[0_0_10px_rgba(0,255,0,0.6)] dark:[0_0_10px_rgba(0,255,0,0.6)]"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
                  {/* {isActive && <div className="w-2 h-5 bg-black dark:bg-white absolute -right-1 dark:shadow-[0_0_12px_rgba(255,255,255,1)] shadow-[0_0_12px_rgba(0,0,0,1)] rounded-full top-1/2 transform -translate-y-1/2"></div>} */}
                </div>}
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
