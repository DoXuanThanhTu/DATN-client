"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, X } from "lucide-react";
import { useHydratedStore } from "@/hooks/useHydratedStore";
import UserMenu from "./UserMenu";
import { useAuthStore } from "@/app/store/useAuthStore";

export default function Navbar() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useHydratedStore(useAuthStore, (state) => state.user);
  const isHydrating = user === undefined;

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "var(--removed-body-scroll-bar-size)";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const handlePostClick = () => {
    if (!user) {
      setIsModalOpen(true);
      return;
    }
    router.push("/post");
  };

  return (
    <>
      <nav className="sticky top-0 z-100 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/"
              className="text-orange-500 font-black text-2xl italic tracking-tighter"
            >
              CHỢ TỐT
            </Link>
          </div>

          <div className="flex-1 max-w-2xl relative">
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-4 pr-12 outline-none text-sm font-medium focus:ring-2 focus:ring-orange-200 transition-all"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-yellow-400 rounded-md hover:bg-yellow-500 transition-colors">
              <Search size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0 min-w-30 justify-end">
            {!isHydrating && !user && (
              <Link
                href="/auth?mode=login"
                className="px-6 py-2 bg-orange-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 shadow-md"
              >
                Đăng nhập
              </Link>
            )}
            {user && <UserMenu />}

            <button
              onClick={handlePostClick}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-black text-xs uppercase hidden sm:block active:scale-95 transition-all shadow-sm"
            >
              ĐĂNG TIN
            </button>
          </div>
        </div>
      </nav>

      {isModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl p-8 w-full max-w-90 shadow-2xl animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-all"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell size={40} strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                Bạn chưa đăng nhập
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Tiếp tục đăng nhập để đăng tin rao vặt và quản lý tin đăng của
                bạn dễ dàng hơn.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href="/auth?mode=login"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-200"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth?mode=register"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3.5 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95"
                >
                  Tạo tài khoản mới
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
