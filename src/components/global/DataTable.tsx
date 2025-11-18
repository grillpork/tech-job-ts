"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { Pagination } from "./Pagination";

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface FilterOption {
  label: string;
  value: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalRows: number;
  currentPage: number;
  rowsPerPage: number;
  searchKey?: keyof T;
  filters?: {
    key: keyof T;
    options: FilterOption[];
    placeholder?: string;
  }[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onRowReorder?: (newData: T[]) => void;
  onRowClick?: (row: T) => void;
  showCheckbox?: boolean;
}

// Animated TableRow component
const AnimatedTableRow = motion(TableRow);

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  totalRows,
  currentPage,
  rowsPerPage,
  searchKey,
  filters,
  onPageChange,
  onRowsPerPageChange,
  onRowReorder,
  onRowClick,
  showCheckbox = true,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [sortConfigs, setSortConfigs] = useState<{ key: keyof T; direction: "asc" | "desc" }[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [draggingId, setDraggingId] = useState<string | number | null>(null);

  const handleSort = (key: keyof T) => {
    setSortConfigs((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (!existing) return [...prev, { key, direction: "asc" }];
      if (existing.direction === "asc") {
        return prev.map((s) => (s.key === key ? { ...s, direction: "desc" } : s));
      }
      return prev.filter((s) => s.key !== key);
    });
  };

  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchKey && search) {
      filtered = filtered.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filters && Object.keys(filterValues).length > 0) {
      for (const key of Object.keys(filterValues)) {
        const val = filterValues[key];
        if (val && val !== "all") {
          filtered = filtered.filter((item) => String(item[key as keyof T]) === val);
        }
      }
    }

    if (sortConfigs.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const config of sortConfigs) {
          const aVal = a[config.key];
          const bVal = b[config.key];
          if (aVal < bVal) return config.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return config.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, search, searchKey, filterValues, filters, sortConfigs]);

  const totalFiltered = filteredData.length;
  const safeRowsPerPage = rowsPerPage > 0 ? rowsPerPage : totalFiltered || 1;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / safeRowsPerPage));
  const current = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (current - 1) * safeRowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + safeRowsPerPage);

  const handleDragStart = (e: React.DragEvent, id: string | number) => {
    setDraggingId(id);
    try {
      e.dataTransfer.setData("text/plain", String(id));
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {
      // ignore
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string | number) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain") || String(draggingId ?? "");
    if (!draggedId) return;
    if (String(draggedId) === String(targetId)) return;

    const srcIndex = data.findIndex((d) => String(d.id) === String(draggedId));
    const dstIndex = data.findIndex((d) => String(d.id) === String(targetId));
    if (srcIndex === -1 || dstIndex === -1) return;

    const newData = [...data];
    const [moved] = newData.splice(srcIndex, 1);
    // หลังจาก splice ออกแล้ว index จะเลื่อน ดังนั้น insert ที่ dstIndex
    // ถ้า drag ลง (srcIndex < dstIndex): insert ที่ dstIndex (เพราะ splice ออกแล้ว index จะเลื่อน)
    // ถ้า drag ขึ้น (srcIndex > dstIndex): insert ที่ dstIndex (เพราะ splice ออกแล้ว index จะเลื่อน)
    const insertIndex = srcIndex < dstIndex ? dstIndex : dstIndex + 1;
    newData.splice(insertIndex, 0, moved);

    if (onRowReorder) onRowReorder(newData);
    setDraggingId(null);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const rowVariants = {
    hidden: { 
      opacity: 0, 
      y: 10,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
    },
    exit: { 
      opacity: 0, 
      transition: {
        duration: 0.2 
      }
    },
    hover: {
      scale: 0.99,
      backgroundColor: "rgba(0, 0, 0, 0.02)",
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="h-full space-y-3 overflow-hidden">
      {/* Toolbar with fade-in animation - แสดงเฉพาะเมื่อมี searchKey หรือ filters */}
      {(searchKey || (filters && filters.length > 0)) && (
        <motion.div 
          className="flex flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {searchKey && (
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[240px]"
            />
          )}

          {filters && filters.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {filters.map((f, idx) => (
                <motion.div
                  key={String(f.key)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.8 }}
                >
                  <Select
                    value={filterValues[String(f.key)] || "all"}
                    onValueChange={(val) =>
                      setFilterValues((prev) => ({ ...prev, [String(f.key)]: val }))
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={f.placeholder || "Filter"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {f.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Table with animated rows */}
      <motion.div 
        className="border rounded-md overflow-hidden"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3}}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckbox && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selected.length === filteredData.length && filteredData.length > 0}
                    onCheckedChange={(checked) =>
                      setSelected(checked ? filteredData.map((r) => r.id) : [])
                    }
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={col.sortable ? "cursor-pointer select-none" : ""}
                >
                  <motion.div 
                    className="flex items-center gap-1 overflow-hidden"
                    whileHover={col.sortable ? { scale: 1.05 } : {}}
                  >
                    {col.label}
                    {col.sortable && (
                      <motion.div
                        animate={{ 
                          rotate: sortConfigs.find(s => s.key === col.key)?.direction === "desc" ? 180 : 0 
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowUpDown className="w-3 h-3 opacity-70" />
                      </motion.div>
                    )}
                  </motion.div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, index) => (
                  <AnimatedTableRow
                    key={String(row.id)}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover="hover"
                    layout
                    draggable={!!onRowReorder}
                    onDragStart={(e: any) => onRowReorder && handleDragStart(e, row.id)}
                    onDragOver={(e: any) => onRowReorder && handleDragOver(e)}
                    onDrop={(e: any) => onRowReorder && handleDrop(e, row.id)}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={onRowReorder ? "cursor-grab" : onRowClick ? "cursor-pointer" : undefined}
                    style={{
                      opacity: draggingId === row.id ? 0.5 : 1
                    }}
                  >
                    {showCheckbox && (
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(row.id)}
                          onCheckedChange={(checked) =>
                            setSelected((prev) =>
                              checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                            )
                          }
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={String(col.key)}>
                        {col.render ? col.render(row) : String(row[col.key])}
                      </TableCell>
                    ))}
                  </AnimatedTableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + (showCheckbox ? 1 : 0)} className="text-center py-4 text-gray-500">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      No data found.
                    </motion.div>
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>

      {/* Pagination */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Pagination
          currentPage={current}
          totalRows={totalFiltered}
          rowsPerPage={safeRowsPerPage}
          onPageChange={(p) => {
            const next = Math.min(Math.max(1, p), totalPages);
            onPageChange(next);
          }}
          onRowsPerPageChange={(n) => {
            onRowsPerPageChange(n);
            const newTotalPages = Math.max(1, Math.ceil(totalFiltered / (n > 0 ? n : totalFiltered || 1)));
            if (current > newTotalPages) onPageChange(1);
          }}
        />
      </motion.div>
    </div>
  );
}