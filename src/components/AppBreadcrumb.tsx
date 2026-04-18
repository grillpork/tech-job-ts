"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useJobStore } from "@/stores/features/jobStore";

interface BreadcrumbItemData {
  href: string;
  label: string;
  isCurrent: boolean;
}

const formatBreadcrumbLabel = (segment: string): string => {
  if (!segment) return "";
  const formatted = segment.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  if (formatted.startsWith('[') && formatted.endsWith(']')) {
    return formatted.slice(1, -1) + ' ID';
  }

  if (segment === 'admin') return 'Admin Panel';
  if (segment === 'users') return 'Users';
  if (segment === 'inventorys') return 'Inventory';
  if (segment === 'reports') return 'Reports';

  return formatted;
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  // Safe access to jobs from store
  const storeJobs = useJobStore((state) => state.jobs);
  const jobs = Array.isArray(storeJobs) ? storeJobs : [];

  const pathSegments = pathname.split('/').filter(segment => segment);

  const breadcrumbs: BreadcrumbItemData[] = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const isCurrent = index === pathSegments.length - 1;

    // Check if segment matches any job ID
    const matchingJob = jobs.find(job => job.id === segment);
    const label = matchingJob ? matchingJob.title : formatBreadcrumbLabel(segment);

    return {
      href,
      label,
      isCurrent,
    };
  });

  if (breadcrumbs.length === 0) return null;

  if (breadcrumbs.length > 0 && (breadcrumbs[0].label === 'Dashboard' || breadcrumbs[0].label === 'Home')) {
    breadcrumbs[0].label = 'Home';
    breadcrumbs[0].href = '/dashboard';
  }

  return (
    <Breadcrumb className="p-2">
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <Fragment key={item.href}>
            <BreadcrumbItem>
              {item.isCurrent || item.href.includes('[') ? (
                <span className="font-semibold text-foreground">
                  {item.label}
                </span>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}