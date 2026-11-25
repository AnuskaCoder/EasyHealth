import React from "react";
import {
  Bell,
  Calendar,
  Pill,
  FileText,
  AlertTriangle,
  X,
  ChevronRight,
  Package,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { NotificationItem } from "../../types";

export const NotificationToastContainer: React.FC = () => {
  const { notifications, markNotificationRead, setCurrentPage } = useApp();

  // Show only unread notifications (up to 3 simultaneously)
  const unreadList = notifications.filter((n) => !n.read).slice(0, 3);

  if (unreadList.length === 0) return null;

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar size={16} className="text-blue-500" />;
      case "medicine":
        return <Pill size={16} className="text-amber-500" />;
      case "report":
        return <FileText size={16} className="text-emerald-500" />;
      case "order":
        return <Package size={16} className="text-purple-500" />;
      case "emergency":
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <Bell size={16} className="text-blue-500" />;
    }
  };

  const handleAction = (notif: NotificationItem) => {
    markNotificationRead(notif.id);
    if (notif.actionPage) {
      setCurrentPage(notif.actionPage);
    }
  };

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {unreadList.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-white border border-gray-200/90 rounded-2xl shadow-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300"
        >
          <div className="bg-gray-100 p-2 rounded-xl flex-shrink-0 mt-0.5">
            {getIcon(notif.type)}
          </div>
          <div className="flex-1 min-w-0" onClick={() => handleAction(notif)}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-900 truncate">{notif.title}</p>
              <span className="text-[10px] text-gray-400">{notif.time}</span>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
              {notif.message}
            </p>
            {notif.actionPage && (
              <button className="text-[11px] text-blue-600 font-bold flex items-center gap-0.5 mt-1 hover:underline">
                View Details <ChevronRight size={12} />
              </button>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              markNotificationRead(notif.id);
            }}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
