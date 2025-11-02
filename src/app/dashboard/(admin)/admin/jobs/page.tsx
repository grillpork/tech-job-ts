import { JobClient } from "@/components/job_m/client";

export default function JobsPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <JobClient />
      </div>
    </div>
  );
}