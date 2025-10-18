// src/stores/jobStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { faker } from "@faker-js/faker";

export interface JobUser {
  id: string;
  name: string;
  imageUrl?: string | null;
  role: "admin" | "manager" | "lead_technician" | "employee"; 
  email?: string;
  password?: string; 
}

export interface Task {
  id: string;
  description: string;
  details: string | null;
  isCompleted: boolean;
  order: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  status:
    | "pending"
    | "in_progress"
    | "pending_approval"
    | "completed"
    | "cancelled"
    | "rejected";
  department: string | null;
  creator: { id: string; name: string; role: JobUser["role"] }; 
  assignedEmployees: JobUser[];
  leadTechnician: JobUser | null;
  tasks: Task[];
  createdAt: string;
  startDate?: string | null;
  endDate?: string | null;
  location?: { lat: number; lng: number; name?: string | null } | null;
  attachments: Attachment[];
}

interface JobStoreState {
  jobs: Job[];
  jobUsers: JobUser[]; 
  isHydrated: boolean;

  createJob: (
    newJobData: Omit<
      Job,
      | "id"
      | "createdAt"
      | "creator"
      | "assignedEmployees"
      | "leadTechnician"
      | "tasks"
      | "attachments"
    > & {
      creatorId: string;
      assignedEmployeeIds?: string[];
      leadTechnicianId?: string | null;
      tasks?: { description: string }[];
    }
  ) => void;

  updateJob: (
    jobId: string,
    updatedData: Partial<
      Omit<
        Job,
        | "creator"
        | "assignedEmployees"
        | "leadTechnician"
        | "tasks"
        | "attachments"
      > & {
        creatorId?: string;
        assignedEmployeeIds?: string[];
        leadTechnicianId?: string | null;
        tasks?: {
          id: string;
          description: string;
          details?: string | null;
          isCompleted?: boolean;
          order?: number;
        }[];
        attachments?: Attachment[];
      }
    >
  ) => void;

  deleteJob: (jobId: string) => void;
  getJobById: (jobId: string) => Job | undefined;
  getJobUserById: (userId: string) => JobUser | undefined;
}

// --- Mock Data Generator ---
// สร้าง User Mock Data สำหรับ JobStore โดยเฉพาะ
export const createRandomJobUser = (
  role: JobUser["role"],
  customEmail?: string,
  customName?: string,
  customPassword?: string
): JobUser => ({
  id: faker.string.uuid(),
  name: customName || faker.person.fullName(),
  imageUrl: faker.image.avatar(),
  role,
  email: customEmail || faker.internet.email().toLowerCase(),
  password: customPassword || "password123",
});

const createRandomAttachment = (): Attachment => ({
  id: faker.string.uuid(),
  fileName: faker.system.fileName(),
  fileType: faker.system.fileType(),
  size: faker.number.int({ min: 10000, max: 5000000 }),
  url: faker.image.urlLoremFlickr(),
  uploadedAt: faker.date.past().toISOString(),
});

const createRandomJob = (availableUsers: JobUser[]): Job => {
  const employees = availableUsers.filter((u) => u.role === "employee");
  const leadTechs = availableUsers.filter((u) => u.role === "lead_technician");
  const managers = availableUsers.filter((u) => u.role === "manager");
  const assignedCount = faker.number.int({ min: 0, max: 3 });

  const randomCreator = faker.helpers.arrayElement(managers);
  const selectedAssignedEmployees = faker.helpers.arrayElements(
    employees,
    assignedCount
  );
  const selectedLeadTechnician = faker.helpers.arrayElement([
    ...leadTechs,
    null,
  ]);

  return {
    id: faker.string.uuid(),
    title: faker.hacker.phrase().replace(/^./, (c) => c.toUpperCase()),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement([
      "pending",
      "in_progress",
      "completed",
      "pending_approval",
    ]),
    department: faker.helpers.arrayElement([
      "Maintenance",
      "Installation",
      "IT Support",
    ]),
    creator: {
      id: randomCreator.id,
      name: randomCreator.name,
      role: randomCreator.role,
    }, 
    assignedEmployees: selectedAssignedEmployees,
    leadTechnician: selectedLeadTechnician,
    tasks: Array.from(
      { length: faker.number.int({ min: 2, max: 5 }) },
      (_, i) => ({
        id: faker.string.uuid(),
        description: faker.lorem.sentence(5),
        details: faker.datatype.boolean() ? faker.lorem.sentence(10) : null,
        isCompleted: faker.datatype.boolean(),
        order: i,
      })
    ),
    createdAt: faker.date.past().toISOString(),
    startDate: faker.date.past().toISOString().split("T")[0],
    endDate: faker.date.future().toISOString().split("T")[0],
    location: faker.datatype.boolean()
      ? {
          lat: faker.location.latitude(),
          lng: faker.location.longitude(),
          name: faker.location.streetAddress(),
        }
      : null,
    attachments: Array.from(
      { length: faker.number.int({ min: 0, max: 3 }) },
      () => createRandomAttachment()
    ),
  };
};

