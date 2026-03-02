import React, { useState, useEffect } from "react";
import { Notification } from "@/entities/Notification";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bell, 
  CheckCircle2, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Pagination, { usePagination } from "../components/Pagination";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, isLoading: isLoadingUser } = useCurrentUser();

  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      loadNotifications(currentUser);
    } else if (!isLoadingUser && !currentUser) {
      setError("יש להתחבר כדי לצפות בהתראות");
      setIsLoadingData(false);
    }
  }, [currentUser, isLoadingUser]);

  const loadNotifications = async (user) => {
    setIsLoadingData(true);
    try {
      const userNotifications = await Notification.filter(
        { user_id: user.id }, 
        "-created_date", 
        50
      );
      setNotifications(userNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setError("שגיאה בטעינת ההתראות");
    }
    setIsLoadingData(false);
  };

  const isLoading = isLoadingUser || isLoadingData;

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          Notification.update(n.id, { is_read: true })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationTypeInfo = (type) => {
    const types = {
      message: { label: "הודעה חדשה", color: "bg-blue-100 text-blue-800", icon: "💌" },
      service_approved: { label: "שירות אושר", color: "bg-green-100 text-green-800", icon: "✅" },
      post_liked: { label: "לייק להודעה", color: "bg-pink-100 text-pink-800", icon: "❤️" },
      gratitude_received: { label: "תודה התקבלה", color: "bg-yellow-100 text-yellow-800", icon: "🙏" },
      profile_updated: { label: "פרופיל עודכן", color: "bg-purple-100 text-purple-800", icon: "👤" },
      system: { label: "הודעת מערכת", color: "bg-gray-100 text-gray-800", icon: "📢" }
    };
    return types[type] || types.system;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const { page, setPage, pageItems: pageNotifications, totalPages } = usePagination(notifications, 10);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200 rounded-lg"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 flex items-center justify-center" dir="rtl">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-8 h-8 text-purple-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-purple-800">מרכז ההתראות</h1>
              <p className="text-purple-600">
                {unreadCount > 0 ? `${unreadCount} התראות חדשות` : 'כל ההתראות נקראו'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                סמן הכל כנקרא
              </Button>
            )}
            <Button
              onClick={loadData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              רענן
            </Button>
          </div>
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-4">
          <AnimatePresence>
            {pageNotifications.length > 0 ? (
              pageNotifications.map((notification, index) => {
                const typeInfo = getNotificationTypeInfo(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`${notification.is_read ? 'bg-white/70' : 'bg-white shadow-lg border-l-4 border-l-purple-500'} hover:shadow-xl transition-all duration-200`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="text-2xl">
                              {notification.icon || typeInfo.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className={`font-bold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                  {notification.title}
                                </h3>
                                <Badge className={`${typeInfo.color} text-xs`}>
                                  {typeInfo.label}
                                </Badge>
                                {!notification.is_read && (
                                  <Badge variant="secondary" className="text-xs">
                                    חדש
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm leading-relaxed mb-3 ${notification.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {new Date(notification.created_date).toLocaleDateString('he-IL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {notification.action_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      window.open(notification.action_url, '_blank');
                                      if (!notification.is_read) {
                                        markAsRead(notification.id);
                                      }
                                    }}
                                  >
                                    צפה
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {!notification.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                title="סמן כנקרא"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNotification(notification.id)}
                              title="מחק התראה"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">אין התראות חדשות</h3>
                <p className="text-gray-500">התראות חדשות יופיעו כאן</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="mt-6 mb-4"
          />
        </div>
      </div>
    </div>
  );
}
