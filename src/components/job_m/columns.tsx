'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { useJobStore } from '@/stores/features/jobStore';
import { Job } from '@/lib/types/job';
import { format } from 'date-fns';

// Components
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Component สำหรับ Dropdown เปลี่ยน Status
const StatusSelector = ({ job }: { job: Job }) => {
    const updateJob = useJobStore((state) => state.updateJob);

    return (
        <Select
            value={job.status}
            onValueChange={(newStatus) => {
                updateJob(job.id, { status: newStatus as Job['status'] });
            }}
        >
            <SelectTrigger className="w-[130px] border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="pending"><Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge></SelectItem>
                <SelectItem value="in_progress"><Badge variant="outline" className="bg-blue-100 text-blue-800">In Progress</Badge></SelectItem>
                <SelectItem value="completed"><Badge variant="outline" className="bg-green-100 text-green-800">Completed</Badge></SelectItem>
            </SelectContent>
        </Select>
    )
}

// ✅ --- ฟังก์ชันใหม่: หาตัวอักษรแรกของชื่อ --- ✅
const getAvatarFallback = (name: string) => {
  if (!name) return "?";
  const parts = name.split(' ');
  // ถ้ามีคำนำหน้า (นาย, นางสาว) ให้ใช้ตัวอักษรแรกของคำถัดไป
  if (parts.length > 1 && (parts[0] === 'นาย' || parts[0] === 'นางสาว')) {
    return parts[1].charAt(0); // เช่น "นาย สมควร" -> "ส"
  }
  // ถ้าไม่มีคำนำหน้า ให้ใช้ตัวอักษรแรกของชื่อ
  return parts[0].charAt(0); // เช่น "สมชาย" -> "ส"
}
// --- สิ้นสุดฟังก์ชันใหม่ ---

export const columns: ColumnDef<Job>[] = [
    { 
      accessorKey: 'title', 
      header: 'Title',
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        const CHARACTER_LIMIT = 30;

        if (title.length <= CHARACTER_LIMIT) {
          return <div className="font-medium">{title}</div>;
        }

        const truncatedTitle = title.substring(0, CHARACTER_LIMIT) + "...";

        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium cursor-default">{truncatedTitle}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => <StatusSelector job={row.original} />
    },
    { 
      accessorKey: 'department', 
      header: 'Department',
      cell: ({ row }) => row.original.department || '-'
    },
    { 
      accessorKey: 'creator', 
      header: 'Created By',
      cell: ({ row }) => {
        const creator = row.original.creator;
        return (
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border-2 border-background">
                                <AvatarFallback>{getAvatarFallback(creator.name)}</AvatarFallback>
                            </Avatar>
                            <span>{creator.name}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>{creator.name}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
      }
    },
    { 
      accessorKey: 'assignedEmployees', 
      header: 'Assigned To',
      cell: ({ row }) => {
        const users = row.original.assignedEmployees;
        
        if (!users || users.length === 0) {
            return <span>-</span>;
        }
        
        return (
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center -space-x-2">
              {users.map((user) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={user.imageUrl || ''} />
                        {/* ✅ แก้ไข: เรียกใช้ฟังก์ชันใหม่ */}
                        <AvatarFallback>{getAvatarFallback(user.name)}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{user.name}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        );
      }
    },
    { 
      accessorKey: 'startDate', 
      header: 'Start Date',
      cell: ({ row }) => {
        const startDate = row.original.startDate;
        if (!startDate) { return <span>-</span>; }
        try {
          return format(new Date(startDate), "yyyy-MM-dd");
        } catch (error) {
          return <span>Invalid Date</span>;
        }
      }
    },
    { 
      id: 'actions', 
      cell: () => null // Actions จะถูก render ใน client.tsx
    },
];