export const useJobStore = create<JobStoreState>()(
  persist(
    immer((set, get) => ({
      jobs: [],
      jobUsers: [],
      isHydrated: false,

      createJob: (newJobData) => {
        set((state) => {
          const creatorUser = state.jobUsers.find(
            (u) => u.id === newJobData.creatorId
          );
          if (!creatorUser) {
            console.error("JobStore: Creator user not found for new job.");
            return;
          }

          const newJob: Job = {
            id: faker.string.uuid(),
            title: newJobData.title,
            description: newJobData.description || null,
            status: "pending",
            department: newJobData.department || null,
            creator: {
              id: creatorUser.id,
              name: creatorUser.name,
              role: creatorUser.role,
            },
            assignedEmployees: state.jobUsers.filter((u) =>
              newJobData.assignedEmployeeIds?.includes(u.id)
            ),
            leadTechnician:
              state.jobUsers.find(
                (u) => u.id === newJobData.leadTechnicianId
              ) || null,
            tasks:
              newJobData.tasks?.map((t, i) => ({
                id: faker.string.uuid(),
                description: t.description,
                isCompleted: false,
                details: null,
                order: i,
              })) || [],
            createdAt: new Date().toISOString(),
            startDate: newJobData.startDate || null,
            endDate: newJobData.endDate || null,
            location: newJobData.location || null,
            attachments: [],
          };
          state.jobs.unshift(newJob);
        });
      },

      updateJob: (jobId, updatedData) => {
        set((state) => {
          const jobIndex = state.jobs.findIndex((job) => job.id === jobId);
          if (jobIndex === -1) {
            console.warn(
              `JobStore: Job with ID ${jobId} not found for update.`
            );
            return;
          }

          const currentJob = state.jobs[jobIndex];
          const availableJobUsers = get().jobUsers; 

          if (updatedData.creatorId !== undefined) {
            const newCreator = availableJobUsers.find(
              (u) => u.id === updatedData.creatorId
            );
            currentJob.creator = newCreator
              ? {
                  id: newCreator.id,
                  name: newCreator.name,
                  role: newCreator.role,
                }
              : currentJob.creator;
          }
          if (updatedData.assignedEmployeeIds !== undefined) {
            currentJob.assignedEmployees = availableJobUsers.filter((u) =>
              updatedData.assignedEmployeeIds?.includes(u.id)
            );
          }
          if (updatedData.leadTechnicianId !== undefined) {
            currentJob.leadTechnician =
              availableJobUsers.find(
                (u) => u.id === updatedData.leadTechnicianId
              ) || null;
          }

          if (updatedData.tasks !== undefined) {
            currentJob.tasks = updatedData.tasks.map((t, i) => ({
              id: t.id || faker.string.uuid(),
              description: t.description,
              details: t.details !== undefined ? t.details : null,
              isCompleted: t.isCompleted !== undefined ? t.isCompleted : false,
              order: t.order !== undefined ? t.order : i,
            }));
          }

          if (updatedData.attachments !== undefined) {
            currentJob.attachments = updatedData.attachments;
          }

          if (updatedData.location !== undefined) {
            currentJob.location = updatedData.location;
          }

          const {
            creatorId,
            assignedEmployeeIds,
            leadTechnicianId,
            tasks,
            attachments,
            location,
            ...restOfUpdatedData
          } = updatedData;

          Object.assign(currentJob, restOfUpdatedData);
        });
      },

      deleteJob: (jobId) => {
        set((state) => {
          state.jobs = state.jobs.filter((job) => job.id !== jobId);
        });
      },

      getJobById: (jobId: string) => {
        return get().jobs.find((job) => job.id === jobId);
      },

      getJobUserById: (userId: string) => {
        return get().jobUsers.find((user) => user.id === userId);
      },
    })),
    {
      name: "job-management-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (
          state &&
          ((state as JobStoreState).jobUsers.length === 0 ||
            (state as JobStoreState).jobs.length === 0)
        ) {
          console.log(
            "JobStore: Initializing mock job users and jobs in onRehydrateStorage..."
          );

          const initialJobUsers: JobUser[] = [
            createRandomJobUser("admin", "admin@job.com", "Job Admin"),
            createRandomJobUser("manager", "manager@job.com", "Job Manager"),
            createRandomJobUser(
              "lead_technician",
              "lead@job.com",
              "Job Lead Tech"
            ),
            createRandomJobUser(
              "employee",
              "employee@job.com",
              "Job Employee 1"
            ),
            ...Array.from({ length: 7 }, (_, i) =>
              createRandomJobUser(
                "employee",
                `emp${i + 2}@job.com`,
                `Job Employee ${i + 2}`
              )
            ),
            ...Array.from({ length: 1 }, (_, i) =>
              createRandomJobUser(
                "manager",
                `mgr${i + 2}@job.com`,
                `Job Manager ${i + 2}`
              )
            ),
          ];
          (state as JobStoreState).jobUsers = initialJobUsers; 

          const jobs = Array.from(
            { length: 50 },
            () => createRandomJob(initialJobUsers) 
          );
          (state as JobStoreState).jobs = jobs;
        } else {
          console.log(
            "JobStore: Job users and jobs already exist in store or rehydrated."
          );
        }

        if (state) {
          (state as JobStoreState).isHydrated = true;
          console.log("JobStore: Store has been hydrated. isHydrated = true."); 
        } else {
          console.warn(
            "JobStore: onRehydrateStorage called with null state, isHydrated not set."
          ); 
        }
      },
      migrate: (persistedState, version) => {
        if (version < 1) {
          const state = persistedState as any;
          if (typeof state.isHydrated === "undefined") {
            state.isHydrated = false;
          }
          if (typeof state.jobUsers === "undefined") {
            state.jobUsers = [];
          }
          delete state.isAuthenticated;
          delete state.currentUser;
          delete state.users;
        }
        return persistedState as JobStoreState;
      },
      version: 1, 
    }
  )
);
