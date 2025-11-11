"use client";

import React, { useState, useMemo } from "react";
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
}

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

    // Global search
    if (searchKey && search) {
      filtered = filtered.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(search.toLowerCase())
      );
    }

    // Dropdown filters
    if (filters && Object.keys(filterValues).length > 0) {
      for (const key of Object.keys(filterValues)) {
        const val = filterValues[key];
        if (val && val !== "all") {
          filtered = filtered.filter((item) => String(item[key as keyof T]) === val);
        }
      }
    }

    // Multi sort
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

  // Pagination: slice the filtered data according to current page and rowsPerPage
  const totalFiltered = filteredData.length;
  const safeRowsPerPage = rowsPerPage > 0 ? rowsPerPage : totalFiltered || 1;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / safeRowsPerPage));
  const current = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (current - 1) * safeRowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + safeRowsPerPage);

  // Drag & Drop handlers for row reordering (persistent when onRowReorder provided)
  const handleDragStart = (e: React.DragEvent, id: string | number) => {
    setDraggingId(id);
    try {
      e.dataTransfer.setData("text/plain", String(id));
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {
      // ignore in environments that block dataTransfer
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

    // reorder in the original data array by moving dragged before target
    const srcIndex = data.findIndex((d) => String(d.id) === String(draggedId));
    const dstIndex = data.findIndex((d) => String(d.id) === String(targetId));
    if (srcIndex === -1 || dstIndex === -1) return;

    const newData = [...data];
    const [moved] = newData.splice(srcIndex, 1);
    // if removing an earlier index, adjust dstIndex
    const insertIndex = srcIndex < dstIndex ? dstIndex : dstIndex;
    newData.splice(insertIndex, 0, moved);

    if (onRowReorder) onRowReorder(newData);

    setDraggingId(null);
  };

  return (
    <div className="h-full space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-[240px]"
        />

        <div className="flex gap-2 flex-wrap">
          {filters?.map((f) => (
            <Select
              key={String(f.key)}
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
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selected.length === filteredData.length && filteredData.length > 0}
                  onCheckedChange={(checked) =>
                    setSelected(checked ? filteredData.map((r) => r.id) : [])
                  }
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={col.sortable ? "cursor-pointer select-none" : ""}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <ArrowUpDown className="w-3 h-3 opacity-70" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow
                  key={String(row.id)}
                  draggable={!!onRowReorder}
                  onDragStart={(e) => onRowReorder && handleDragStart(e, row.id)}
                  onDragOver={(e) => onRowReorder && handleDragOver(e)}
                  onDrop={(e) => onRowReorder && handleDrop(e, row.id)}
                  className={onRowReorder ? "cursor-grab" : undefined}
                >
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
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      {col.render ? col.render(row) : String(row[col.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-4 text-gray-500">
                  No data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={current}
        totalRows={totalFiltered}
        rowsPerPage={safeRowsPerPage}
        onPageChange={(p) => {
          // clamp page between 1..totalPages and forward to parent
          const next = Math.min(Math.max(1, p), totalPages);
          onPageChange(next);
        }}
        onRowsPerPageChange={(n) => {
          onRowsPerPageChange(n);
          // when rows per page changes, if current page would be out of range, reset to 1
          const newTotalPages = Math.max(1, Math.ceil(totalFiltered / (n > 0 ? n : totalFiltered || 1)));
          if (current > newTotalPages) onPageChange(1);
        }}
      />
    </div>
  );
}
