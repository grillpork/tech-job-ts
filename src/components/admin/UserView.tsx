"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function UserView({ user }: { user: any }) {
  const initials = (user?.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar>
          {user?.imageUrl ? (
            <AvatarImage src={user.imageUrl} alt={user.name} />
          ) : (
            <AvatarFallback>{initials || "U"}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <div className="text-lg font-semibold">{user?.name}</div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-muted-foreground">Role</div>
          <div className="font-medium">{user?.role || "-"}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="font-medium">{user?.status || "-"}</div>
        </div>
        <div className="col-span-2">
          <div className="text-xs text-muted-foreground">ID</div>
          <div className="font-mono text-sm">{user?.id}</div>
        </div>
      </div>
    </div>
  );
}
