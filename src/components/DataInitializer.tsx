"use client";

import { useEffect } from "react";
import { useInventoryStore } from "@/stores/features/inventoryStore";
import { useReportStore } from "@/stores/features/reportStore";
import { useAuditLogStore } from "@/stores/features/auditLogStore";
import { useJobStore } from "@/stores/features/jobStore";
import { useUserStore } from "@/stores/features/userStore";

/**
 * DataInitializer — mounted once inside DashboardLayout.
 * Triggers all store fetches from the DB on first render.
 */
export function DataInitializer() {
  const fetchInventory = useInventoryStore((s) => s.fetchInventory);
  const fetchReports = useReportStore((s) => s.fetchReports);
  const fetchAuditLogs = useAuditLogStore((s) => s.fetchAuditLogs);
  const fetchJobs = useJobStore((s) => s.fetchJobs);
  const fetchUsers = useUserStore((s) => s.fetchUsers);

  useEffect(() => {
    // Fire all fetches in parallel on mount
    Promise.all([
      fetchJobs(),
      fetchInventory(),
      fetchReports(),
      fetchAuditLogs(),
      fetchUsers(),
    ]).catch((err) => console.error("DataInitializer: fetch error", err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null; // renders nothing
}
