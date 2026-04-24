"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Calendar,
  Users,
  LayoutGrid,
  List,
  ExternalLink,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useReportStore, type Report as StoreReport } from "@/stores/features/reportStore"
import { useUserStore } from "@/stores/features/userStore"

// Types
// type Department = "engineering" | "design" | "product" | "qa" | "customer" | "Electrical" | "Mechanical" | "Civil" | "Technical"
type Priority = "high" | "medium" | "low"
type Status = "open" | "in-progress" | "resolved" | "closed"

interface Reporter {
  name: string
  department: string
  avatar: string
}

interface Report {
  id: string
  title: string
  description: string
  reporter: Reporter
  priority: Priority
  status: Status
  createdAt: string
  imageUrl: string
  tags: string[]
  isMultiDept?: boolean
  departments?: string[]
  resolutionNote?: string | null
}

// กำหนดสีสำหรับแต่ละฝ่าย
const departmentColors: Record<string, {
  bg: string
  border: string
  text: string
  badge: string
}> = {
  engineering: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    border: "border-blue-500/50",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-500"
  },
  design: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    border: "border-purple-500/50",
    text: "text-purple-700 dark:text-purple-300",
    badge: "bg-purple-500"
  },
  product: {
    bg: "bg-green-500/10 dark:bg-green-500/20",
    border: "border-green-500/50",
    text: "text-green-700 dark:text-green-300",
    badge: "bg-green-500"
  },
  qa: {
    bg: "bg-orange-500/10 dark:bg-orange-500/20",
    border: "border-orange-500/50",
    text: "text-orange-700 dark:text-orange-300",
    badge: "bg-orange-500"
  },
  customer: {
    bg: "bg-pink-500/10 dark:bg-pink-500/20",
    border: "border-pink-500/50",
    text: "text-pink-700 dark:text-pink-300",
    badge: "bg-pink-500"
  },
  Electrical: {
    bg: "bg-yellow-500/10 dark:bg-yellow-500/20",
    border: "border-yellow-500/50",
    text: "text-yellow-700 dark:text-yellow-300",
    badge: "bg-yellow-500"
  },
  Mechanical: {
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    border: "border-slate-500/50",
    text: "text-slate-700 dark:text-slate-300",
    badge: "bg-slate-500"
  },
  Civil: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    border: "border-amber-500/50",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-500"
  },
  Technical: {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    border: "border-cyan-500/50",
    text: "text-cyan-700 dark:text-cyan-300",
    badge: "bg-cyan-500"
  }
}


const priorityConfig: Record<Priority, {
  icon: React.ComponentType<{ className?: string }>,
  color: string,
  bg: string
}> = {
  high: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
  medium: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  low: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" }
}

const statusConfig: Record<Status, { label: string, color: string }> = {
  open: { label: "รอดำเนินการ", color: "bg-blue-400" },
  "in-progress": { label: "กำลังดำเนินการ", color: "bg-yellow-400" },
  resolved: { label: "แก้ไขแล้ว", color: "bg-green-400" },
  closed: { label: "ปิด", color: "bg-gray-400" }
}

