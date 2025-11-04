'use client';

// 1. ต้อง import React เข้ามา (เผื่อต้องใช้ React.use)
import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { CellContext } from '@tanstack/react-table';
import { MoreHorizontal, Pen, Plus } from 'lucide-react';
import { useJobStore } from '@/stores/features/jobStore';
import { Job } from '@/lib/types/job';

// Components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from './data-table';
import { columns } from './columns';

export function JobClient() {
  const router = useRouter();
  const { jobs, isHydrated } = useJobStore(); 

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
  const actionColumns = columns.map(col => {
    if (col.id === 'actions') {
      return {
        ...col,
        cell: ({ row }: CellContext<Job, unknown>) => {
          const job = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* 3. เพิ่ม e.stopPropagation() ที่ปุ่ม ...
                      เพื่อไม่ให้การคลิกปุ่มนี้ ไปโดน "แถว" (Row)
                  */}
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
                  {/* 4. เพิ่ม e.stopPropagation() ที่ปุ่ม Edit
                      เพื่อไม่ให้การคลิก "Edit" ไปโดน "แถว" (Row)
                  */}
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleEdit(job);
                    }}
                  >
                    <Pen className="mr-2 h-4 w-4" />Edit
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

  if (!isHydrated) {
    return <div className="p-4 md:p-8 pt-6">Loading...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Jobs List</h2>
        <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> Add New Job</Button>
      </div>
      <DataTable 
        columns={actionColumns} // ใช้ columns ที่เราแก้ไขแล้ว
        data={jobs} 
        onRowClick={handleView} // 5. ส่งฟังก์ชัน handleView เข้าไปใน prop onRowClick ที่เราสร้างไว้
      />
    </>
  );
}