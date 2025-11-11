"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter,
  Search,
  Calendar,
  User,
  Tag,
  MessageSquare
} from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Types
type Department = "engineering" | "design" | "product" | "qa" | "customer"
type Priority = "high" | "medium" | "low"
type Status = "open" | "in-progress" | "resolved" | "closed"

interface Reporter {
  name: string
  department: Department
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
  tags: string[]
}

// กำหนดสีสำหรับแต่ละฝ่าย
const departmentColors: Record<Department, {
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
  }
}

// ตัวอย่างข้อมูล
const mockReports: Report[] = [
  {
    id: "RPT-001",
    title: "Login page crashes on Safari browser",
    description: "When users try to login using Safari on iOS, the page becomes unresponsive after entering credentials.",
    reporter: {
      name: "Somchai Janprasert",
      department: "qa",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Somchai"
    },
    priority: "high",
    status: "open",
    createdAt: "2025-11-03T10:30:00",
    tags: ["frontend", "mobile", "safari"]
  },
  {
    id: "RPT-002",
    title: "API response time is too slow",
    description: "The /api/users endpoint takes more than 5 seconds to respond during peak hours.",
    reporter: {
      name: "Jane Smith",
      department: "engineering",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane"
    },
    priority: "medium",
    status: "in-progress",
    createdAt: "2025-11-02T14:20:00",
    tags: ["backend", "performance", "api"]
  },
  {
    id: "RPT-003",
    title: "Button color doesn't match design system",
    description: "Primary buttons on the dashboard are using #0066FF instead of #0052CC as specified in Figma.",
    reporter: {
      name: "Sarah Williams",
      department: "design",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    priority: "low",
    status: "open",
    createdAt: "2025-11-01T09:15:00",
    tags: ["ui", "design-system"]
  },
  {
    id: "RPT-004",
    title: "Users unable to upload files larger than 5MB",
    description: "Customer reported that they cannot upload profile pictures larger than 5MB, receiving a generic error message.",
    reporter: {
      name: "Customer Support",
      department: "customer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Support"
    },
    priority: "high",
    status: "open",
    createdAt: "2025-11-03T16:45:00",
    tags: ["file-upload", "customer-issue"]
  },
  {
    id: "RPT-005",
    title: "Missing validation on email field",
    description: "Email input field accepts invalid email formats without showing error messages.",
    reporter: {
      name: "Mike Chen",
      department: "product",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike"
    },
    priority: "medium",
    status: "resolved",
    createdAt: "2025-10-30T11:00:00",
    tags: ["validation", "forms"]
  }
]

const priorityConfig: Record<Priority, { 
  icon: React.ComponentType<{ className?: string }>, 
  color: string, 
  bg: string 
}> = {
  high: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
  medium: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  low: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" }
}

const statusConfig: Record<Status, { label: string, color: string }> = {
  open: { label: "รอดำเนินการ", color: "bg-blue-500" },
  "in-progress": { label: "กำลังดำเนินการ", color: "bg-yellow-500" },
  resolved: { label: "แก้ไขแล้ว", color: "bg-green-500" },
  closed: { label: "ปิด", color: "bg-gray-500" }
}

export default function ReportPage() {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterDepartment, setFilterDepartment] = useState<Department | "all">("all")
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [comment, setComment] = useState("")

  const filteredReports = mockReports.filter(report => {
    const matchSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       report.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchDepartment = filterDepartment === "all" || report.reporter.department === filterDepartment
    const matchStatus = filterStatus === "all" || report.status === filterStatus
    return matchSearch && matchDepartment && matchStatus
  })

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">รายงานปัญหา</h1>
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
                  <p className="text-xl font-bold">{mockReports.length}</p>
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
                  <p className="text-xl font-bold">
                    {mockReports.filter(r => r.status === "open").length}
                  </p>
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
                  <p className="text-xl font-bold">
                    {mockReports.filter(r => r.status === "in-progress").length}
                  </p>
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
                  <p className="text-xl font-bold">
                    {mockReports.filter(r => r.status === "resolved").length}
                  </p>
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
            <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value as Department | "all")}>
              <SelectTrigger className="w-full lg:w-[180px] h-10">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="ฝ่าย" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกฝ่าย</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
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
          </div>
        </div>

        {/* Reports List / Reports box */}
        <div className="grid sm:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const deptColors = departmentColors[report.reporter.department]
            const PriorityIcon = priorityConfig[report.priority].icon

            return (
              <Card 
                key={report.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedReport(report)
                  setIsDialogOpen(true)
                }}
              >
                <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] sm:text-xs px-1.5 sm:px-2">
                        {report.id}
                      </Badge>
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
                    <div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl mb-1.5 sm:mb-2 leading-snug">
                        {report.title}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm lg:text-base line-clamp-2 sm:line-clamp-none">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <Separator className="mb-3 sm:mb-4" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${deptColors.bg}`}>
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                          <AvatarImage src={report.reporter.avatar} />
                          <AvatarFallback className="text-xs sm:text-sm">{report.reporter.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium leading-tight">{report.reporter.name}</p>
                        <p className={`text-[10px] sm:text-xs ${deptColors.text} font-semibold capitalize`}>
                          {report.reporter.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {report.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString('th-TH', {
                          year: '2-digit',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

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
                        <Badge variant="outline" className="font-mono">
                          {selectedReport.id}
                        </Badge>
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
                    <div className={`p-2 rounded-lg ${departmentColors[selectedReport.reporter.department].bg}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedReport.reporter.avatar} />
                        <AvatarFallback>{selectedReport.reporter.name[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="font-medium">{selectedReport.reporter.name}</p>
                      <p className={`text-sm ${departmentColors[selectedReport.reporter.department].text} font-semibold capitalize`}>
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
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">ผู้รับผิดชอบ</p>
                        <p className="text-sm font-medium">ยังไม่ได้กำหนด</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">แท็ก</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Comments Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">ความคิดเห็น</p>
                    </div>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="เพิ่มความคิดเห็น..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setComment("")}>
                          ยกเลิก
                        </Button>
                        <Button onClick={() => {
                          // Handle comment submission
                          console.log("Comment submitted:", comment)
                          setComment("")
                        }}>
                          ส่งความคิดเห็น
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    <Button variant="outline" size="sm">
                      แก้ไขรายงาน
                    </Button>
                    <Button variant="outline" size="sm">
                      มอบหมายงาน
                    </Button>
                    <Button variant="outline" size="sm">
                      เปลี่ยนสถานะ
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}