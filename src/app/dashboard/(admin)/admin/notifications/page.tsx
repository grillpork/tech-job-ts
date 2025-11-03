'use client';

import React, { useState } from 'react';
import { Bell, X, Clock, User, MessageSquare, UserPlus } from 'lucide-react';

interface Notification {
  id: number;
  type: 'new_user' | 'message' | 'comment' | 'connect';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  read: boolean;
}

interface TypeConfig {
  label: string;
  bgColor: string;
  textColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'new_user',
      title: 'New Registration: Finibus Benorum et Malorum',
      description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium',
      user: 'Allen Bee',
      timestamp: '24 Nov 2018 at 9:36 AM',
      read: false
    },
    {
      id: 2,
      type: 'message',
      title: 'Darren Smith sent new message',
      description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium',
      user: 'Darren',
      timestamp: '24 Nov 2018 at 9:36 AM',
      read: false
    },
    {
      id: 3,
      type: 'comment',
      title: 'Arin Ganslkram Commented on post',
      description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium',
      user: 'Arin Ganslkram',
      timestamp: '24 Nov 2018 at 9:36 AM',
      read: false
    },
    {
      id: 4,
      type: 'connect',
      title: 'Juliet Ben Connect Allen Depk',
      description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium',
      user: 'Juliet Ben',
      timestamp: '24 Nov 2018 at 9:36 AM',
      read: false
    },
    {
      id: 5,
      type: 'connect',
      title: 'Juliet Ben Connect Allen Depk',
      description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium',
      user: 'Juliet Ben',
      timestamp: '24 Nov 2018 at 9:36 AM',
      read: false
    },
    {
      id: 6,
      type: 'message',
      title: 'Darren Smith sent new message',
      description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium',
      user: 'Juliet Ben',
      timestamp: '24 Nov 2018 at 9:36 AM',
      read: false
    }
  ]);

  const getTypeConfig = (type: Notification['type']): TypeConfig => {
    const configs: Record<Notification['type'], TypeConfig> = {
      new_user: {
        label: 'Joined Platform',
        bgColor: 'bg-teal-500/10 dark:bg-teal-500/10',
        textColor: 'text-teal-400 dark:text-teal-400',
        icon: UserPlus
      },
      message: {
        label: 'Message',
        bgColor: 'bg-amber-500/10 dark:bg-amber-500/10',
        textColor: 'text-amber-400 dark:text-amber-400',
        icon: MessageSquare
      },
      comment: {
        label: 'Comment',
        bgColor: 'bg-purple-500/10 dark:bg-purple-500/10',
        textColor: 'text-purple-400 dark:text-purple-400',
        icon: MessageSquare
      },
      connect: {
        label: 'Connect',
        bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/10',
        textColor: 'text-cyan-400 dark:text-cyan-400',
        icon: User
      }
    };
    return configs[type] || configs.message;
  };

  const markAsRead = (id: number): void => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = (): void => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number): void => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
                className={`group relative bg-white dark:bg-[#1a1a1a] rounded-xl border transition-all duration-200 hover:shadow-lg dark:hover:bg-[#1f1f1f] ${
                  notification.read 
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
                          onClick={() => markAsRead(notification.id)}
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
                          onClick={() => deleteNotification(notification.id)}
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
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors">
                          {notification.user}
                        </span>
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