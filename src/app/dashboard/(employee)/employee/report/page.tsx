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
import { AlertCircle, Send } from "lucide-react"
import { useReportStore } from "@/stores/features/reportStore"
import { useSession } from "next-auth/react" // ✅ Changed to NextAuth
import { toast } from "sonner"
import { notificationHelpers } from "@/stores/notificationStore"

type Priority = "high" | "medium" | "low"

export default function CreateReportPage() {
  const { addReport } = useReportStore()
  const { data: session } = useSession() // ✅ Use useSession
  const currentUser = session?.user // ✅ Map to existing variable name

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ดึงแผนกจาก currentUser โดยอัตโนมัติ
  const userDepartment = currentUser?.department || null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !priority) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    if (!currentUser) {
      toast.error("ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่")
      return
    }

    if (!userDepartment) {
      toast.error("ไม่พบข้อมูลแผนก กรุณาตรวจสอบข้อมูลผู้ใช้")
      return
    }

    setIsSubmitting(true)

    // จำลองการส่งข้อมูล
    await new Promise(resolve => setTimeout(resolve, 1400))

    // Map priority from form to store format
    const priorityMap: Record<Priority, "low" | "medium" | "high" | "urgent"> = {
      low: "low",
      medium: "medium",
      high: "urgent", // Map high to urgent for better priority handling
    }

    // Map department to report type (default to incident)
    // ใช้แผนกจริงจากระบบ: Electrical, Mechanical, Technical, Civil
    const typeMap: Record<string, "bug" | "request" | "incident" | "improvement"> = {
      Electrical: "bug",
      Mechanical: "incident",
      Technical: "request",
      Civil: "improvement",
    }

    const newReport = {
      id: crypto.randomUUID(),
      title,
      description,
      type: typeMap[userDepartment] || "incident",
      status: "open" as const,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      reporter: {
        id: currentUser.id,
        name: currentUser.name || "Unknown", // Handle possibly undefined name
      },
      assignee: null,
      priority: priorityMap[priority as Priority] || "medium",
      tags: [userDepartment],
    }

    addReport(newReport)

    // ✅ สร้าง notification เมื่อส่ง report สำเร็จ
    notificationHelpers.reportSubmitted(
      newReport.title,
      newReport.reporter.name,
      newReport.id
    )

    toast.success("ส่งรายงานสำเร็จ!")
    setIsSubmitting(false)

    // รีเซ็ตฟอร์ม
    setTitle("")
    setDescription("")
    setPriority("")
  }

  // แสดงชื่อแผนก
  const getDepartmentLabel = (dept: string | null): string => {
    const deptMap: Record<string, string> = {
      Electrical: "แผนกช่างไฟ (Electrical)",
      Mechanical: "แผนกช่างกล (Mechanical)",
      Technical: "แผนกช่างเทคนิค (Technical)",
      Civil: "แผนกช่างโยธา (Civil)",
    }
    return dept ? (deptMap[dept] || dept) : "ไม่ระบุแผนก"
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto py-6 px-6 max-w-[1400px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">รายงานปัญหา</h1>
          <p className="text-base text-muted-foreground">
            กรอกข้อมูลเพื่อส่งรายงานปัญหาไปยังฝ่าย Admin
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
                      placeholder="เช่น Login page crashes on Safari browser"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full"
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
                      className="min-h-[230px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      ควรระบุขั้นตอนการทำให้เกิดปัญหา, สภาพแวดล้อม, และผลกระทบ
                    </p>
                  </div>

                  {/* แผนก (แสดงอัตโนมัติ) และ Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* แผนก - แสดงอัตโนมัติ */}
                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium">
                        ฝ่าย/แผนก
                      </Label>
                      <div className="w-full px-3 py-2 border rounded-md bg-muted/50 text-sm">
                        {userDepartment ? (
                          <span className="font-medium">{getDepartmentLabel(userDepartment)}</span>
                        ) : (
                          <span className="text-muted-foreground">ไม่ระบุแผนก</span>
                        )}
                      </div>
                      {!userDepartment && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          ⚠️ กรุณาตรวจสอบข้อมูลแผนกในโปรไฟล์ของคุณ
                        </p>
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
                      }}
                    >
                      ล้างฟอร์ม
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:flex-1"
                      disabled={isSubmitting || !title || !description || !priority || !userDepartment}
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
                  {(title || description || userDepartment || priority) ? (
                    <Card className="bg-muted/50 border-2">
                      <CardContent>
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
                            {userDepartment && (
                              <Badge variant="outline">
                                {getDepartmentLabel(userDepartment)}
                              </Badge>
                            )}
                          </div>
                          {title && (
                            <div>
                              <p className="font-semibold text-base leading-tight break-words mb-2">{title}</p>
                            </div>
                          )}
                          {description && (
                            <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{description}</p>
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
                        <strong className="text-foreground">หัวเรื่อง:</strong>
                        <p className="mt-1">ใช้ประโยคสั้นๆ กระชับ อธิบายปัญหาหลักได้ชัดเจน เช่น Login page crashes on Safari แทนที่จะเป็น มีปัญหา</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-primary mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">คำอธิบาย:</strong>
                        <p className="mt-1">ระบุขั้นตอนการทำให้เกิดปัญหา, ระบบที่ใช้งาน (Browser, OS), ผลกระทบที่เกิดขึ้น, และความถี่ของปัญหา</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-primary mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">ฝ่าย/แผนก:</strong>
                        <p className="mt-1">แผนกจะถูกกำหนดอัตโนมัติตามข้อมูลบัญชีของคุณ</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-primary mt-0.5">•</span>
                      <div>
                        <strong className="text-foreground">ระดับความสำคัญ:</strong>
                        <div className="mt-1 space-y-1">
                          <span className="gap-2 flex items-center"><strong className="text-orange-400"><span className="bg-orange-400 w-2 rounded-full h-2 inline-block"></span></strong> ระบบใช้งานไม่ได้, ส่งผลกระทบต่อลูกค้าโดยตรง</span>
                          <span className="gap-2 flex items-center"><strong className="text-yellow-600"><span className="bg-yellow-400 w-2 rounded-full h-2 inline-block"></span></strong> มีวิธีแก้ชั่วคราว, ส่งผลกระทบบางส่วน</span>
                          <span className="gap-2 flex items-center"><strong className="text-green-600"><span className="bg-green-400 w-2 rounded-full h-2 inline-block"></span></strong> ปัญหาเล็กน้อย, ไม่ส่งผลกระทบต่อการทำงาน</span>
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