"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useNotificationStore } from "@/stores/notificationStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 6;

export default function NotificationsPage() {
  const { notifications, markAsRead } = useNotificationStore();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  // Filtered + sorted notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    if (filter === "read") filtered = notifications.filter((n) => n.read);
    if (filter === "unread") filtered = notifications.filter((n) => !n.read);

    return filtered.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [notifications, filter, sortOrder]);

  const totalPages = Math.ceil(filteredNotifications.length / PAGE_SIZE);
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Mark all visible notifications as read when rendered
  // useEffect(() => {
  //   paginatedNotifications.forEach((n) => markAsRead(n.id));
  // }, [paginatedNotifications, markAsRead]);

  const handleMarkAsRead = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      markAsRead(id);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <Select
          value={filter}
          onValueChange={(val) => {
            setFilter(val as any);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortOrder}
          onValueChange={(val) => setSortOrder(val as any)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification Cards */}
      {paginatedNotifications.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No notifications found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {paginatedNotifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onAnimationComplete={() => handleMarkAsRead(n.id)} // mark after appear
              >
                <Card
                  className={`${
                    n.read ? "bg-muted/30" : "bg-muted/60"
                  } hover:shadow-md transition-shadow`}
                >
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">
                      {n.title || "Notification"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {n.message}
                    </CardDescription>
                    {n.createdAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