export default function AdminReportPage() {
  const { reports: storeReports, updateReport } = useReportStore()
  const { users } = useUserStore()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterDepartment, setFilterDepartment] = useState<string | "all">("all")
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all")
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showResolutionForm, setShowResolutionForm] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")
  const [isActioning, setIsActioning] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  // Map store reports to page reports
  const reports = useMemo(() => {
    return storeReports.map((storeReport): Report => {
      const priorityMap: Record<"urgent" | "high" | "medium" | "low", Priority> = {
        urgent: "high",
        high: "high",
        medium: "medium",
        low: "low",
      }

      const statusMap: Record<StoreReport["status"], Status> = {
        open: "open",
        in_progress: "in-progress",
        resolved: "resolved",
        closed: "closed",
      }

      // Use reporter.department directly (API now includes it), fallback to userStore
      const reporterUser = users.find(u => u.id === storeReport.reporter.id)
      let department = (storeReport.reporter as any).department || reporterUser?.department || "Technical"

      const departmentMap: Record<string, string> = {
        "ไฟฟ้า": "Electrical",
        "เครื่องกล": "Mechanical",
        "โยธา": "Civil",
        "เทคนิค": "Technical"
      }

      if (department && departmentMap[department]) {
        department = departmentMap[department]
      }

      const storeMultiDepts: string[] = (storeReport as any).departments || storeReport.tags || []
      const isMultiDept: boolean = (storeReport as any).isMultiDept || storeMultiDepts.length > 1

      return {
        id: storeReport.id,
        title: storeReport.title,
        description: storeReport.description || "",
        reporter: {
          name: storeReport.reporter.name,
          department,
          avatar: storeReport.reporter.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(storeReport.reporter.name)}`,
        },
        priority: priorityMap[storeReport.priority || "medium"],
        status: statusMap[storeReport.status],
        createdAt: storeReport.createdAt,
        imageUrl: storeReport.attachments?.[0]?.url || "",
        tags: storeReport.tags || [],
        isMultiDept,
        departments: storeMultiDepts,
        resolutionNote: (storeReport as any).resolutionNote || null,
      }
    })
  }, [storeReports, users])

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchDepartment = filterDepartment === "all" || report.reporter.department === filterDepartment
      const matchStatus = filterStatus === "all" || report.status === filterStatus
      const matchPriority = filterPriority === "all" || report.priority === filterPriority
      return matchSearch && matchDepartment && matchStatus && matchPriority
    })
  }, [reports, searchQuery, filterDepartment, filterStatus, filterPriority])

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const paginatedReports = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredReports.slice(start, start + itemsPerPage)
  }, [filteredReports, page])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [searchQuery, filterDepartment, filterStatus, filterPriority])

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: reports.length,
      open: reports.filter(r => r.status === "open").length,
      inProgress: reports.filter(r => r.status === "in-progress").length,
      resolved: reports.filter(r => r.status === "resolved").length,
    }
  }, [reports])

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            ติดตามและจัดการปัญหาที่รายงานจากทุกฝ่าย
          </p>
        </div>

        {/* Stats Cards - ปรับปรุงใหม่ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-muted">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ทั้งหมด</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">รอดำเนินการ</p>
                  <p className="text-xl font-bold">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-yellow-500/10">
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ดำเนินการ</p>
                  <p className="text-xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">แก้ไขแล้ว</p>
                  <p className="text-xl font-bold">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหารายงาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value)}>
              <SelectTrigger className="w-full lg:w-[180px] h-10">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="ฝ่าย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกฝ่าย</SelectItem>
                <SelectItem value="Electrical">ช่างไฟฟ้า</SelectItem>
                <SelectItem value="Mechanical">ช่างเครื่องกล</SelectItem>
                <SelectItem value="Civil">ช่างโยธา</SelectItem>
                <SelectItem value="Technical">ช่างเทคนิค</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as Status | "all")}>
              <SelectTrigger className="w-full lg:w-[180px] h-10">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="open">รอดำเนินการ</SelectItem>
                <SelectItem value="in-progress">ดำเนินการ</SelectItem>
                <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as Priority | "all")}>
              <SelectTrigger className="w-full lg:w-[180px] h-10">
                <SelectValue placeholder="ความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกระดับ</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="medium">ปานกลาง</SelectItem>
                <SelectItem value="low">ต่ำ</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-muted p-1 rounded-lg gap-1 border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
                title="มุมมองกล่อง"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
                title="มุมมองตาราง"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Reports Content */}
        {viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReports.map((report) => {
              const deptColors = departmentColors[report.reporter.department] || departmentColors.Technical
              const PriorityIcon = priorityConfig[report.priority].icon

              return (
                <Card
                  key={report.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-gray-200 dark:border-gray-800"
                  onClick={() => {
                    setSelectedReport(report)
                    setIsDialogOpen(true)
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge className={`${statusConfig[report.status].color} text-[10px] sm:text-xs`}>
                          {statusConfig[report.status].label}
                        </Badge>
                        <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${priorityConfig[report.priority].bg}`}>
                          <PriorityIcon className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${priorityConfig[report.priority].color}`} />
                          <span className={`text-[10px] sm:text-xs font-medium ${priorityConfig[report.priority].color}`}>
                            {report.priority === "high" ? "สูง" : report.priority === "medium" ? "ปานกลาง" : "ต่ำ"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <CardTitle className="text-base sm:text-lg lg:text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                          {report.title}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm lg:text-base line-clamp-2 min-h-[40px]">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 ring-2 ring-background">
                          <AvatarImage src={report.reporter.avatar || ""} />
                          <AvatarFallback className="text-xs">{report.reporter.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold leading-none mb-1">{report.reporter.name}</p>
                          <p className={`text-[11px] ${deptColors.text} font-bold tracking-wide uppercase`}>
                            {report.reporter.department}
                          </p>
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {new Date(report.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit'
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[400px]">หัวข้อรายงาน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ความสำคัญ</TableHead>
                  <TableHead>แผนกที่เกี่ยวข้อง</TableHead>
                  <TableHead>ผู้แจ้ง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReports.map((report) => (
                  <TableRow
                    key={report.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => {
                      setSelectedReport(report)
                      setIsDialogOpen(true)
                    }}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm truncate max-w-[380px]">{report.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {new Date(report.createdAt).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[report.status].color} text-[10px]`}>
                        {statusConfig[report.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center w-fit gap-1 px-2 py-0.5 rounded-md ${priorityConfig[report.priority].bg}`}>
                        {React.createElement(priorityConfig[report.priority].icon, {
                          className: `h-3 w-3 ${priorityConfig[report.priority].color}`
                        })}
                        <span className={`text-[10px] font-bold ${priorityConfig[report.priority].color}`}>
                          {report.priority === "high" ? "สูง" : report.priority === "medium" ? "กลาง" : "ต่ำ"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold ${(departmentColors[report.reporter.department] || departmentColors.Technical).text}`}>
                        {report.reporter.department}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={report.reporter.avatar} />
                          <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{report.reporter.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Pagination Controls */}
        {filteredReports.length > 0 && (
          <div className="mt-8 flex items-center justify-between border-t py-4">
            <div className="text-sm text-muted-foreground">
              แสดงหน้า {(page - 1) * itemsPerPage + 1} ถึง {Math.min(page * itemsPerPage, filteredReports.length)} จากทั้งหมด {filteredReports.length} รายการ
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                หน้าก่อนหน้า
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-muted-foreground text-xs">...</span>}
                      <Button
                        variant={page === p ? "default" : "outline"}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        )}

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-center">ไม่พบรายงานที่ตรงกับการค้นหา</p>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">ลองปรับเงื่อนไขการค้นหาใหม่</p>
            </CardContent>
          </Card>
        )}

        {/* Report Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedReport && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={statusConfig[selectedReport.status].color}>
                          {statusConfig[selectedReport.status].label}
                        </Badge>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${priorityConfig[selectedReport.priority].bg}`}>
                          {React.createElement(priorityConfig[selectedReport.priority].icon, {
                            className: `h-3 w-3 ${priorityConfig[selectedReport.priority].color}`
                          })}
                          <span className={`text-xs font-medium ${priorityConfig[selectedReport.priority].color}`}>
                            {selectedReport.priority === "high" ? "สูง" : selectedReport.priority === "medium" ? "ปานกลาง" : "ต่ำ"}
                          </span>
                        </div>
                      </div>
                      <DialogTitle className="text-2xl mb-2">
                        {selectedReport.title}
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        {selectedReport.description}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <Separator className="my-4" />

                {/* Reporter Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedReport.reporter.avatar} />
                      <AvatarFallback>{selectedReport.reporter.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedReport.reporter.name}</p>
                      <p className={`text-sm ${(departmentColors[selectedReport.reporter.department] || departmentColors.Technical).text} font-semibold capitalize`}>
                        {selectedReport.reporter.department}
                      </p>
                    </div>
                  </div>

                  {/* Meta Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">วันที่รายงาน</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedReport.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* resolutionNote display */}
                  {selectedReport.resolutionNote && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">รายละเอียดการแก้ไข</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReport.resolutionNote}</p>
                    </div>
                  )}

                  {/* Multi-dept indicator */}
                  {selectedReport.isMultiDept && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary">
                      <Users className="h-3.5 w-3.5" />
                      <span>รายงานนี้เกี่ยวข้องกับ {selectedReport.departments?.join(", ") || selectedReport.tags.join(", ")} หลายแผนก</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {showResolutionForm ? (
                    <div className="space-y-3 p-4 rounded-lg border-2 border-green-500/30 bg-green-500/5">
                      <Label className="text-sm font-semibold text-green-700 dark:text-green-400">
                        รายละเอียดการแก้ไข <span className="text-red-400">*</span>
                      </Label>
                      <Textarea
                        placeholder="อธิบายสิ่งที่ได้ทำเพื่อแก้ไขปัญหานี้..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setShowResolutionForm(false)}>ยกเลิก</Button>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={isActioning || !resolutionNote.trim()}
                          onClick={async () => {
                            if (!resolutionNote.trim()) return
                            const storeReport = storeReports.find(r => r.id === selectedReport.id)
                            if (storeReport) {
                              setIsActioning(true)
                              await updateReport(storeReport.id, {
                                status: "resolved",
                                resolutionNote,
                                updatedAt: new Date().toISOString()
                              })
                              setIsActioning(false)
                            }
                            setIsDialogOpen(false)
                            setShowResolutionForm(false)
                            setResolutionNote("")
                          }}
                        >
                          {isActioning ? (
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          ยืนยันการแก้ไข
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 pt-3">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ปิด</Button>
                      {selectedReport.status === "open" && (
                        <Button
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          disabled={isActioning}
                          onClick={async () => {
                            const storeReport = storeReports.find(r => r.id === selectedReport.id)
                            if (storeReport) {
                              setIsActioning(true)
                              await updateReport(storeReport.id, {
                                status: "in_progress",
                                updatedAt: new Date().toISOString()
                              })
                              setIsActioning(false)
                            }
                            setIsDialogOpen(false)
                          }}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          กำลังดำเนินการ
                        </Button>
                      )}
                      {selectedReport.status === "in-progress" && (
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => setShowResolutionForm(true)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          แก้ไขแล้ว
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}