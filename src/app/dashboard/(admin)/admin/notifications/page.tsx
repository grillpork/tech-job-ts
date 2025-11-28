'use client';

import React, { useState, useMemo } from 'react';
import { Bell, X, Clock, User, MessageSquare, UserPlus, Briefcase, FileText, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNotificationStore, type NotificationType } from '@/stores/notificationStore';
import { useUserStore } from '@/stores/features/userStore';
import { useRouter } from 'next/navigation';

interface TypeConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const {
    getNotificationsForUser,
    getUnreadCountForUser,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  // Get notifications filtered for current user
  const notifications = useMemo(() => {
    if (!currentUser) return [];
    return getNotificationsForUser(currentUser.id, currentUser.role);
  }, [currentUser, getNotificationsForUser]);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return getUnreadCountForUser(currentUser.id, currentUser.role);
  }, [currentUser, getUnreadCountForUser]);

  const getTypeConfig = (type: NotificationType): TypeConfig => {
    const configs: Record<NotificationType, TypeConfig> = {
      job_created: {
        label: 'งานใหม่',
        bgColor: 'bg-blue-500/10 dark:bg-blue-500/10',
        textColor: 'text-blue-400 dark:text-blue-400',
        icon: Briefcase
      },
      job_updated: {
        label: 'อัปเดตงาน',
        bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/10',
        textColor: 'text-indigo-400 dark:text-indigo-400',
        icon: Briefcase
      },
      job_completed: {
        label: 'งานเสร็จสิ้น',
        bgColor: 'bg-green-500/10 dark:bg-green-500/10',
        textColor: 'text-green-400 dark:text-green-400',
        icon: CheckCircle2
      },
      report_submitted: {
        label: 'รายงานใหม่',
        bgColor: 'bg-amber-500/10 dark:bg-amber-500/10',
        textColor: 'text-amber-400 dark:text-amber-400',
        icon: FileText
      },
      report_assigned: {
        label: 'มอบหมายรายงาน',
        bgColor: 'bg-purple-500/10 dark:bg-purple-500/10',
        textColor: 'text-purple-400 dark:text-purple-400',
        icon: FileText
      },
      report_resolved: {
        label: 'แก้ไขรายงาน',
        bgColor: 'bg-green-500/10 dark:bg-green-500/10',
        textColor: 'text-green-400 dark:text-green-400',
        icon: CheckCircle2
      },
      user_created: {
        label: 'ผู้ใช้ใหม่',
        bgColor: 'bg-teal-500/10 dark:bg-teal-500/10',
        textColor: 'text-teal-400 dark:text-teal-400',
        icon: UserPlus
      },
      inventory_low: {
        label: 'อุปกรณ์ใกล้หมด',
        bgColor: 'bg-red-500/10 dark:bg-red-500/10',
        textColor: 'text-red-400 dark:text-red-400',
        icon: Package
      },
      task_assigned: {
        label: 'มอบหมายงาน',
        bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/10',
        textColor: 'text-cyan-400 dark:text-cyan-400',
        icon: Briefcase
      },
      message: {
        label: 'ข้อความ',
        bgColor: 'bg-amber-500/10 dark:bg-amber-500/10',
        textColor: 'text-amber-400 dark:text-amber-400',
        icon: MessageSquare
      },
      comment: {
        label: 'ความคิดเห็น',
        bgColor: 'bg-purple-500/10 dark:bg-purple-500/10',
        textColor: 'text-purple-400 dark:text-purple-400',
        icon: MessageSquare
      },
      job_assigned: {
        label: 'มอบหมายงาน',
        bgColor: 'bg-blue-500/10 dark:bg-blue-500/10',
        textColor: 'text-blue-400 dark:text-blue-400',
        icon: Briefcase
      },
      job_status_changed: {
        label: 'สถานะงานเปลี่ยน',
        bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/10',
        textColor: 'text-indigo-400 dark:text-indigo-400',
        icon: Briefcase
      },
      inventory_request_created: {
        label: 'คำขอเบิกวัสดุ',
        bgColor: 'bg-orange-500/10 dark:bg-orange-500/10',
        textColor: 'text-orange-400 dark:text-orange-400',
        icon: Package
      },
      inventory_request_approved: {
        label: 'อนุมัติเบิกวัสดุ',
        bgColor: 'bg-green-500/10 dark:bg-green-500/10',
        textColor: 'text-green-400 dark:text-green-400',
        icon: CheckCircle2
      },
      inventory_request_rejected: {
        label: 'ปฏิเสธเบิกวัสดุ',
        bgColor: 'bg-red-500/10 dark:bg-red-500/10',
        textColor: 'text-red-400 dark:text-red-400',
        icon: AlertCircle
      },
      system: {
        label: 'ระบบ',
        bgColor: 'bg-gray-500/10 dark:bg-gray-500/10',
        textColor: 'text-gray-400 dark:text-gray-400',
        icon: AlertCircle
      }
    };
    return configs[type] || configs.system;
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 dark:bg-blue-600 flex items-center justify-center shadow-lg">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  NOTIFICATIONS
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => {
            const typeConfig = getTypeConfig(notification.type);
            const Icon = typeConfig.icon;

            return (
              <div
                key={notification.id}
                className={`group relative bg-white dark:bg-[#1a1a1a] rounded-xl border transition-all duration-200 hover:shadow-lg dark:hover:bg-[#1f1f1f] ${notification.read
                  ? 'border-gray-200 dark:border-gray-800'
                  : 'border-blue-200 dark:border-blue-900/30 shadow-sm'
                  }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Status Indicator */}
                    <div className="flex-shrink-0 mt-1">
                      {!notification.read ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500 hover:scale-125 transition-transform"
                          title="Mark as read"
                        />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 dark:border-gray-700" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {typeConfig.label}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete notification"
                        >
                          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                        {notification.title}
                      </h3>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {notification.description}
                      </p>

                      <div className="flex items-center justify-between">
                        {notification.user && (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {notification.user}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{notification.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You&apos;re all caught up! Check back later for updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;