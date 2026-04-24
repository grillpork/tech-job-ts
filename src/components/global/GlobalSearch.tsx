"use client";

import * as React from "react";
import { Search, Briefcase, User, Boxes } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // ✅ Changed to NextAuth
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useJobStore } from "@/stores/features/jobStore";
import { useUserStore } from "@/stores/features/userStore";
import { useInventoryStore } from "@/stores/features/inventoryStore";

export default function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const router = useRouter();
  const { data: session } = useSession(); // ✅ Use useSession
  const currentUser = session?.user; // ✅ Map to existing variable name

  const { jobs } = useJobStore();
  const { users } = useUserStore();
  const { inventories } = useInventoryStore();

  const role = currentUser?.role;

  const rolePermissions: Record<string, string[]> = React.useMemo(() => ({
    admin: ["jobs", "users", "inventory"],
    manager: ["jobs", "users", "inventory"],
    lead_technician: ["jobs", "users"],
    employee: ["jobs"],
  }), []);

  const canSearch = React.useCallback((type: string) => {
    if (!role) return false;
    const effectiveRole = role.startsWith("lead_") ? "lead_technician" : role;
    return rolePermissions[effectiveRole]?.includes(type);
  }, [role, rolePermissions]);

  const safeQuery = (query ?? "").toLowerCase();
  const hasQuery = safeQuery.trim().length > 0;

  const filteredJobs = React.useMemo(
    () =>
      hasQuery && canSearch("jobs")
        ? (jobs ?? []).filter((j) =>
          (j?.title ?? "").toLowerCase().includes(safeQuery)
        )
        : [],
    [safeQuery, jobs, canSearch, hasQuery]
  );

  const filteredUsers = React.useMemo(
    () =>
      hasQuery && canSearch("users")
        ? (users ?? []).filter((u) =>
          (u?.name ?? "").toLowerCase().includes(safeQuery)
        )
        : [],
    [safeQuery, users, canSearch, hasQuery]
  );

  const filteredInventories = React.useMemo(
    () =>
      hasQuery && canSearch("inventory")
        ? (inventories ?? []).filter((i) =>
          (i?.name ?? "").toLowerCase().includes(safeQuery)
        )
        : [],
    [safeQuery, inventories, canSearch, hasQuery]
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const isLead = (r?: string) => r === "lead_technician" || (r?.startsWith("lead_") ?? false);

  const basePath =
    role === "admin" || role === "manager" || isLead(role)
      ? "/dashboard/admin"
      : "/dashboard/employee";

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    router.push(`${basePath}/${type}/${id}`);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center w-9 h-9 sm:w-fit sm:h-fit gap-2 rounded-full"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">ค้นหา...</span>
        <kbd className="ml-auto text-xs text-muted-foreground hidden sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        className="top-60 lg:top-1/2"
        open={open}
        onOpenChange={setOpen}
      >
        <CommandInput
          placeholder="ค้นหางาน, ผู้ใช้ หรือสินค้า..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!hasQuery ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              เริ่มพิมพ์เพื่อค้นหา...
            </div>
          ) : (
            <>
              <CommandEmpty>ไม่พบผลลัพธ์</CommandEmpty>

              {/* Jobs */}
              {filteredJobs.length > 0 && (
                <CommandGroup heading="งาน">
                  {filteredJobs.map((job) => (
                    <CommandItem
                      key={job.id}
                      onSelect={() => handleSelect("jobs", job.id)}
                      className="cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                      <span>{job.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Users */}
              {filteredUsers.length > 0 && (
                <CommandGroup heading="ผู้ใช้">
                  {filteredUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => handleSelect("users", user.id)}
                      className="cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2 text-green-500" />
                      <span>{user.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Inventories */}
              {filteredInventories.length > 0 && (
                <CommandGroup heading="สินค้า">
                  {filteredInventories.map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => {
                        setOpen(false);
                        // ใช้ path ที่ถูกต้องตาม role
                        const inventoryPath = role === "admin" || role === "manager" || isLead(role)
                          ? `/dashboard/admin/inventorys/${item.id}`
                          : `/dashboard/employee/inventorys/${item.id}`;
                        router.push(inventoryPath);
                      }}
                      className="cursor-pointer"
                    >
                      <Boxes className="w-4 h-4 mr-2 text-orange-500" />
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
