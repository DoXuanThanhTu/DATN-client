"use client";

import { useChatStore } from "@/app/store/useChatStore";
import {
  Bell,
  Package,
  MessageCircle,
  Info,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { formatDistanceToNow, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

// --- Interfaces ---
interface INotificationSender {
  _id: string;
  name: string;
  avatar?: string;
}

export interface INotification {
  _id: string;
  type: "ORDER" | "CHAT" | "SYSTEM" | string;
  sender: INotificationSender;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: string | Date;
}

// Helper hook để kiểm tra mount mà không dùng useEffect + setState
// Tránh lỗi "cascading renders"
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function NotificationMenu() {
  const {
    notifications,
    unreadCount,
    getNotifications,
    markAsRead,
    markAllAsRead,
  } = useChatStore() as {
    notifications: INotification[];
    unreadCount: number;
    getNotifications: () => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
  };

  const [isOpen, setIsOpen] = useState(false);
  const isClient = useIsClient(); // Thay thế hoàn toàn setHasMounted
  const menuRef = useRef<HTMLDivElement>(null);

  // Effect này bây giờ chỉ tập trung vào Side Effects ngoại vi (API, Event Listener)
  useEffect(() => {
    if (!isClient) return;

    getNotifications();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isClient, getNotifications]);

  const formatTimeSafe = (dateInput: string | Date | undefined) => {
    if (!isClient || !dateInput) return "Vừa xong";
    const date = new Date(dateInput);
    if (!isValid(date)) return "Vừa xong";
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  };

  const renderNotificationLeading = (noti: INotification) => {
    if (noti.sender?.avatar) {
      return (
        <img
          src={noti.sender.avatar}
          alt={noti.sender.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
        />
      );
    }
    const iconClass =
      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-gray-50";
    switch (noti.type) {
      case "ORDER":
        return (
          <div className={iconClass}>
            <Package className="text-orange-500" size={18} />
          </div>
        );
      case "CHAT":
        return (
          <div className={iconClass}>
            <MessageCircle className="text-blue-500" size={18} />
          </div>
        );
      default:
        return (
          <div className={iconClass}>
            <Info className="text-purple-500" size={18} />
          </div>
        );
    }
  };

  const handleMarkAsRead = (id: string) => {
    if (!id || id === "undefined") return;
    markAsRead(id);
    setIsOpen(false);
  };

  // SSR Placeholder
  if (!isClient) {
    return (
      <div className="p-2 opacity-0">
        <Bell size={22} />
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-full transition-all relative group focus:outline-none"
      >
        <Bell
          size={22}
          className={`${isOpen ? "text-blue-600" : "text-gray-600"} group-hover:scale-110 transition-transform`}
        />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full border-2 border-white px-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white shadow-2xl rounded-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="p-4 border-b flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <h3 className="font-bold text-gray-900 text-lg">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 font-semibold transition-colors"
              >
                <CheckCheck size={14} /> Đọc hết
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <Inbox size={32} className="text-gray-200" />
                <p className="text-gray-400 text-sm italic">
                  Không có thông báo mới
                </p>
              </div>
            ) : (
              notifications.map((noti) => (
                <Link
                  key={noti._id}
                  href={noti.link || "#"}
                  onClick={() => handleMarkAsRead(noti._id)}
                  className={`flex gap-3 px-4 py-4 border-b border-gray-50 last:border-0 transition-all hover:bg-gray-50 ${
                    !noti.isRead ? "bg-blue-50/40" : "bg-white"
                  }`}
                >
                  <div className="relative shrink-0">
                    {renderNotificationLeading(noti)}
                    {!noti.isRead && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm mb-0.5 truncate ${!noti.isRead ? "font-bold text-gray-900" : "text-gray-600"}`}
                    >
                      {noti.sender?.name || "Hệ thống"}
                    </p>
                    <p
                      className={`text-[13px] line-clamp-2 mb-2 ${!noti.isRead ? "text-gray-800" : "text-gray-500"}`}
                    >
                      {noti.content}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {formatTimeSafe(noti.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block p-4 text-center text-sm font-bold text-blue-600 hover:bg-gray-50 transition-all border-t"
          >
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
}
