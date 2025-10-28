// --- แก้ใน searchStore.ts ---
import { useUserStore } from "@/stores/features/userStore";
import { useJobStore } from "@/stores/features/jobStore";
import { create } from "zustand";

type SearchResults = {
  users: any[];
  jobs: any[];
};

type SearchStore = {
  open: boolean;
  query: string;
  results: SearchResults;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  searchJobsAndUsers: (query: string) => void;
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  open: false,
  query: "",
  results: { users: [], jobs: [] },
  setOpen: (open : boolean) => set({ open }),
  setQuery: (query : string) => set({ query }),

  searchJobsAndUsers: (query : string) => {
    const q = query.toLowerCase();
    const users = useUserStore.getState().users;
    const jobs = useJobStore.getState().jobs;

    const filteredUsers = users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
    const filteredJobs = jobs.filter((j) =>
      j.title.toLowerCase().includes(q)
    );

    set({ results: { users: filteredUsers, jobs: filteredJobs } });
  },
}));
