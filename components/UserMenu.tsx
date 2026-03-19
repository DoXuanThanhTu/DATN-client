"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import {
  ChevronDown,
  Heart,
  History,
  Settings,
  LogOut,
  HelpCircle,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/app/store/useAuthStore";

export default function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
          <img
            src={
              user.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
            }
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${
            isMenuOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-3 w-70 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-100">
          <div className="p-4 flex flex-col items-center border-b border-gray-50 bg-gray-50/50">
            <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-orange-100 p-0.5 bg-white">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                }
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <h4 className="font-extrabold text-gray-800 line-clamp-1">
              {user.name}
            </h4>
            <p className="text-[11px] text-gray-500 line-clamp-1">
              {user.email}
            </p>
          </div>

          <div className="max-h-100 overflow-y-auto p-2 space-y-1">
            <MenuSection title="Tiện ích">
              <MenuItem icon={<Heart size={18} />} label="Tin đăng đã lưu" />
              <MenuItem icon={<History size={18} />} label="Lịch sử xem tin" />
              <MenuItem icon={<Star size={18} />} label="Đánh giá từ tôi" />
            </MenuSection>

            <MenuSection title="Khác">
              <MenuItem
                icon={<Settings size={18} />}
                label="Cài đặt tài khoản"
              />
              <MenuItem icon={<HelpCircle size={18} />} label="Trợ giúp" />
              <div
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
              >
                <MenuItem
                  icon={<LogOut size={18} />}
                  label="Đăng xuất"
                  color="text-red-500"
                />
              </div>
            </MenuSection>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-2">
      <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {title}
      </p>
      {children}
    </div>
  );
}

interface MenuItemProps {
  icon: ReactNode;
  label: string;
  color?: string;
  onClick?: () => void;
}

function MenuItem({
  icon,
  label,
  color = "text-gray-600",
  onClick,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 rounded-xl transition-all group text-left"
    >
      <span
        className={`${color} group-hover:scale-110 transition-transform duration-200`}
      >
        {icon}
      </span>
      <span className="text-[14px] font-bold text-gray-700 group-hover:text-orange-600 transition-colors">
        {label}
      </span>
    </button>
  );
}
