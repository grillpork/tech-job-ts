"use client";

import { useState } from "react";
import { useUserStore } from "@/stores/features/userStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect, useRouter } from "next/navigation";
import { Bell, ChevronsUpDown, History, LogOut, User } from "lucide-react";
import { Separator } from "./ui/separator";
import { ModeToggle } from "./ModeToggle";
import { getHistoryPathByRole, getNotificationPathByRole, getProfilePathByRole } from "@/lib/route-helper";

export function UserBox() {
  const { currentUser, logout } = useUserStore();
  const { getUnreadCountForUser } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Get unread count for current user
  const unreadCount = currentUser
    ? getUnreadCountForUser(currentUser.id, currentUser.role)
    : 0;

  const handleNotification = () => {
    if (!currentUser) return;
    router.push(getNotificationPathByRole(currentUser.role));
  };
  const handleProfile = () => {
    if (!currentUser) return;
    router.push(getProfilePathByRole(currentUser.role));
  };
  const handleHistory = () => {
    if (!currentUser) return;
    router.push(getHistoryPathByRole(currentUser.role));
  };

  if (!currentUser) return null;

  return (
    <div >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-8 w-8">
            {currentUser.imageUrl ? (
              <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
            ) : (
              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
            )}
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52 space-y-2 mt-3.5">
          <div className="flex gap-2 items-center p-2">
            <Avatar className="h-8 w-8">
              {currentUser.imageUrl ? (
                <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
              ) : (
                <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
              )}
            </Avatar>
            <div className=" flex-col items-start leading-tight flex">
              <span className="text-sm font-medium">{currentUser.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {currentUser.role.replace("_", " ")}
              </span>
            </div>
          </div>
          <Separator />
          <DropdownMenuItem onClick={handleProfile}>
            <User />
            My Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleHistory}>
            <History />
            History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNotification} className="relative">
            <Bell />
            Notifications
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DropdownMenu>
              <ModeToggle />
            </DropdownMenu>
          </DropdownMenuItem>
          <Separator />
          <DropdownMenuItem onClick={logout} variant="destructive">
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
