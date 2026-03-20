"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, X, Loader2 } from "lucide-react";
import { useHydratedStore } from "@/hooks/useHydratedStore";
import UserMenu from "./UserMenu";
import { useAuthStore } from "@/app/store/useAuthStore";
import api from "@/app/services/api"; // Giả định bạn có axios instance

export default function Navbar() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const user = useHydratedStore(useAuthStore, (state) => state.user);
  const isHydrating = user === undefined;

  // 1. Xử lý Debounce Search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setShowResults(true);
      try {
        const res = await api.get(`/posts?keyword=${searchTerm}&limit=5`);
        setSearchResults(res.data.data || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Chờ 500ms sau khi ngừng gõ mới gọi API

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 2. Đóng kết quả khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?keyword=${searchTerm}`);
      setShowResults(false);
    }
  };

  const handlePostClick = () => {
    if (!user) {
      setIsModalOpen(true);
      return;
    }
    router.push("/post");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/"
              className="text-orange-500 font-black text-2xl italic tracking-tighter"
            >
              CHỢ TỐT
            </Link>
          </div>

          {/* Search Bar with Debounce & Results */}
          <div className="flex-1 max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm && setShowResults(true)}
                placeholder="Tìm sản phẩm..."
                className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-4 pr-12 outline-none text-sm font-medium focus:ring-2 focus:ring-orange-200 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-yellow-400 rounded-md hover:bg-yellow-500 transition-colors"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
              </button>
            </form>

            {/* Floating Search Results */}
            {showResults && searchTerm.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((post: any) => (
                      <Link
                        key={post._id}
                        href={`/post/${post.slug}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={post.images[0] || "/no-image.png"}
                          alt={post.title}
                          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {post.title}
                          </p>
                          <p className="text-xs text-orange-600 font-bold">
                            {post.price.toLocaleString("vi-VN")} đ
                          </p>
                        </div>
                      </Link>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full py-2.5 text-center text-sm text-blue-600 font-medium bg-gray-50 hover:bg-gray-100"
                    >
                      Xem tất cả kết quả cho "{searchTerm}"
                    </button>
                  </div>
                ) : (
                  !isLoading && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Không tìm thấy sản phẩm nào khớp với "{searchTerm}"
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Actions */}
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
      )}{" "}
    </>
  );
}
