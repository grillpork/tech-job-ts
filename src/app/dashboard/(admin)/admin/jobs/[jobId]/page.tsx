// src/app/dashboard/(admin)/admin/jobs/[jobId]/view/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useJobStore } from "@/stores/features/jobStore";

import { Loader2 } from "lucide-react";


type RouteParams = { jobId: string };

const page = () => {
  const { jobId } = useParams<RouteParams>();

  const getJobById = useJobStore((state) => state.getJobById);
  const job = getJobById(jobId);

  if (!job) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading job details...</p>
      </div>
    );
  }

  return (
    <div>
        {job.title}
    </div>
  )
}
export default page