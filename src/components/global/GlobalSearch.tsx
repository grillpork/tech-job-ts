"use client";

import * as React from "react";
import { Search, Briefcase, User, Boxes } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const { currentUser } = useUserStore();

  const { jobs } = useJobStore();
  const { users } = useUserStore();
  const { inventories } = useInventoryStore();

  const role = currentUser?.role;

  const rolePermissions: Record<string, string[]> = {
    admin: ["jobs", "users", "inventory"],
    manager: ["jobs", "users", "inventory"],
    lead_technician: ["jobs", "users"],
    employee: ["jobs"],
  };

  const canSearch = (type: string) =>
    role ? rolePermissions[role]?.includes(type) : false;

  const safeQuery = (query ?? "").toLowerCase();

  const filteredJobs = React.useMemo(
    () =>
      canSearch("jobs")
        ? (jobs ?? []).filter((j) =>
            (j?.title ?? "").toLowerCase().includes(safeQuery)
          )
        : [],
    [safeQuery, jobs, role]
  );

  const filteredUsers = React.useMemo(
    () =>
      canSearch("users")
        ? (users ?? []).filter((u) =>
            (u?.name ?? "").toLowerCase().includes(safeQuery)
          )
        : [],
    [safeQuery, users, role]
  );

  const filteredInventories = React.useMemo(
    () =>
      canSearch("inventory")
        ? (inventories ?? []).filter((i) =>
            (i?.name ?? "").toLowerCase().includes(safeQuery)
          )
        : [],
    [safeQuery, inventories, role]
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

  const basePath =
    role === "admin" || role === "manager" || role === "lead_technician"
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
        <span className="hidden sm:inline text-sm">Search...</span>
        <kbd className="ml-auto text-xs text-muted-foreground hidden sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog className="top-60 lg:top-1/2" open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search job, user, or inventory..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Jobs */}
          {filteredJobs.length > 0 && (
            <CommandGroup heading="Jobs">
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
            <CommandGroup heading="Users">
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
            <CommandGroup heading="Inventory">
              {filteredInventories.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect("inventory", item.id)}
                  className="cursor-pointer"
                >
                  <Boxes className="w-4 h-4 mr-2 text-orange-500" />
                  <span>{item.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
