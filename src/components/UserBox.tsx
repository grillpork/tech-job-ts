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
import { redirect } from "next/navigation";
import { History, LogOut, User } from "lucide-react";
import { Separator } from "./ui/separator";

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

      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => redirect(`/dashboard/${currentUser?.role}/profile`)}>
          <User/>
          My Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => redirect(`/dashboard/${currentUser?.role}/history`)}>
          <History/>
          History
        </DropdownMenuItem>
        <Separator/>
        <DropdownMenuItem onClick={logout} variant="destructive">
          <LogOut/>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
