// src/app/dashboard/(admin)/admin/history/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Clock,
  Building,
  Wrench,
  Users,
  Calendar,
  ClipboardList,
  Scroll,
  Archive,
  X, // ไอคอนสำหรับปุ่มปิด
  ChevronLeft, // <-- เพิ่ม
  ChevronRight, // <-- เพิ่ม
} from "lucide-react";

// --- 1. Types & Mock Data (เหมือนเดิม) ---
type JobStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

interface Job {
  id: string;
  title: string;
  status: JobStatus;
  createdBy: string;
  createdAt: string;
  department: string;
  leadTechnician: string;
  employees: string[];
  startDate: string;
  endDate: string;
  tasks: { id: string; description: string }[];
  workLogs: { date: string; updatedBy: string; status: JobStatus; note: string }[];
  inventory: { name: string; type: string; quantity: number }[];
}

const mockJobs: Job[] = [
  {
    id: "job-12b494fe",
    title: "ซ่อมบำรุงระบบแอร์หลัก",
    status: "Completed",
    createdBy: "สมศักดิ์ รักไทย",
    createdAt: "05/11/25",
    department: "Electrical",
    leadTechnician: "สมเกียรติ ชาญชัย",
    employees: ["ชูใจ"],
    startDate: "05/11/25",
    endDate: "05/11/25",
    tasks: [{ id: "t1", description: "เปลี่ยนฟิลเตอร์" }],
    workLogs: [
      {
        date: "05/11/25",
        updatedBy: "สมเกียรติ ชาญชัย",
        status: "Completed",
        note: "เปลี่ยนฟิลเตอร์เรียบร้อย ระบบทำงานปกติ",
      },
    ],
    inventory: [{ name: "Air Filter A-123", type: "Component", quantity: 1 }],
  },
  {
    id: "job-09c234ab",
    title: "ตรวจสอบระบบประปาประจำไตรมาส",
    status: "Completed",
    createdBy: "สมศักดิ์ รักไทย",
    createdAt: "01/11/25",
    department: "Plumbing",
    leadTechnician: "วิรัช ใจดี",
    employees: ["เดชา", "มานะ"],
    startDate: "02/11/25",
    endDate: "03/11/25",
    tasks: [
      { id: "t1", description: "ตรวจสอบท่อเมนหลัก" },
      { id: "t2", description: "เช็คแรงดันปั๊มน้ำ" },
    ],
    workLogs: [
      {
        date: "02/11/25",
        updatedBy: "วิรัช ใจดี",
        status: "In Progress",
        note: "เริ่มตรวจสอบท่อเมน",
      },
      {
        date: "03/11/25",
        updatedBy: "วิรัช ใจดี",
        status: "Completed",
        note: "ระบบปกติ แรงดันปั๊มคงที่",
      },
    ],
    inventory: [{ name: "เทปพันเกลียว", type: "Consumable", quantity: 2 }],
  },
  {
    id: "job-45d678ef",
    title: "ติดตั้งไฟส่องสว่างลานจอดรถ",
    status: "Cancelled",
    createdBy: "สมศักดิ์ รักไทย",
    createdAt: "04/11/25",
    department: "Electrical",
    leadTechnician: "สมเกียรติ ชาญชัย",
    employees: [],
    startDate: "04/11/25",
    endDate: "N/A",
    tasks: [{ id: "t1", description: "เดินสายไฟโซน A" }],
    workLogs: [
      {
        date: "04/11/25",
        updatedBy: "สมศักดิ์ รักไทย",
        status: "Cancelled",
        note: "ลูกค้ายกเลิกเนื่องจากเปลี่ยนแผนโครงการ",
      },
    ],
    inventory: [],
  },
];

