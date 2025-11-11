"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import LoginPage from "./(auth)/login/page"
import { useRouter } from "next/navigation"

export default function Page() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // ตรวจสอบสิทธิ์ login ทันที
    const token = localStorage.getItem("token")
    if (token) {
      router.replace("/dashboard") // เปลี่ยนเส้นทางตามที่ต้องการ
      return
    }

    // ให้แถบ progress ทำงานไปพร้อมกับหน้า login
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* แถบ progress loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="progress"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-1 bg-blue-500 z-50"
          />
        )}
      </AnimatePresence>

      {/* เนื้อหา LoginPage แสดงตั้งแต่ต้น */}
      <div className="relative z-10">
        <LoginPage />
      </div>

      {/* overlay animation fade-out */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="fade"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="absolute inset-0 bg-background z-20 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8 }}
              className="text-3xl font-bold text-blue-600"
            >
              TECH JOB
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
