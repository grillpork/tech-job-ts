'use client';

// 1. ต้อง import React เข้ามา (เผื่อต้องใช้ React.use)
// เพิ่ม useState และ useEffect
import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { CellContext } from '@tanstack/react-table';
import { MoreHorizontal, Pen, Plus } from 'lucide-react';
import { useJobStore } from '@/stores/features/jobStore';
import { Job } from '@/lib/types/job';

// Components
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from './data-table';
import { columns } from './columns';
import { Badge } from '@/components/ui/badge'; // ⭐️ เพิ่ม Badge สำหรับ Mobile

// --- ⭐️ ส่วนที่ 1: เพิ่ม Custom Hook สำหรับเช็กขนาดหน้าจอ ---
// (วางไว้ข้างนอก Component หรือจะแยกไฟล์ก็ได้ครับ)
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => {
      setMatches(media.matches);
    };
    // .addListener และ .removeListener V.S. .addEventListener
    // .addListener ปัจจุบัน deprecated แล้ว แต่บาง browser เก่ายังต้องใช้
    // เพื่อความปลอดภัยสูงสุด (max compatibility) ใช้แบบนี้ก็ได้ครับ
    try {
      media.addEventListener('change', listener);
    } catch {
      media.addListener(listener);
    }

    return () => {
      try {
        media.removeEventListener('change', listener);
      } catch {
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}
// --- จบส่วน Custom Hook ---

export function JobClient() {
  const router = useRouter();
  const { jobs, isHydrated } = useJobStore();

  // --- ⭐️ ส่วนที่ 2: สร้าง State สำหรับเช็ก Mobile และ Client-side Hydration ---
  const [isClient, setIsClient] = React.useState(false);
  // เราจะใช้ breakpoint 'md' (768px) ของ Tailwind เป็นตัวแบ่ง
  const isMobile = useMediaQuery('(max-width: 767px)');

  React.useEffect(() => {
    // ตั้งค่าเป็น true เมื่อ component ถูก mount ทางฝั่ง client แล้ว
    // เพื่อป้องกัน hydration mismatch ระหว่าง server (isMobile=false) กับ client
    setIsClient(true);
  }, []);
  // --- จบส่วน State ---

  const handleEdit = (job: Job) => {
    router.push(`/dashboard/admin/jobs/${job.id}/edit`);
  };

  // 2. สร้างฟังก์ชัน handleView เพื่อนำทางไปยังหน้า view
  const handleView = (job: Job) => {
    router.push(`/dashboard/admin/jobs/${job.id}`);
  };

  const handleAddNew = () => {
    router.push('/dashboard/admin/jobs/create');
  };

  // เราจะแก้ไข 'actions' column เพื่อป้องกันการคลิกทะลุ
  // (ส่วนนี้ยังจำเป็นสำหรับ Desktop View)
  const actionColumns = columns.map((col) => {
    if (col.id === 'actions') {
      return {
        ...col,
        cell: ({ row }: CellContext<Job, unknown>) => {
          const job = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* 3. เพิ่ม e.stopPropagation() ที่ปุ่ม ... */}
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* 4. เพิ่ม e.stopPropagation() ที่ปุ่ม Edit */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(job);
                    }}
                  >
                    <Pen className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      };
    }
    return col;
  });

  // รอให้ Zustand hydrate และรอให้ client mount (เช็ก isClient)
  if (!isHydrated || !isClient) {
    return <div className="p-4 md:p-8 pt-6">Loading...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Jobs List</h2>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add New Job
        </Button>
      </div>

      {/* --- ⭐️ ส่วนที่ 3: Logic การแสดงผลแบบ Responsive --- */}
      {isMobile ? (
        // 📱 Mobile View: แสดงผลแบบ Card List
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 border rounded-lg shadow-sm cursor-pointer active:bg-muted"
              onClick={() => handleView(job)} // คลิกที่ Card เพื่อ View
            >
              {/* ⭐️ แถวบน: Title, Dept, และปุ่ม Actions */}
              <div className="flex justify-between items-start mb-3">
                {/* ส่วนข้อมูลหลัก (Title, Department) */}
                <div className="space-y-1.5 overflow-hidden">
                  <h3 className="font-semibold text-base line-clamp-2 pr-2">
                    {job.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {job.department}
                  </p>
                </div>

                {/* ส่วนปุ่ม Actions (...) */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0"
                >
                  {/* หยุดการคลิกทะลุไปที่ Card */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(job);
                        }}
                      >
                        <Pen className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* ⭐️ แถวล่าง: Status และ ข้อมูลเพิ่มเติม (Created, Assigned, Start) */}
              <div className="flex justify-between items-end">
                {/* ส่วน Status (ซ้าย) */}
                <div>
                  <Badge variant="outline">{job.status}</Badge>
                </div>

                {/* ส่วนข้อมูลเพิ่มเติม (ขวา) */}
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  {/* หมายเหตุ: ผม assume ว่า job object ของคุณมี 'createdBy', 'assignedTo',
                    และ 'startDate' นะครับ (ซึ่งอาจจะต้องไปแก้ใน type Job)
                  */}
                  {job.startDate && (
                    <p>
                      Start:{' '}
                      {new Date(job.startDate).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 🖥️ Desktop/Tablet View: แสดงผลแบบ DataTable
        <DataTable
          columns={actionColumns} // ใช้ columns ที่เราแก้ไขแล้ว (เรื่อง stopPropagation)
          data={jobs}
          onRowClick={handleView} // 5. ส่งฟังก์ชัน handleView เข้าไปใน prop onRowClick
        />
      )}
      {/* --- จบส่วน Logic --- */}
    </>
  );
}