// --- 2. Status Badge Component (เหมือนเดิม) ---
const StatusBadge = ({ status }: { status: JobStatus }) => {
  const statusStyles = {
    Pending: "bg-yellow-600/30 text-yellow-300 border border-yellow-500/50",
    "In Progress": "bg-blue-600/30 text-blue-300 border border-blue-500/50",
    Completed: "bg-green-600/30 text-green-300 border border-green-500/50",
    Cancelled: "bg-red-600/30 text-red-300 border border-red-500/50",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
};

// --- 3. Component หลักของหน้า History ---
export default function HistoryPage() {
  // ============== ⬇️ แก้ไข State ⬇️ ==============
  // เปลี่ยนจากเก็บ Object เป็นเก็บ Index (number)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // หา Job ที่ถูกเลือกจาก Index
  const selectedJob =
    typeof selectedIndex === "number" ? mockJobs[selectedIndex] : null;

  // เช็กว่ามีปุ่ม Next/Prev หรือไม่
  const canPrevious = typeof selectedIndex === "number" && selectedIndex > 0;
  const canNext =
    typeof selectedIndex === "number" && selectedIndex < mockJobs.length - 1;

  // ฟังก์ชันสำหรับเลื่อน
  const handleNext = () => {
    if (canNext) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (canPrevious) {
      setSelectedIndex(selectedIndex - 1);
    }
  };
  // ============== ⬆️ จบส่วนแก้ไข State ⬆️ ==============

  return (
    <div className="p-4 md:p-8 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Job History</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ============== ⬇️ แก้ไข Map ⬇️ ============== */}
        {/* เพิ่ม 'index' เข้ามาใน map */}
        {mockJobs.map((job, index) => (
          <JobSummaryCard
            key={job.id}
            job={job}
            onClick={() => setSelectedIndex(index)} // <-- ส่ง index ไป
          />
        ))}
        {/* ============== ⬆️ จบส่วนแก้ไข Map ⬆️ ============== */}
      </div>

      <AnimatePresence>
        {selectedJob && (
          // ============== ⬇️ แก้ไข Modal ⬇️ ==============
          <JobDetailModal
            key={selectedJob.id} // <-- **สำคัญมาก** ใช้ id เป็น key
            job={selectedJob}
            onClose={() => setSelectedIndex(null)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canNext={canNext}
            canPrevious={canPrevious}
          />
          // ============== ⬆️ จบส่วนแก้ไข Modal ⬆️ ==============
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 4. Component Card สรุป (สำหรับแสดงใน Grid) ---
// (เหมือนเดิม ไม่ต้องแก้)
function JobSummaryCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <motion.div
      layoutId={`card-container-${job.id}`}
      onClick={onClick}
      className="bg-zinc-800 rounded-lg shadow-lg p-4 cursor-pointer border border-zinc-700 hover:border-zinc-500 transition-colors"
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <div className="flex justify-between items-start mb-2">
        <StatusBadge status={job.status} />
        <span className="text-xs text-zinc-400">{job.createdAt}</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1 truncate">
        {job.title}
      </h3>
      <p className="text-sm text-zinc-400">Job ID: {job.id}</p>
      <p className="text-sm text-zinc-300 mt-2">
        แผนก: {job.department}
      </p>
    </motion.div>
  );
}

// --- 5. Component Modal (Popup) ---
// ============== ⬇️ แก้ไข Props ⬇️ ==============
function JobDetailModal({
  job,
  onClose,
  onNext,
  onPrevious,
  canNext,
  canPrevious,
}: {
  job: Job;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canNext: boolean;
  canPrevious: boolean;
}) {
  // ============== ⬆️ จบส่วนแก้ไข Props ⬆️ ==============
  return (
    <>
      {/* Backdrop (พื้นหลังมืดๆ) */}
      <motion.div
        className="fixed inset-0 bg-black/70 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* ตัว Modal Content (Wrapper) */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose} // คลิกพื้นที่ว่างรอบๆ เพื่อปิด
      >
        {/* ============== ⬇️ เพิ่มปุ่ม Previous ⬇️ ============== */}
        <motion.button
          className="absolute left-4 md:left-8 p-3 rounded-full bg-zinc-800/70 hover:bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          onClick={(e) => {
            e.stopPropagation(); // หยุดไม่ให้ event click ทะลุไปปิด Modal
            onPrevious();
          }}
          disabled={!canPrevious}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        {/* ============== ⬆️ จบส่วนปุ่ม Previous ⬆️ ============== */}

        {/* ตัว Modal Content หลัก */}
        <motion.div
          layoutId={`card-container-${job.id}`}
          className="bg-zinc-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-zinc-700"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.4, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
          onClick={(e) => e.stopPropagation()} // หยุดไม่ให้ event click ทะลุไปปิด Modal
        >
          {/* Header ของ Modal (เหมือนเดิม) */}
          <div className="flex justify-between items-center p-4 border-b border-zinc-700 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold">{job.title}</h2>
              <p className="text-sm text-zinc-400">Job ID: {job.id}</p>
            </div>
            <StatusBadge status={job.status} />
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body (Scrollable) (เหมือนเดิม) */}
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Job Details */}
              <div className="lg:col-span-1 space-y-4">
                <InfoItem icon={User} label="Create by" value={job.createdBy} />
                <InfoItem icon={Clock} label="Create at" value={job.createdAt} />
                <InfoItem
                  icon={Building}
                  label="Department"
                  value={job.department}
                />
                <InfoItem
                  icon={Wrench}
                  label="Lead technician"
                  value={job.leadTechnician}
                />
                <InfoItem
                  icon={Users}
                  label="Employees"
                  value={
                    job.employees.length > 0
                      ? job.employees.join(", ")
                      : "No employees assigned"
                  }
                />
                <InfoItem
                  icon={Calendar}
                  label="Start Date"
                  value={job.startDate}
                />
                <InfoItem
                  icon={Calendar}
                  label="End Date"
                  value={job.endDate}
                />
              </div>

              {/* Right Column: Tasks, Logs, Inventory */}
              <div className="lg:col-span-2 space-y-6">
                <TableSection
                  title="All Tasks"
                  icon={ClipboardList}
                  headers={["Task Description"]}
                  data={job.tasks}
                  renderRow={(task) => (
                    <tr key={task.id}>
                      <td className="py-2 px-4">{task.description}</td>
                    </tr>
                  )}
                  noDataMessage="No tasks defined for this job."
                />

                <TableSection
                  title="Work Log & History"
                  icon={Scroll}
                  headers={["Date", "Update By", "Status", "Note"]}
                  data={job.workLogs}
                  renderRow={(log) => (
                    <tr key={log.date + log.updatedBy}>
                      <td className="py-2 px-4">{log.date}</td>
                      <td className="py-2 px-4">{log.updatedBy}</td>
                      <td className="py-2 px-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="py-2 px-4">{log.note}</td>
                    </tr>
                  )}
                  noDataMessage="No work log history available."
                />

                <TableSection
                  title="Required Inventory"
                  icon={Archive}
                  headers={["Item Name", "Item Type", "Quantity"]}
                  data={job.inventory}
                  renderRow={(item) => (
                    <tr key={item.name}>
                      <td className="py-2 px-4">{item.name}</td>
                      <td className="py-2 px-4">{item.type}</td>
                      <td className="py-2 px-4">{item.quantity}</td>
                    </tr>
                  )}
                  noDataMessage="No required inventory."
                />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* ============== ⬇️ เพิ่มปุ่ม Next ⬇️ ============== */}
        <motion.button
          className="absolute right-4 md:right-8 p-3 rounded-full bg-zinc-800/70 hover:bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          onClick={(e) => {
            e.stopPropagation(); // หยุดไม่ให้ event click ทะลุไปปิด Modal
            onNext();
          }}
          disabled={!canNext}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
        {/* ============== ⬆️ จบส่วนปุ่ม Next ⬆️ ============== */}

      </div>
    </>
  );
}

// --- 6. Helper Components (เหมือนเดิม) ---
// (InfoItem และ TableSection เหมือนเดิม ไม่ต้องแก้)

// Helper Component: InfoItem
function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </h4>
      <p className="text-base text-white ml-6">{value}</p>
    </div>
  );
}

// Helper Component: TableSection
function TableSection<T>({
  title,
  icon: Icon,
  headers,
  data,
  renderRow,
  noDataMessage,
}: {
  title: string;
  icon: React.ElementType;
  headers: string[];
  data: T[];
  renderRow: (item: T) => React.ReactNode;
  noDataMessage: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {title}
      </h3>
      <div className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800/50">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-700/50">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="py-2 px-4 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700">
            {data.length > 0 ? (
              data.map(renderRow)
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="py-4 px-4 text-center text-zinc-400"
                >
                  {noDataMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}