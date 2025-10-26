"use client";

import { useState } from "react";
import { useUserStore } from "@/stores/faker/userStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function UserBox() {
  const { currentUser, logout } = useUserStore();
  const [open, setOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition"
        >
          <Avatar className="h-8 w-8">
            {currentUser.imageUrl ? (
              <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
            ) : (
              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">{currentUser.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {currentUser.role.replace("_", " ")}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => console.log("Go to Profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
