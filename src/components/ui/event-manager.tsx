"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Grid3x3, List, Search, Filter, X, ExternalLink, User, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
}

export interface EventManagerProps {
  events?: Event[]
  onEventCreate?: (event: Omit<Event, "id">) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  categories?: string[]
  colors?: { name: string; value: string; bg: string; text: string }[]
  defaultView?: "month" | "week" | "day" | "list"
  className?: string
  availableTags?: string[]
}

const defaultColors = [
  { name: "Blue", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
  { name: "Green", value: "green", bg: "bg-green-500", text: "text-green-700" },
  { name: "Purple", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
  { name: "Orange", value: "orange", bg: "bg-orange-500", text: "text-orange-700" },
  { name: "Pink", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
  { name: "Red", value: "red", bg: "bg-red-500", text: "text-red-700" },
]

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ["Meeting", "Task", "Reminder", "Personal"],
  colors = defaultColors,
  defaultView = "month",
  className,
  availableTags = ["Important", "Urgent", "Work", "Personal", "Team", "Client"],
}: EventManagerProps) {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day" | "list">(defaultView)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    color: colors[0].value,
    category: categories[0],
    tags: [],
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query))

        if (!matchesSearch) return false
      }

      // Color filter
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = event.tags?.some((tag) => selectedTags.includes(tag))
        if (!hasMatchingTag) return false
      }

      // Category filter
      if (selectedCategories.length > 0 && event.category && !selectedCategories.includes(event.category)) {
        return false
      }

      return true
    })
  }, [events, searchQuery, selectedColors, selectedTags, selectedCategories])

  const hasActiveFilters = selectedColors.length > 0 || selectedTags.length > 0 || selectedCategories.length > 0

  const clearFilters = () => {
    setSelectedColors([])
    setSelectedTags([])
    setSelectedCategories([])
    setSearchQuery("")
  }

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return

    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color || colors[0].value,
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags || [],
    }

    setEvents((prev) => [...prev, event])
    onEventCreate?.(event)
    setIsDialogOpen(false)
    setIsCreating(false)
    setNewEvent({
      title: "",
      description: "",
      color: colors[0].value,
      category: categories[0],
      tags: [],
    })
  }, [newEvent, colors, categories, onEventCreate])

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent) return

    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? selectedEvent : e)))
    onEventUpdate?.(selectedEvent.id, selectedEvent)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [selectedEvent, onEventUpdate])

  const handleDeleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      onEventDelete?.(id)
      setIsDialogOpen(false)
      setSelectedEvent(null)
    },
    [onEventDelete],
  )

  const handleDragStart = useCallback((event: Event) => {
    setDraggedEvent(event)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null)
  }, [])

  const handleDrop = useCallback(
    (date: Date, hour?: number) => {
      if (!draggedEvent) return

      const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
      const newStartTime = new Date(date)
      if (hour !== undefined) {
        newStartTime.setHours(hour, 0, 0, 0)
      }
      const newEndTime = new Date(newStartTime.getTime() + duration)

      const updatedEvent = {
        ...draggedEvent,
        startTime: newStartTime,
        endTime: newEndTime,
      }

      setEvents((prev) => prev.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)))
      onEventUpdate?.(draggedEvent.id, updatedEvent)
      setDraggedEvent(null)
    },
    [draggedEvent, onEventUpdate],
  )

  const navigateDate = useCallback(
    (direction: "prev" | "next") => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (view === "month") {
          newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
        } else if (view === "week") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
        } else if (view === "day") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1))
        }
        return newDate
      })
    },
    [view],
  )

  const getColorClasses = useCallback(
    (colorValue: string) => {
      const color = colors.find((c) => c.value === colorValue)
      return color || colors[0]
    },
    [colors],
  )

  const toggleTag = (tag: string, isCreating: boolean) => {
    if (isCreating) {
      setNewEvent((prev) => ({
        ...prev,
        tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
      }))
    } else {
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
            }
          : null,
      )
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {view === "month" &&
              currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            {view === "week" &&
              `Week of ${currentDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}`}
            {view === "day" &&
              currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            {view === "list" && "All Events"}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Mobile: Select dropdown */}
          <div className="sm:hidden">
            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Month View
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Week View
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Day View
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List View
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button group */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border bg-background p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className="h-8"
            >
              <Calendar className="h-4 w-4" />
              <span className="ml-1">Month</span>
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className="h-8"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="ml-1">Week</span>
            </Button>
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className="h-8"
            >
              <Clock className="h-4 w-4" />
              <span className="ml-1">Day</span>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-8"
            >
              <List className="h-4 w-4" />
              <span className="ml-1">List</span>
            </Button>
          </div>

          <Button
            onClick={() => {
              setIsCreating(true)
              setIsDialogOpen(true)
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile: Horizontal scroll with full-length buttons */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Color Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap flex-shrink-0 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Colors
                  {selectedColors.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {selectedColors.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by Color</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {colors.map((color) => (
                  <DropdownMenuCheckboxItem
                    key={color.value}
                    checked={selectedColors.includes(color.value)}
                    onCheckedChange={(checked) => {
                      setSelectedColors((prev) =>
                        checked ? [...prev, color.value] : prev.filter((c) => c !== color.value),
                      )
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded", color.bg)} />
                      {color.name}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tag Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap flex-shrink-0 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Tags
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={(checked) => {
                      setSelectedTags((prev) => (checked ? [...prev, tag] : prev.filter((t) => t !== tag)))
                    }}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap flex-shrink-0 bg-transparent">
                  <Filter className="h-4 w-4" />
                  Categories
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      setSelectedCategories((prev) =>
                        checked ? [...prev, category] : prev.filter((c) => c !== category),
                      )
                    }}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 whitespace-nowrap flex-shrink-0"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Color Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Colors
                {selectedColors.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {selectedColors.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Color</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {colors.map((color) => (
                <DropdownMenuCheckboxItem
                  key={color.value}
                  checked={selectedColors.includes(color.value)}
                  onCheckedChange={(checked) => {
                    setSelectedColors((prev) =>
                      checked ? [...prev, color.value] : prev.filter((c) => c !== color.value),
                    )
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded", color.bg)} />
                    {color.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tag Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={(checked) => {
                    setSelectedTags((prev) => (checked ? [...prev, tag] : prev.filter((t) => t !== tag)))
                  }}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Categories
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    {selectedCategories.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={(checked) => {
                    setSelectedCategories((prev) =>
                      checked ? [...prev, category] : prev.filter((c) => c !== category),
                    )
                  }}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedColors.map((colorValue) => {
            const color = getColorClasses(colorValue)
            return (
              <Badge key={colorValue} variant="secondary" className="gap-1">
                <div className={cn("h-2 w-2 rounded-full", color.bg)} />
                {color.name}
                <button
                  onClick={() => setSelectedColors((prev) => prev.filter((c) => c !== colorValue))}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <button
                onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== category))}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Calendar Views - Pass filteredEvents instead of events */}
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsDialogOpen(true)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsDialogOpen(true)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsDialogOpen(true)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "list" && (
        <ListView
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsDialogOpen(true)
          }}
          getColorClasses={getColorClasses}
        />
      )}

      {/* Event Dialog - Show details only when not creating */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {isCreating ? (
            <>
              <DialogHeader>
                <DialogTitle>Create Event</DialogTitle>
                <DialogDescription>Add a new event to your calendar</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Event title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={
                        newEvent.startTime
                          ? new Date(newEvent.startTime.getTime() - newEvent.startTime.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const date = new Date(e.target.value)
                        setNewEvent((prev) => ({ ...prev, startTime: date }))
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={
                        newEvent.endTime
                          ? new Date(newEvent.endTime.getTime() - newEvent.endTime.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const date = new Date(e.target.value)
                        setNewEvent((prev) => ({ ...prev, endTime: date }))
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newEvent.category}
                      onValueChange={(value) => setNewEvent((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select
                      value={newEvent.color}
                      onValueChange={(value) => setNewEvent((prev) => ({ ...prev, color: value }))}
                    >
                      <SelectTrigger id="color">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("h-4 w-4 rounded", color.bg)} />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = newEvent.tags?.includes(tag)
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer transition-all hover:scale-105"
                          onClick={() => toggleTag(tag, true)}
                        >
                          {tag}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setIsCreating(false)
                    setNewEvent({
                      title: "",
                      description: "",
                      color: colors[0].value,
                      category: categories[0],
                      tags: [],
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>Create</Button>
              </DialogFooter>
            </>
          ) : selectedEvent ? (
            <>
              <DialogHeader>
                <DialogTitle>รายละเอียดใบงาน</DialogTitle>
                <DialogDescription>ข้อมูลสรุปของใบงาน</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ชื่อใบงาน</Label>
                  <div className="text-base font-semibold">{selectedEvent.title}</div>
                </div>

                {selectedEvent.description && (
                  <div className="space-y-2">
                    <Label>คำอธิบาย</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>วันที่เริ่มต้น</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedEvent.startTime.toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {selectedEvent.startTime.toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>วันที่สิ้นสุด</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedEvent.endTime.toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {selectedEvent.endTime.toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEvent.category && (
                  <div className="space-y-2">
                    <Label>หมวดหมู่</Label>
                    <Badge variant="secondary">{selectedEvent.category}</Badge>
                  </div>
                )}

                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setSelectedEvent(null)
                  }}
                >
                  ปิด
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/dashboard/admin/jobs/${selectedEvent.id}`)
                    setIsDialogOpen(false)
                    setSelectedEvent(null)
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  ดูรายละเอียดเต็ม
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// EventCard component with hover effect
function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = "default",
}: {
  event: Event
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  getColorClasses: (color: string) => { bg: string; text: string }
  variant?: "default" | "compact" | "detailed"
}) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const colorClasses = getColorClasses(event.color)
  
  const handleViewJob = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Try admin route first, fallback to employee route
    router.push(`/dashboard/(admin)/admin/jobs/${event.id}`)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDuration = () => {
    const diff = event.endTime.getTime() - event.startTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (variant === "compact") {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer"
      >
        <div
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium transition-all duration-300",
            colorClasses.bg,
            "text-white truncate animate-in fade-in slide-in-from-top-1",
            isHovered && "scale-105 shadow-lg z-10",
          )}
        >
          {event.title}
        </div>
        {isHovered && (
          <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="border-2 p-4 shadow-xl bg-background">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>
                  <div className={cn("h-3 w-3 rounded-full flex-shrink-0", colorClasses.bg)} />
                </div>
                
                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{event.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {event.startTime.toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </span>
                    <span className="text-[10px]">({getDuration()})</span>
                  </div>
                </div>
                
                {(event.category || event.tags?.length) && (
                  <div className="flex flex-wrap gap-1">
                    {event.category && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {event.category}
                      </Badge>
                    )}
                    {event.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] h-5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <Button
                  size="sm"
                  variant="default"
                  className="w-full text-xs h-8"
                  onClick={handleViewJob}
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  ดูรายละเอียดใบงาน
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (variant === "detailed") {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "cursor-pointer rounded-lg p-3 transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-2",
          isHovered && "scale-[1.03] shadow-2xl ring-2 ring-white/50",
        )}
      >
        <div className="font-semibold">{event.title}</div>
        {event.description && <div className="mt-1 text-sm opacity-90 line-clamp-2">{event.description}</div>}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Clock className="h-3 w-3" />
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>
        {isHovered && (
          <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            {event.category && (
              <Badge variant="secondary" className="text-xs">
                {event.category}
              </Badge>
            )}
            {event.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          "cursor-pointer rounded px-2 py-1 text-xs font-medium transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-1",
          isHovered && "scale-105 shadow-lg z-10",
        )}
      >
        <div className="truncate">{event.title}</div>
      </div>
      {isHovered && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-2 p-4 shadow-xl bg-background">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight">{event.title}</h4>
                <div className={cn("h-4 w-4 rounded-full flex-shrink-0", colorClasses.bg)} />
              </div>
              
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {event.startTime.toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
              </div>
              
              {(event.category || event.tags?.length) && (
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <Button
                size="sm"
                variant="default"
                className="w-full text-xs h-8"
                onClick={handleViewJob}
              >
                <ExternalLink className="h-3 w-3 mr-1.5" />
                ดูรายละเอียดใบงาน
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const days: Date[] = []
  const currentDay = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 1)
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)
      
      // Normalize dates to start of day for comparison
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      
      const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
      const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
      const dayDate = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate())
      
      // Check if the day is within the event's date range
      return dayDate >= eventStartDate && dayDate <= eventEndDate
    })
  }
  
  // Helper function to determine if event starts on this day
  const isEventStartDay = (event: Event, date: Date) => {
    const eventStart = new Date(event.startTime)
    const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
    const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return eventStartDate.getTime() === dayDate.getTime()
  }
  
  // Helper function to determine if event ends on this day
  const isEventEndDay = (event: Event, date: Date) => {
    const eventEnd = new Date(event.endTime)
    const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
    const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return eventEndDate.getTime() === dayDate.getTime()
  }
  
  // Helper function to get event span (how many days)
  const getEventSpan = (event: Event, date: Date) => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    
    const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
    const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
    const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (dayDate < eventStartDate || dayDate > eventEndDate) return 0
    
    // Calculate how many days from start to end
    const totalDays = Math.ceil((eventEndDate.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const dayIndex = Math.ceil((dayDate.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate remaining days from this day to end
    const remainingDays = totalDays - dayIndex
    
    // Check if this is the last day in the visible week
    const dayOfWeek = date.getDay()
    const daysUntilWeekEnd = 6 - dayOfWeek
    
    return Math.min(remainingDays, daysUntilWeekEnd + 1)
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>
      <div className="relative">
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const isToday = day.toDateString() === new Date().toDateString()

            return (
              <div
                key={index}
                className={cn(
                  "min-h-20 border-b border-r p-1 transition-colors last:border-r-0 sm:min-h-24 sm:p-2 relative",
                  !isCurrentMonth && "bg-muted/30",
                  "hover:bg-accent/50",
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(day)}
              >
                <div
                  className={cn(
                    "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs sm:h-6 sm:w-6 sm:text-sm",
                    isToday && "bg-primary text-primary-foreground font-semibold",
                  )}
                >
                  {day.getDate()}
                </div>
                {/* Placeholder for events that start on this day */}
                <div className="space-y-1 relative z-10" style={{ minHeight: '1.5rem' }}>
                  {getEventsForDay(day)
                    .filter(event => isEventStartDay(event, day))
                    .slice(0, 3)
                    .map((event) => (
                      <div key={`placeholder-${event.id}`} style={{ height: '1.25rem' }} />
                    ))}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Events overlay - positioned absolutely to span multiple days */}
        <div className="absolute inset-0 pointer-events-none" style={{ padding: '0.25rem' }}>
          {(() => {
            // Filter and prepare events
            const visibleEvents = events.filter(event => {
              const eventStart = new Date(event.startTime)
              const eventEnd = new Date(event.endTime)
              const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
              const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
              
              // Check if event overlaps with visible calendar days
              const visibleStart = days[0]
              const visibleEnd = days[days.length - 1]
              const visibleStartDate = new Date(visibleStart.getFullYear(), visibleStart.getMonth(), visibleStart.getDate())
              const visibleEndDate = new Date(visibleEnd.getFullYear(), visibleEnd.getMonth(), visibleEnd.getDate())
              
              return eventEndDate >= visibleStartDate && eventStartDate <= visibleEndDate
            })

            // Group events by their start day index and calculate row positions
            const eventRows = new Map<number, number[]>() // dayIndex -> array of row positions
            const eventPositions = new Map<string, { row: number; dayIndex: number; span: number }>()

            visibleEvents.forEach(event => {
              const eventStart = new Date(event.startTime)
              const eventEnd = new Date(event.endTime)
              const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
              const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
              
              // Find the day index where event starts
              const startDayIndex = days.findIndex(day => {
                const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate())
                return dayDate.getTime() === eventStartDate.getTime()
              })
              
              if (startDayIndex === -1) return
              
              // Calculate how many days the event spans
              const totalDays = Math.ceil((eventEndDate.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
              const remainingDays = days.length - startDayIndex
              const visibleSpan = Math.min(totalDays, remainingDays)
              
              // Find available row for this event
              // Check all days this event spans to find conflicts
              let row = 0
              let hasConflict = true
              
              while (hasConflict) {
                hasConflict = false
                
                // Check if this row conflicts with any existing event in the days this event spans
                for (let dayOffset = 0; dayOffset < visibleSpan; dayOffset++) {
                  const checkDayIndex = startDayIndex + dayOffset
                  if (checkDayIndex >= days.length) break
                  
                  // Check all events to see if they conflict on this specific day
                  eventPositions.forEach((pos, eventId) => {
                    if (eventId === event.id) return
                    
                    // Check if events overlap in day range
                    const posStartDay = pos.dayIndex
                    const posEndDay = pos.dayIndex + pos.span - 1
                    const currentStartDay = startDayIndex
                    const currentEndDay = startDayIndex + visibleSpan - 1
                    
                    // Check if day ranges overlap
                    if (!(currentStartDay > posEndDay || currentEndDay < posStartDay)) {
                      // They overlap in day range, check if same row
                      if (pos.row === row) {
                        // Also check if they overlap on this specific day
                        if (checkDayIndex >= posStartDay && checkDayIndex <= posEndDay) {
                          hasConflict = true
                        }
                      }
                    }
                  })
                  
                  if (hasConflict) break
                }
                
                if (hasConflict) {
                  row++
                  // Limit to maximum rows to prevent infinite loop
                  if (row > 10) {
                    hasConflict = false
                    break
                  }
                }
              }
              
              // Store this event's position
              eventPositions.set(event.id, { row, dayIndex: startDayIndex, span: visibleSpan })
            })

            // Render events with calculated positions
            return visibleEvents.map((event, eventIndex) => {
              const position = eventPositions.get(event.id)
              if (!position) return null
              
              const { row, dayIndex, span } = position
              
              const eventStart = new Date(event.startTime)
              const eventEnd = new Date(event.endTime)
              const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
              
              // Calculate position
              const dayWidth = 100 / 7 // 7 days in a week
              const leftPercent = (dayIndex % 7) * dayWidth
              const widthPercent = span * dayWidth
              
              // Calculate row (which week)
              const weekRow = Math.floor(dayIndex / 7)
              const rowHeight = 95 // Approximate height per row in pixels (min-h-20 = 5rem = 80px)
              const eventRowHeight = 20 // Height of each event row
              const dateNumberHeight = 24 // Height for date number (h-6 = 1.5rem = 24px)
              const spacingAfterDate = 12 // Spacing after date number to avoid overlap
              const topOffset = weekRow * rowHeight + dateNumberHeight + spacingAfterDate + (row * eventRowHeight) // Offset to avoid overlapping with date number
              
              return (
                <div
                  key={`event-${event.id}-${eventIndex}`}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    top: `${topOffset}px`,
                    pointerEvents: 'auto',
                    zIndex: 10 + eventIndex,
                    padding: '0 0.125rem',
                  }}
                >
                  <EventCard
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="compact"
                  />
                </div>
              )
            })
          })()}
        </div>
      </div>
    </Card>
  )
}

// Week View Component
function WeekView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour: number) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Get events that start in this day and hour
  const getEventsForDayAndHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startTime)
      const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
      const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return (
        eventStartDate.getTime() === dayDate.getTime() &&
        eventStart.getHours() === hour
      )
    })
  }

  // Calculate event position and height in hours
  const getEventStyle = (event: Event, day: Date) => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    const dayStart = new Date(day)
    dayStart.setHours(0, 0, 0, 0)
    
    // Check if event is on this day
    const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
    const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    
    if (eventStartDate.getTime() !== dayDate.getTime()) {
      return null
    }

    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes()
    const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes()
    const durationMinutes = endMinutes - startMinutes
    
    // Each hour cell is approximately 48px (min-h-12) on mobile, 64px (min-h-16) on desktop
    // Use desktop height for better visibility
    const hourHeight = 64 // base height per hour in pixels
    const topOffset = (startMinutes / 60) * hourHeight
    const height = (durationMinutes / 60) * hourHeight
    
    return {
      top: `${topOffset}px`,
      height: `${Math.max(height, 32)}px`, // Minimum height
      position: 'absolute' as const,
      zIndex: 10,
    }
  }

  return (
    <Card className="overflow-auto">
      <div className="grid grid-cols-8 border-b">
        <div className="border-r p-2 text-center text-xs font-medium sm:text-sm">Time</div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm"
          >
            <div className="hidden sm:block">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div className="sm:hidden">{day.toLocaleDateString("en-US", { weekday: "narrow" })}</div>
            <div className="text-[10px] text-muted-foreground sm:text-xs">
              {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        ))}
      </div>
      <div className="relative">
        {/* Time column and day columns */}
        <div className="grid grid-cols-8">
          {hours.map((hour) => (
            <div key={`time-${hour}`} className="contents">
              <div 
                className="border-b border-r p-1 text-[10px] text-muted-foreground sm:p-2 sm:text-xs sticky top-0 bg-background z-20"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
              {weekDays.map((day) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-12 border-b border-r p-0.5 transition-colors hover:bg-accent/50 last:border-r-0 sm:min-h-16 sm:p-1 relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day, hour)}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Events overlay - positioned absolutely */}
        <div className="absolute inset-0 pointer-events-none">
          {weekDays.map((day, dayIndex) => {
            const dayEvents = events.filter((event) => {
              const eventStart = new Date(event.startTime)
              const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
              const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate())
              return eventStartDate.getTime() === dayDate.getTime()
            })
            
            return dayEvents.map((event) => {
              const eventStyle = getEventStyle(event, day)
              if (!eventStyle) return null
              
              // Calculate position based on grid
              // Time column takes 1/8, each day takes 1/8
              const leftPercent = ((dayIndex + 1) * 12.5)
              const widthPercent = 12.5
              
              return (
                <div
                  key={`event-${event.id}-${day.toISOString()}`}
                  style={{
                    ...eventStyle,
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    pointerEvents: 'auto',
                  }}
                >
                  <EventCard
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="default"
                  />
                </div>
              )
            })
          })}
        </div>
      </div>
    </Card>
  )
}

// Day View Component
function DayView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour: number) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Get events that start in this hour
  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startTime)
      return (
        eventStart.getDate() === currentDate.getDate() &&
        eventStart.getMonth() === currentDate.getMonth() &&
        eventStart.getFullYear() === currentDate.getFullYear() &&
        eventStart.getHours() === hour
      )
    })
  }

  // Calculate event position and height
  const getEventStyle = (event: Event) => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)
    
    // Check if event is on this day
    if (
      eventStart.getDate() !== currentDate.getDate() ||
      eventStart.getMonth() !== currentDate.getMonth() ||
      eventStart.getFullYear() !== currentDate.getFullYear()
    ) {
      return null
    }

    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    
    const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes()
    const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes()
    const durationMinutes = endMinutes - startMinutes
    
    // Each hour cell is approximately 64px (min-h-16) on mobile, 80px (min-h-20) on desktop
    const hourHeightMobile = 64
    const hourHeightDesktop = 80
    const topOffsetMobile = (startMinutes / 60) * hourHeightMobile
    const topOffsetDesktop = (startMinutes / 60) * hourHeightDesktop
    const heightMobile = (durationMinutes / 60) * hourHeightMobile
    const heightDesktop = (durationMinutes / 60) * hourHeightDesktop
    
    return {
      mobile: {
        top: `${topOffsetMobile}px`,
        height: `${Math.max(heightMobile, 32)}px`,
      },
      desktop: {
        top: `${topOffsetDesktop}px`,
        height: `${Math.max(heightDesktop, 40)}px`,
      },
    }
  }

  // Get all events for this day
  const dayEvents = events.filter((event) => {
    const eventStart = new Date(event.startTime)
    return (
      eventStart.getDate() === currentDate.getDate() &&
      eventStart.getMonth() === currentDate.getMonth() &&
      eventStart.getFullYear() === currentDate.getFullYear()
    )
  })

  return (
    <Card className="overflow-auto">
      <div className="space-y-0 relative">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour)
          return (
            <div
              key={hour}
              className="flex border-b last:border-b-0 relative"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(currentDate, hour)}
            >
              <div className="w-14 flex-shrink-0 border-r p-2 text-xs text-muted-foreground sm:w-20 sm:p-3 sm:text-sm sticky top-0 bg-background z-10">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="min-h-16 flex-1 p-1 transition-colors hover:bg-accent/50 sm:min-h-20 sm:p-2 relative">
                {/* Placeholder for events that start in this hour */}
                {hourEvents.length > 0 && (
                  <div className="space-y-2">
                    {hourEvents.map((event) => (
                      <div key={event.id} className="sm:hidden">
                        <EventCard
                          event={event}
                          onEventClick={onEventClick}
                          onDragStart={onDragStart}
                          onDragEnd={onDragEnd}
                          getColorClasses={getColorClasses}
                          variant="detailed"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {/* Desktop: Absolute positioned events */}
        <div className="hidden sm:block absolute top-0 left-20 right-0" style={{ height: `${24 * 80}px` }}>
          {dayEvents.map((event) => {
            const eventStyle = getEventStyle(event)
            if (!eventStyle) return null
            
            return (
              <div
                key={`desktop-${event.id}`}
                style={{
                  position: 'absolute',
                  left: '0.5rem',
                  right: '0.5rem',
                  top: eventStyle.desktop.top,
                  height: eventStyle.desktop.height,
                  zIndex: 10,
                }}
              >
                <EventCard
                  event={event}
                  onEventClick={onEventClick}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  getColorClasses={getColorClasses}
                  variant="detailed"
                />
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

// List View Component
function ListView({
  events,
  onEventClick,
  getColorClasses,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  const groupedEvents = sortedEvents.reduce(
    (acc, event) => {
      const dateKey = event.startTime.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, Event[]>,
  )

  return (
    <Card className="p-3 sm:p-4">
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground sm:text-sm">{date}</h3>
            <div className="space-y-2">
              {dateEvents.map((event) => {
                const colorClasses = getColorClasses(event.color)
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-4"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={cn("mt-1 h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3", colorClasses.bg)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors sm:text-base truncate">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 text-xs text-muted-foreground sm:text-sm line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {event.category && (
                              <Badge variant="secondary" className="text-xs">
                                {event.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground sm:gap-4 sm:text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.startTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {event.endTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] h-4 sm:text-xs sm:h-5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {sortedEvents.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground sm:text-base">No events found</div>
        )}
      </div>
    </Card>
  )
}
