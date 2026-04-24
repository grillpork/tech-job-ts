"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Send, Building2, Users } from "lucide-react"
import { useReportStore } from "@/stores/features/reportStore"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { notificationHelpers } from "@/stores/notificationStore"
import { cn } from "@/lib/utils"

type Priority = "high" | "medium" | "low"

const DEPARTMENTS = [
  { value: "Electrical", label: "แผนกช่างไฟ (Electrical)", color: "bg-yellow-500" },
  { value: "Mechanical", label: "แผนกช่างกล (Mechanical)", color: "bg-slate-500" },
  { value: "Technical", label: "แผนกช่างเทคนิค (Technical)", color: "bg-cyan-500" },
  { value: "Civil", label: "แผนกช่างโยธา (Civil)", color: "bg-amber-500" },
]

export default function CreateReportPage() {
  const { addReport } = useReportStore()
  const { data: session } = useSession()
  const currentUser = session?.user

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority | "">("")
  // single dept
  const [department, setDepartment] = useState<string>("")
  // multi dept
  const [isMultiDept, setIsMultiDept] = useState(false)
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ดึงแผนกจาก currentUser โดยอัตโนมัติ (single mode)
  React.useEffect(() => {
    if (currentUser?.department && !department && !isMultiDept) {
      setDepartment(currentUser.department)
    }
  }, [currentUser, department, isMultiDept])

  // Toggle department ใน multi-select
  const toggleDept = (dept: string) => {
    setSelectedDepts(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    )
  }

  const getDepartmentLabel = (dept: string): string => {
    return DEPARTMENTS.find(d => d.value === dept)?.label || dept
  }

  const getEffectiveDepts = (): string[] => {
    if (isMultiDept) return selectedDepts
    return department ? [department] : []
  }

  const isFormValid = () => {
    if (!title || !description || !priority) return false
    if (isMultiDept) return selectedDepts.length >= 2
    return !!department
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid()) {
      if (isMultiDept && selectedDepts.length < 2) {
        toast.error("กรุณาเลือกอย่างน้อย 2 แผนก สำหรับรายงานหลายแผนก")
      } else {
        toast.error("กรุณากรอกข้อมูลให้ครบถ้วน")
      }
      return
    }

    if (!currentUser) {
      toast.error("ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่")
      return
    }

    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    const priorityMap: Record<Priority, "low" | "medium" | "high" | "urgent"> = {
      low: "low",
      medium: "medium",
      high: "urgent",
    }

    const effectiveDepts = getEffectiveDepts()

    const newReport = {
      title,
      description,
      type: "incident" as const,
      status: "open" as const,
      updatedAt: null,
      reporter: {
        id: currentUser.id,
        name: currentUser.name || "Unknown",
      },
      assignee: null,
      priority: priorityMap[priority as Priority] || "medium",
      tags: effectiveDepts, // backward compat
      departments: effectiveDepts,
      isMultiDept,
    }

    const result = await addReport(newReport)

    if (result) {
      notificationHelpers.reportSubmitted(
        newReport.title,
        newReport.reporter.name,
        result.id
      )
      toast.success(
        isMultiDept
          ? `ส่งรายงานไปยัง ${effectiveDepts.length} แผนกสำเร็จ!`
          : `ส่งรายงานไปยัง ${getDepartmentLabel(effectiveDepts[0])} สำเร็จ!`
      )
    } else {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่")
    }

    setIsSubmitting(false)
    setTitle("")
    setDescription("")
    setPriority("")
    setSelectedDepts([])
    // ไม่ reset department เพราะส่วนใหญ่พนักงานจะอยู่แผนกเดิม
  }

  const effectiveDepts = getEffectiveDepts()

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto py-6 px-6 max-w-[1400px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">รายงานปัญหา</h1>
          <p className="text-base text-muted-foreground">
            กรอกข้อมูลเพื่อส่งรายงานปัญหาไปยัง Lead แผนกที่เกี่ยวข้อง
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section - Left */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  สร้างรายงานปัญหาใหม่
                </CardTitle>
                <CardDescription>
                  กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้ทีมงานสามารถดำเนินการได้อย่างรวดเร็ว
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* หัวเรื่อง */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      หัวเรื่อง <span className="text-orange-400">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="เช่น ระบบไฟฟ้าขัดข้องที่ชั้น 3"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* คำอธิบาย */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      คำอธิบายปัญหา <span className="text-orange-400">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="อธิบายรายละเอียดของปัญหาที่พบ ยิ่งละเอียดมากยิ่งดี..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="min-h-[160px] resize-none"
                    />
                  </div>

                  {/* Multi-dept toggle */}
                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border-2 transition-colors",
                    isMultiDept
                      ? "border-primary bg-primary/5"
                      : "border-muted bg-muted/30"
                  )}>
                    <Checkbox
                      id="isMultiDept"
                      checked={isMultiDept}
                      onCheckedChange={(checked) => {
                        setIsMultiDept(!!checked)
                        setSelectedDepts([])
                        if (!checked && currentUser?.department) {
                          setDepartment(currentUser.department)
                        }
                      }}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="isMultiDept"
                        className="text-sm font-semibold cursor-pointer flex items-center gap-2"
                      >
                        <Users className="h-4 w-4 text-primary" />
                        ปัญหานี้เกี่ยวข้องกับหลายแผนก
                      </label>
                      <p className="text-xs text-muted-foreground">
                        เปิดตัวเลือกนี้เมื่อปัญหาต้องการความร่วมมือจากหลายแผนกพร้อมกัน
                      </p>
                    </div>
                  </div>

                  {/* Department Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {isMultiDept ? "เลือกแผนกที่เกี่ยวข้อง" : "แผนกที่รับผิดชอบ"}
                      <span className="text-orange-400">*</span>
                      {isMultiDept && (
                        <span className="text-xs text-muted-foreground font-normal">
                          (เลือกอย่างน้อย 2 แผนก)
                        </span>
                      )}
                    </Label>

                    {isMultiDept ? (
                      /* Multi-select checkboxes */
                      <div className="grid grid-cols-2 gap-2">
                        {DEPARTMENTS.map((dept) => {
                          const isSelected = selectedDepts.includes(dept.value)
                          return (
                            <button
                              key={dept.value}
                              type="button"
                              onClick={() => toggleDept(dept.value)}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all text-sm font-medium",
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-muted bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "w-3 h-3 rounded-full flex-shrink-0",
                                dept.color
                              )} />
                              <span className="text-xs leading-tight">{dept.label}</span>
                              {isSelected && (
                                <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      /* Single select */
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger id="department" className="w-full">
                          <SelectValue placeholder="เลือกฝ่าย/แผนก" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", dept.color)} />
                                {dept.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm font-medium">
                      ระดับความสำคัญ <span className="text-orange-400">*</span>
                    </Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                      <SelectTrigger id="priority" className="w-full">
                        <SelectValue placeholder="เลือกระดับความสำคัญ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-400">สูง</Badge>
                            <span className="text-xs text-muted-foreground">- ปัญหาร้ายแรง</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-400">ปานกลาง</Badge>
                            <span className="text-xs text-muted-foreground">- ปานกลาง</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-400">ต่ำ</Badge>
                            <span className="text-xs text-muted-foreground">- ไม่เร่งด่วน</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setTitle("")
                        setDescription("")
                        setPriority("")
                        setSelectedDepts([])
                      }}
                    >
                      ล้างฟอร์ม
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:flex-1"
                      disabled={isSubmitting || !isFormValid()}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          กำลังส่ง...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          ส่งรายงาน
                          {effectiveDepts.length > 0 && (
                            <Badge className="ml-2 bg-white/20 text-white text-xs">
                              {effectiveDepts.length} แผนก
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section - Right */}
          <div>
            <div className="space-y-6">
              {/* Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ตัวอย่างการแสดงผล</CardTitle>
                  <CardDescription className="text-xs">
                    ดูตัวอย่างว่ารายงานของคุณจะแสดงผลอย่างไร
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(title || description || effectiveDepts.length > 0 || priority) ? (
                    <Card className="bg-muted/50 border-2">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {priority && (
                              <Badge className={
                                priority === "high" ? "bg-orange-400" :
                                  priority === "medium" ? "bg-yellow-400" :
                                    "bg-green-400"
                              }>
                                {priority === "high" ? "สูง" : priority === "medium" ? "ปานกลาง" : "ต่ำ"}
                              </Badge>
                            )}
                            {isMultiDept && selectedDepts.length > 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <Users className="h-3 w-3" />
                                หลายแผนก ({selectedDepts.length})
                              </Badge>
                            )}
                          </div>
                          {title && (
                            <p className="font-semibold text-base leading-tight break-words">{title}</p>
                          )}
                          {description && (
                            <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{description}</p>
                          )}
                          {effectiveDepts.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {effectiveDepts.map(dept => {
                                const d = DEPARTMENTS.find(x => x.value === dept)
                                return (
                                  <div key={dept} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border text-xs font-medium">
                                    <div className={cn("w-2 h-2 rounded-full", d?.color)} />
                                    {dept}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">เริ่มกรอกข้อมูลเพื่อดูตัวอย่าง</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Department routing info */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    รายงานจะถูกส่งไปยัง
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {effectiveDepts.length > 0 ? (
                    <div className="space-y-2">
                      {effectiveDepts.map(dept => {
                        const d = DEPARTMENTS.find(x => x.value === dept)
                        return (
                          <div key={dept} className="flex items-center gap-2 text-sm">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", d?.color)} />
                            <span className="font-medium">Lead</span>
                            <span className="text-muted-foreground">{d?.label || dept}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">เลือกแผนกเพื่อดูว่าจะส่งถึงใคร</p>
                  )}
                </CardContent>
              </Card>

              {/* Help Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">💡 คำแนะนำ</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="text-primary mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">แผนกเดียว:</strong>
                        <p className="mt-1">Lead ของแผนกนั้นจะได้รับรายงานและดำเนินการเอง</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-primary mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">หลายแผนก:</strong>
                        <p className="mt-1">Lead ทุกแผนกที่เลือกจะได้รับรายงาน และสามารถส่งต่อรายละเอียดให้กันได้</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-primary mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">ระดับความสำคัญ:</strong>
                        <div className="mt-1 space-y-1">
                          <span className="gap-2 flex items-center"><span className="bg-orange-400 w-2 rounded-full h-2 inline-block"></span> ระบบใช้งานไม่ได้, ส่งผลกระทบโดยตรง</span>
                          <span className="gap-2 flex items-center"><span className="bg-yellow-400 w-2 rounded-full h-2 inline-block"></span> มีวิธีแก้ชั่วคราว, ส่งผลกระทบบางส่วน</span>
                          <span className="gap-2 flex items-center"><span className="bg-green-400 w-2 rounded-full h-2 inline-block"></span> ปัญหาเล็กน้อย, ไม่เร่งด่วน</span>
                        </div>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}