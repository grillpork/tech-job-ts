// src/app/dashboard/(admin)/admin/history/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
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
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuditLogStore, type AuditLog, type AuditAction, type AuditEntityType } from "@/stores/features/auditLogStore";

// --- 1. Types ---
const ACTION_ICONS: Record<AuditAction, React.ElementType> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  approve: CheckCircle,
  reject: XCircle,
  assign: Users,
  unassign: Users,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  create: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-600/30 dark:text-green-300 dark:border-green-500/50",
  update: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-600/30 dark:text-blue-300 dark:border-blue-500/50",
  delete: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-600/30 dark:text-red-300 dark:border-red-500/50",
  approve: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-600/30 dark:text-emerald-300 dark:border-emerald-500/50",
  reject: "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-600/30 dark:text-orange-300 dark:border-orange-500/50",
  assign: "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-600/30 dark:text-purple-300 dark:border-purple-500/50",
  unassign: "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-600/30 dark:text-gray-300 dark:border-gray-500/50",
};

const ENTITY_ICONS: Record<AuditEntityType, React.ElementType> = {
  job: ClipboardList,
  inventory: Package,
  user: User,
  report: FileText,
  inventory_request: Package,
  completion_request: CheckCircle,
};

const ACTION_LABELS: Record<AuditAction, string> = {
  create: "เพิ่ม",
  update: "แก้ไข",
  delete: "ลบ",
  approve: "อนุมัติ",
  reject: "ปฏิเสธ",
  assign: "มอบหมาย",
  unassign: "ยกเลิกการมอบหมาย",
};

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  job: "งาน",
  inventory: "สินค้า",
  user: "ผู้ใช้",
  report: "รายงาน",
  inventory_request: "คำขอสินค้า",
  completion_request: "คำขอเสร็จสิ้นงาน",
};

