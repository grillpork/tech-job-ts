'use client';

import { useEffect } from 'react';
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
  const { jobs, isHydrated } = useJobStore(); // ✅ ดึง isHydrated มาเช็ค

  const handleEdit = (job: Job) => {
    router.push(`/dashboard/admin/jobs/${job.id}/edit`);
  };
  
  const handleAddNew = () => {
    router.push('/dashboard/admin/jobs/create');
  };

  const actionColumns = columns.map(col => {
    if (col.id === 'actions') {
      return {
        ...col,
        cell: ({ row }: CellContext<Job, unknown>) => {
          const job = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(job)}><Pen/>Edit</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      };
    }
    return col;
  });

  // ✅ ป้องกัน Hydration Error
  if (!isHydrated) {
    return <div className="p-4 md:p-8 pt-6">Loading...</div>; // หรือแสดง Skeleton UI
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Jobs List</h2>
        <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> Add New Job</Button>
      </div>
      <DataTable 
        columns={actionColumns} 
        data={jobs} 
      />
    </>
  );
}