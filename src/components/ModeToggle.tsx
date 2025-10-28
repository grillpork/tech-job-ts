"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === "dark"

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }

  return (
    <div className="flex items-center gap-2">
      <Moon className="w-5 h-5"/>
      <div className=" flex justify-between items-center w-full">
        <div className="w-full pr-8">Theme</div>
        <Switch checked={isDark} onCheckedChange={handleToggle} />
      </div>
      {/* <Moon className={`h-5 w-5 ${isDark ? "opacity-100" : "opacity-40"}`} /> */}
    </div>
  )
}
