"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import LoginPage from "./(auth)/login/page"

export default function Page() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // จำลองเวลาโหลดหน้า (2 วินาที)
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-screen bg-background">
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

      {/* Animation fade out ขณะโหลด */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      >
        {!loading && <LoginPage />}
      </motion.div>
    </div>
  )
}
