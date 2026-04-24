"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  ArrowRight,
  Building2,
  Users,
  FileText,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useReportStore, type Report } from "@/stores/features/reportStore"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Priority = "high" | "medium" | "low"
type Status = "open" | "in_progress" | "resolved" | "closed"

const DEPARTMENTS = [
  { value: "Electrical", label: "แผนกช่างไฟ (Electrical)", color: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-300" },
  { value: "Mechanical", label: "แผนกช่างกล (Mechanical)", color: "bg-slate-500", text: "text-slate-700 dark:text-slate-300" },
  { value: "Technical", label: "แผนกช่างเทคนิค (Technical)", color: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300" },
  { value: "Civil", label: "แผนกช่างโยธา (Civil)", color: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
]

// Mapping ภาษาไทย -> อังกฤษ
const DEPT_NORMALIZE: Record<string, string> = {
  "ไฟฟ้า": "Electrical",
  "ช่างไฟ": "Electrical",
  "เครื่องกล": "Mechanical",
  "ช่างกล": "Mechanical",
  "เทคนิค": "Technical",
  "ช่างเทคนิค": "Technical",
  "โยธา": "Civil",
  "ช่างโยธา": "Civil",
}

const getNormalizedDept = (dept: string) => DEPT_NORMALIZE[dept] || dept

const priorityConfig: Record<Priority, { icon: React.ComponentType<{ className?: string }>, color: string, bg: string }> = {
  high: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
  medium: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  low: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
}

const statusConfig: Record<Status, { label: string, color: string }> = {
  open: { label: "รอดำเนินการ", color: "bg-blue-400" },
  in_progress: { label: "กำลังดำเนินการ", color: "bg-yellow-400" },
  resolved: { label: "แก้ไขแล้ว", color: "bg-green-400" },
  closed: { label: "ปิด", color: "bg-gray-400" },
}

// Map priority from store to display
function mapPriority(p?: string | null): Priority {
  if (p === "urgent" || p === "high") return "high"
  if (p === "low") return "low"
  return "medium"
}

function mapStatus(s?: string | null): Status {
  if (s === "in_progress") return "in_progress"
  if (s === "resolved") return "resolved"
  if (s === "closed") return "closed"
  return "open"
}

// Resolve dialog type
type DialogMode = "in_progress" | "resolve" | "forward" | null

export default function LeadReportPage() {
  const { reports, isHydrated, fetchReports, markInProgress, resolveReport, forwardReport } = useReportStore()
  const { data: session } = useSession()
  const currentUser = session?.user

  // Normalize แผนกของคนล็อกอินเสมอ
  const leadDept = useMemo(() => getNormalizedDept(currentUser?.department || ""), [currentUser])

  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all")
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)

  // Form states for resolution/forward
  const [resolutionNote, setResolutionNote] = useState("")
  const [forwardDepts, setForwardDepts] = useState<string[]>([])
  const [forwardNote, setForwardNote] = useState("")
  const [isActioning, setIsActioning] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  // Fetch reports filtered by this lead's department
  useEffect(() => {
    if (leadDept) {
      fetchReports(leadDept)
    } else {
      // ถ้าไม่มีแผนก ให้ดึงแบบระบุชื่อที่ไม่มีอยู่จริงเพื่อให้ได้ลิสต์ว่าง มากกว่าจะได้ทั้งหมด
      fetchReports("unassigned_no_access")
    }
  }, [leadDept, fetchReports])

  // Filter ฝั่ง client
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      const status = mapStatus(r.status)
      const priority = mapPriority(r.priority)
      const matchStatus = filterStatus === "all" || status === filterStatus
      const matchPriority = filterPriority === "all" || priority === filterPriority
      return matchSearch && matchStatus && matchPriority
    })
  }, [reports, searchQuery, filterStatus, filterPriority])

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const paginatedReports = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredReports.slice(start, start + itemsPerPage)
  }, [filteredReports, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, filterStatus, filterPriority])

  // Stats
  const stats = useMemo(() => ({
    total: reports.length,
    open: reports.filter(r => r.status === "open").length,
    inProgress: reports.filter(r => r.status === "in_progress").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  }), [reports])

  const openDialog = (report: Report, mode: DialogMode) => {
    setSelectedReport(report)
    setDialogMode(mode)
    setResolutionNote("")
    setForwardDepts([])
    setForwardNote("")
  }

  const closeDialog = () => {
    setSelectedReport(null)
    setDialogMode(null)
    setResolutionNote("")
    setForwardDepts([])
    setForwardNote("")
  }

  // กดกำลังดำเนินการ
  const handleMarkInProgress = async () => {
    if (!selectedReport) return
    setIsActioning(true)
    try {
      await markInProgress(selectedReport.id)
      toast.success("เปลี่ยนสถานะเป็น 'กำลังดำเนินการ' แล้ว")
      closeDialog()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    }
    setIsActioning(false)
  }

  // กดแก้ไขแล้ว — ต้องกรอก resolutionNote ก่อน
  const handleResolve = async () => {
    if (!selectedReport || !resolutionNote.trim()) {
      toast.error("กรุณากรอกรายละเอียดการแก้ไขก่อน")
      return
    }
    setIsActioning(true)
    try {
      await resolveReport(selectedReport.id, resolutionNote, leadDept)
      toast.success("บันทึกการแก้ไขเรียบร้อยแล้ว!")
      closeDialog()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    }
    setIsActioning(false)
  }

  // ส่งต่อ
  const handleForward = async () => {
    if (!selectedReport || forwardDepts.length === 0) {
      toast.error("กรุณาเลือกแผนกที่จะส่งต่อ")
      return
    }
    if (!forwardNote.trim()) {
      toast.error("กรุณากรอกหมายเหตุการส่งต่อ")
      return
    }
    setIsActioning(true)
    try {
      await forwardReport(selectedReport.id, forwardDepts, forwardNote)
      toast.success(`ส่งต่อไปยัง ${forwardDepts.length} แผนกแล้ว!`)
      closeDialog()
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    }
    setIsActioning(false)
  }

  const getDeptInfo = (deptKey: string) => DEPARTMENTS.find(d => d.value === deptKey)
  const myDeptInfo = getDeptInfo(leadDept)

  // แผนกอื่นที่ยังไม่ได้ส่งต่อ (สำหรับ forward)
  const getForwardableDepts = (report: Report) => {
    const allDepts: string[] = report.departments || report.tags || []
    const alreadyForwarded: string[] = report.forwardedTo || []
    return allDepts.filter(d => d !== leadDept && !alreadyForwarded.includes(d))
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!leadDept) {
    return (
      <div className="container mx-auto py-12 px-6">
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <p className="text-xl font-bold mb-2">ไม่พบข้อมูลแผนกของคุณ</p>
            <p className="text-muted-foreground text-center max-w-md">
              บัญชีของคุณยังไม่ได้ระบุฝ่าย/แผนกที่รับผิดชอบ กรุณาติดต่อ Admin เพื่ออัปเดตข้อมูลแผนกก่อนเข้าใช้งานหน้ารายงาน
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl sm:text-4xl font-bold">รายงานปัญหา</h1>
            {myDeptInfo && (
              <Badge className={cn("text-sm px-3 py-1", myDeptInfo.color)}>
                {myDeptInfo.value}
              </Badge>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            รายงานที่ส่งมายังแผนกของคุณ — กด{" "}
            <strong>กำลังดำเนินการ</strong> หรือ <strong>แก้ไขแล้ว</strong> เพื่ออัปเดตสถานะ
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "ทั้งหมด", value: stats.total, icon: FileText, color: "text-muted-foreground", bg: "bg-muted" },
            { label: "รอดำเนินการ", value: stats.open, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "ดำเนินการอยู่", value: stats.inProgress, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
            { label: "แก้ไขแล้ว", value: stats.resolved, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหารายงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as Status | "all")}>
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="open">รอดำเนินการ</SelectItem>
              <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
              <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as Priority | "all")}>
            <SelectTrigger className="w-full sm:w-[180px] h-10">
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

        {/* Reports Content */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
              <p className="text-lg font-medium mb-1">ไม่มีรายงานในขณะนี้</p>
              <p className="text-sm text-muted-foreground">ยังไม่มีรายงานที่ส่งมายังแผนก {leadDept}</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReports.map((report) => {
              const status = mapStatus(report.status)
              const priority = mapPriority(report.priority)
              const PriorityIcon = priorityConfig[priority].icon
              const depts: string[] = report.departments || report.tags || []
              const isMulti = report.isMultiDept || depts.length > 1
              const resolvedDepts: string[] = report.resolvedDepts || []
              const myResolved = resolvedDepts.some(d => getNormalizedDept(d) === leadDept)

              return (
                <Card
                  key={report.id}
                  className={cn(
                    "group hover:shadow-lg transition-all cursor-pointer border-2 overflow-hidden",
                    isMulti ? "border-primary/20 hover:border-primary/50" : "border-transparent hover:border-gray-200 dark:hover:border-gray-800",
                    myResolved && "opacity-75"
                  )}
                  onClick={() => openDialog(report, "in_progress")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className={statusConfig[status].color}>
                          {statusConfig[status].label}
                        </Badge>
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md", priorityConfig[priority].bg)}>
                          <PriorityIcon className={cn("h-3 w-3", priorityConfig[priority].color)} />
                          <span className={cn("text-xs font-medium", priorityConfig[priority].color)}>
                            {priority === "high" ? "สูง" : priority === "medium" ? "ปานกลาง" : "ต่ำ"}
                          </span>
                        </div>
                        {isMulti && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-primary/50 text-primary bg-primary/5">
                            <Users className="h-2.5 w-2.5" />
                            หลายแผนก
                          </Badge>
                        )}
                        {myResolved && (
                          <Badge className="bg-green-500 text-[10px] text-white">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            แผนกคุณแก้แล้ว
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <CardTitle className="text-base sm:text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                          {report.title}
                        </CardTitle>
                        <CardDescription className="text-sm line-clamp-2 min-h-[40px]">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 ring-2 ring-background">
                          <AvatarImage src={report.reporter.imageUrl || ""} />
                          <AvatarFallback className="text-xs">{report.reporter.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold leading-none mb-1">{report.reporter.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{report.reporter.department || "Employee"}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {new Date(report.createdAt).toLocaleDateString('th-TH', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: '2-digit' 
                        })}
                      </span>
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
                  <TableHead className="w-[350px]">หัวข้อรายงาน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ความสำคัญ</TableHead>
                  <TableHead>ผู้แจ้ง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReports.map((report) => {
                  const status = mapStatus(report.status)
                  const priority = mapPriority(report.priority)
                  const depts: string[] = report.departments || report.tags || []
                  const isMulti = report.isMultiDept || depts.length > 1
                  const resolvedDepts: string[] = report.resolvedDepts || []
                  const myResolved = resolvedDepts.some(d => getNormalizedDept(d) === leadDept)

                  return (
                    <TableRow 
                      key={report.id} 
                      className={cn("cursor-pointer hover:bg-muted/30", myResolved && "bg-green-500/5")}
                      onClick={() => openDialog(report, "in_progress")}
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate max-w-[280px]">{report.title}</span>
                            {isMulti && (
                              <span title="หลายแผนก">
                                <Users className="h-3 w-3 text-primary" />
                              </span>
                            )}
                            {myResolved && (
                              <span title="แผนกคุณแก้แล้ว">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(statusConfig[status].color, "text-[10px]")}>
                          {statusConfig[status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={cn("flex items-center w-fit gap-1 px-2 py-0.5 rounded-md", priorityConfig[priority].bg)}>
                          {React.createElement(priorityConfig[priority].icon, {
                            className: cn("h-3 w-3", priorityConfig[priority].color)
                          })}
                          <span className={cn("text-[10px] font-bold", priorityConfig[priority].color)}>
                            {priority === "high" ? "สูง" : priority === "medium" ? "กลาง" : "ต่ำ"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={report.reporter.imageUrl || ""} />
                            <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate max-w-[100px]">{report.reporter.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

        {/* ============ DETAIL DIALOG ============ */}
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedReport && (() => {
              const status = mapStatus(selectedReport.status)
              const priority = mapPriority(selectedReport.priority)
              const depts: string[] = selectedReport.departments || selectedReport.tags || []
              const isMulti = selectedReport.isMultiDept || depts.length > 1
              const resolvedDepts: string[] = selectedReport.resolvedDepts || []
              const myResolved = resolvedDepts.some(d => getNormalizedDept(d) === leadDept)
              const forwardableDepts = getForwardableDepts(selectedReport)
              const forwardedTo: string[] = selectedReport.forwardedTo || []

              return (
                <>
                  <DialogHeader>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={statusConfig[status].color}>
                        {statusConfig[status].label}
                      </Badge>
                      {isMulti && (
                        <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                          <Users className="h-3 w-3" />
                          หลายแผนก ({depts.length} แผนก)
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-xl">{selectedReport.title}</DialogTitle>
                    <DialogDescription className="text-sm">{selectedReport.description}</DialogDescription>
                  </DialogHeader>

                  <Separator />

                  {/* Reporter & Meta */}
                  <div className="space-y-4 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedReport.reporter.imageUrl || ""} />
                        <AvatarFallback>{selectedReport.reporter.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{selectedReport.reporter.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedReport.reporter.department || "Employee"}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedReport.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Department badges */}
                    {depts.length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> แผนกที่เกี่ยวข้อง
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {depts.map(d => {
                            const info = getDeptInfo(d)
                            const isDone = resolvedDepts.includes(d)
                            const isForwarded = forwardedTo.includes(d)
                            return (
                              <div key={d} className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
                                d === leadDept ? "border-primary bg-primary/10" : "border-muted bg-muted/30"
                              )}>
                                <div className={cn("w-2 h-2 rounded-full", info?.color)} />
                                {d}
                                {isDone && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                {!isDone && isForwarded && <ArrowRight className="h-3 w-3 text-blue-500" />}
                                {d === leadDept && <span className="text-primary text-[10px]">(คุณ)</span>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Resolution note if exists */}
                    {selectedReport.resolutionNote && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">รายละเอียดการแก้ไข</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReport.resolutionNote}</p>
                      </div>
                    )}

                    {/* Forward note if exists */}
                    {selectedReport.forwardNote && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">หมายเหตุการส่งต่อ</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReport.forwardNote}</p>
                      </div>
                    )}

                    <Separator />

                    {/* ===== ACTION AREA ===== */}
                    {/* Step 1: กำลังดำเนินการ — เฉพาะตอน status = open */}
                    {status === "open" && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold">การดำเนินการ</p>
                        <Button
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                          onClick={handleMarkInProgress}
                          disabled={isActioning}
                        >
                          {isActioning ? (
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black border-t-transparent" />
                          ) : (
                            <Clock className="h-4 w-4 mr-2" />
                          )}
                          กำลังดำเนินการ
                        </Button>
                      </div>
                    )}

                    {/* Step 2: แก้ไขแล้ว + ส่งต่อ — เฉพาะตอน in_progress และยังไม่ได้แก้ */}
                    {status === "in_progress" && !myResolved && (
                      <div className="space-y-4">
                        <p className="text-sm font-semibold">การดำเนินการ</p>

                        {/* Resolve Form */}
                        {dialogMode === "resolve" || dialogMode === "in_progress" ? (
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
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setDialogMode("in_progress")}
                              >
                                ยกเลิก
                              </Button>
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleResolve}
                                disabled={isActioning || !resolutionNote.trim()}
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
                        ) : dialogMode === "forward" ? (
                          /* Forward Form */
                          <div className="space-y-3 p-4 rounded-lg border-2 border-blue-500/30 bg-blue-500/5">
                            <Label className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                              เลือกแผนกที่จะส่งต่อ <span className="text-red-400">*</span>
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              {forwardableDepts.map(dept => {
                                const info = getDeptInfo(dept)
                                const isSelected = forwardDepts.includes(dept)
                                return (
                                  <button
                                    key={dept}
                                    type="button"
                                    onClick={() => setForwardDepts(prev =>
                                      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
                                    )}
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-lg border-2 text-left transition-all text-sm",
                                      isSelected
                                        ? "border-blue-500 bg-blue-500/10"
                                        : "border-muted bg-muted/30 hover:border-blue-300"
                                    )}
                                  >
                                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", info?.color)} />
                                    <span className="text-xs">{dept}</span>
                                  </button>
                                )
                              })}
                            </div>
                            {forwardableDepts.length === 0 && (
                              <p className="text-xs text-muted-foreground">ไม่มีแผนกอื่นให้ส่งต่อ</p>
                            )}
                            <Label className="text-sm font-semibold">หมายเหตุการส่งต่อ <span className="text-red-400">*</span></Label>
                            <Textarea
                              placeholder="อธิบายสิ่งที่ทำแล้วและสิ่งที่ต้องการให้แผนกอื่นดำเนินการต่อ..."
                              value={forwardNote}
                              onChange={(e) => setForwardNote(e.target.value)}
                              className="min-h-[80px] resize-none"
                            />
                            <div className="flex gap-2">
                              <Button variant="outline" className="flex-1" onClick={() => setDialogMode("in_progress")}>
                                ยกเลิก
                              </Button>
                              <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleForward}
                                disabled={isActioning || forwardDepts.length === 0 || !forwardNote.trim()}
                              >
                                {isActioning ? (
                                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                )}
                                ส่งต่อ
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Default 2-button view */
                          <div className="flex gap-3">
                            {/* ปุ่ม แก้ไขแล้ว */}
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setDialogMode("resolve")}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {isMulti ? "แก้ไขแล้ว (ส่วนของฉัน)" : "แก้ไขแล้ว"}
                            </Button>
                            {/* ปุ่ม ส่งต่อ — เฉพาะ multi-dept */}
                            {isMulti && forwardableDepts.length > 0 && (
                              <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => setDialogMode("forward")}
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                ส่งต่อแผนกอื่น
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Done state */}
                    {(status === "resolved" || myResolved) && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          แผนก{leadDept}ได้ทำการแก้ไขเรียบร้อยแล้ว
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={closeDialog}>ปิด</Button>
                    </div>
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