// --- 2. Action Badge Component ---
const ActionBadge = ({ action }: { action: AuditAction }) => {
  const Icon = ACTION_ICONS[action];
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 ${ACTION_COLORS[action]}`}
    >
      <Icon className="w-3 h-3" />
      {ACTION_LABELS[action]}
    </span>
  );
};

// --- 3. Helper Functions ---
const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), "dd/MM/yyyy HH:mm:ss");
  } catch {
    return dateString;
  }
};

const formatDateShort = (dateString: string): string => {
  try {
    return format(parseISO(dateString), "dd/MM/yy HH:mm");
  } catch {
    return dateString;
  }
};

// --- 4. Component หลักของหน้า History ---
export default function HistoryPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [filterAction, setFilterAction] = useState<AuditAction | "all">("all");
  const [filterEntity, setFilterEntity] = useState<AuditEntityType | "all">("all");
  const { auditLogs } = useAuditLogStore();

  // กรองและเรียง audit logs
  const filteredLogs = useMemo(() => {
    let filtered = [...auditLogs];
    
    if (filterAction !== "all") {
      filtered = filtered.filter((log) => log.action === filterAction);
    }
    
    if (filterEntity !== "all") {
      filtered = filtered.filter((log) => log.entityType === filterEntity);
    }
    
    // เรียงตาม timestamp (ใหม่สุดก่อน)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
  }, [auditLogs, filterAction, filterEntity]);

  useEffect(() => {
    if (typeof selectedIndex === "number") {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [selectedIndex]);

  const selectedLog =
    typeof selectedIndex === "number" ? filteredLogs[selectedIndex] : null;

  const canPrevious = typeof selectedIndex === "number" && selectedIndex > 0;
  const canNext =
    typeof selectedIndex === "number" && selectedIndex < filteredLogs.length - 1;

  const handleNext = () => {
    if (canNext) {
      setSelectedIndex(selectedIndex! + 1);
    }
  };

  const handlePrevious = () => {
    if (canPrevious) {
      setSelectedIndex(selectedIndex! - 1);
    }
  };

  return (
    <div className="p-4 md:p-8 text-zinc-900 dark:text-white bg-gray-50 dark:bg-zinc-900 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ประวัติการกระทำ (Audit Log)</h1>
        
        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as AuditAction | "all")}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          >
            <option value="all">ทุกการกระทำ</option>
            {Object.entries(ACTION_LABELS).map(([action, label]) => (
              <option key={action} value={action}>{label}</option>
            ))}
          </select>
          
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value as AuditEntityType | "all")}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          >
            <option value="all">ทุกประเภท</option>
            {Object.entries(ENTITY_LABELS).map(([entity, label]) => (
              <option key={entity} value={entity}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-16 h-16 mx-auto text-gray-400 dark:text-zinc-600 mb-4" />
          <p className="text-lg text-gray-500 dark:text-zinc-400">
            ยังไม่มีประวัติการกระทำ
          </p>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mt-2">
            การกระทำต่างๆ ในระบบจะถูกบันทึกไว้ที่นี่
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.map((log, index) => (
            <AuditLogCard
              key={log.id}
              log={log}
              onClick={() => setSelectedIndex(index)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedLog && (
          <AuditLogDetailModal
            key={selectedLog.id}
            log={selectedLog}
            onClose={() => setSelectedIndex(null)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            canNext={canNext}
            canPrevious={canPrevious}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 5. Component Card สรุป ---
function AuditLogCard({ log, onClick }: { log: AuditLog; onClick: () => void }) {
  const EntityIcon = ENTITY_ICONS[log.entityType];
  
  return (
    <motion.div
      layoutId={`card-container-${log.id}`}
      onClick={onClick}
      className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-4 cursor-pointer border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-500 transition-colors"
      whileHover={{
        scale: 1.03,
        transition: { type: "spring", stiffness: 400, damping: 20 },
      }}
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
    >
      <div className="flex justify-between items-start mb-2">
        <ActionBadge action={log.action} />
        <span className="text-xs text-gray-500 dark:text-zinc-400">
          {formatDateShort(log.timestamp)}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <EntityIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
        <span className="text-xs text-gray-500 dark:text-zinc-400">
          {ENTITY_LABELS[log.entityType]}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1 truncate">
        {log.entityName}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-zinc-300 mt-2">
        โดย: {log.performedBy.name} ({log.performedBy.role})
      </p>
      
      {log.details && (
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
          {log.details}
        </p>
      )}
    </motion.div>
  );
}

// --- 6. Component Modal (Popup) ---
function AuditLogDetailModal({
  log,
  onClose,
  onNext,
  onPrevious,
  canNext,
  canPrevious,
}: {
  log: AuditLog;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canNext: boolean;
  canPrevious: boolean;
}) {
  const EntityIcon = ENTITY_ICONS[log.entityType];
  
  const modalContent = (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* ปุ่ม Previous */}
        <motion.button
          className="absolute left-4 md:left-8 p-3 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-gray-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          onClick={(e) => {
            e.stopPropagation();
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

        {/* ตัว Modal Content หลัก */}
        <motion.div
          layoutId={`card-container-${log.id}`}
          className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-gray-200 dark:border-zinc-700"
          onClick={(e) => e.stopPropagation()}
          transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
        >
          <motion.div
            className="flex flex-col w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.1 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {/* Header ของ Modal */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <EntityIcon className="w-6 h-6 text-gray-500 dark:text-zinc-400" />
                <div>
                  <h2 className="text-2xl font-bold">{log.entityName}</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {ENTITY_LABELS[log.entityType]} • ID: {log.entityId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ActionBadge action={log.action} />
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* ข้อมูลพื้นฐาน */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    icon={User}
                    label="ผู้ดำเนินการ"
                    value={`${log.performedBy.name} (${log.performedBy.role})`}
                  />
                  <InfoItem
                    icon={Clock}
                    label="วันที่และเวลา"
                    value={formatDate(log.timestamp)}
                  />
                  <InfoItem
                    icon={EntityIcon}
                    label="ประเภท"
                    value={ENTITY_LABELS[log.entityType]}
                  />
                  <InfoItem
                    icon={AlertCircle}
                    label="การกระทำ"
                    value={ACTION_LABELS[log.action]}
                  />
                </div>

                {/* รายละเอียด */}
                {log.details && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Scroll className="w-5 h-5" />
                      รายละเอียด
                    </h3>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-gray-200 dark:border-zinc-700">
                      <p className="text-sm text-gray-700 dark:text-zinc-300">
                        {log.details}
                      </p>
                    </div>
                  </div>
                )}

                {/* การเปลี่ยนแปลง (สำหรับ update) */}
                {log.changes && log.changes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      การเปลี่ยนแปลง
                    </h3>
                    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-800/50">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-zinc-700/50">
                          <tr>
                            <th scope="col" className="py-2 px-4 font-medium">ฟิลด์</th>
                            <th scope="col" className="py-2 px-4 font-medium">ค่าเดิม</th>
                            <th scope="col" className="py-2 px-4 font-medium">ค่าใหม่</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                          {log.changes.map((change, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-4 font-medium">{change.field}</td>
                              <td className="py-2 px-4 text-gray-600 dark:text-zinc-400">
                                {typeof change.oldValue === "object" 
                                  ? JSON.stringify(change.oldValue) 
                                  : String(change.oldValue || "N/A")}
                              </td>
                              <td className="py-2 px-4 text-gray-900 dark:text-white">
                                {typeof change.newValue === "object" 
                                  ? JSON.stringify(change.newValue) 
                                  : String(change.newValue || "N/A")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Metadata (ถ้ามี) */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      ข้อมูลเพิ่มเติม
                    </h3>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-gray-200 dark:border-zinc-700">
                      <pre className="text-xs text-gray-700 dark:text-zinc-300 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ปุ่ม Next */}
        <motion.button
          className="absolute right-4 md:right-8 p-3 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-gray-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          onClick={(e) => {
            e.stopPropagation();
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
      </motion.div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// --- 7. Helper Components ---
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
      <h4 className="text-sm font-medium text-gray-500 dark:text-zinc-400 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </h4>
      <p className="text-base text-zinc-900 dark:text-white ml-6">{value}</p>
    </div>
  );
}
