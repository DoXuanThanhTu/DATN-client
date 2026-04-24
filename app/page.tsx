"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Flame, Loader2, Clock, Plus } from "lucide-react";
import Link from "next/link";
import api from "@/app/services/api";
import { useCategoryData } from "@/hooks/useCategoryData";
import CategoryHierarchy from "@/components/CategoryHierarchy";
import Footer from "@/components/Footer";
import formatDate from "@/utils/formatDate";
interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  createdAt: string;
  location: {
    provinceName: string;
  };
}
export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // --- MỚI: Quản lý phân trang ---
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 8; // Chỉ hiện 8 tin mỗi lần

  const { data: categories = [], isLoading: isLoadingCats } = useCategoryData();

  const fetchProducts = async (page: number) => {
    try {
      if (page === 1) setIsLoading(true);
      else setIsFetchingMore(true);

      const res = await api.get(`/posts?page=${page}&limit=${LIMIT}`);
      const newProducts = res.data.data || [];
      const pagination = res.data.pagination;

      // Cộng dồn sản phẩm nếu là trang > 1
      setProducts((prev) =>
        page === 1 ? newProducts : [...prev, ...newProducts],
      );

      // Kiểm tra còn tin để xem thêm không
      setHasMore(page < pagination.totalPage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchProducts(nextPage);
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-5xl mx-auto px-4 pt-20">
          <CategoryHierarchy
            categories={categories}
            isLoadingCats={isLoadingCats}
          />

          <div className="mt-8">
            <h2 className="font-bold flex items-center gap-2 mb-4 text-gray-800">
              <Flame className="text-orange-500 fill-orange-500" /> Tin mới
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={32} />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <Link key={p._id} href={`/post/${p._id}`} className="group">
                      {/* ... Giữ nguyên phần Card Product của bạn ... */}
                      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full border border-gray-100">
                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                          <img
                            src={p.images[0] || "/no-image.png"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={p.title}
                          />
                        </div>
                        <div className="p-3 flex flex-col flex-1 justify-between">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">
                            {p.title}
                          </p>
                          <p className="text-orange-600 font-bold">
                            {p.price.toLocaleString()} đ
                          </p>
                          <div className="mt-3 pt-2 border-t border-gray-50 flex items-center text-[10px] text-gray-400 justify-between">
                            <span className="truncate">
                              {p.location?.provinceName || "Toàn quốc"}
                            </span>
                            <span>{formatDate(p.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* --- MỚI: Nút Xem thêm --- */}
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isFetchingMore}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-500 text-white-600 font-bold rounded-2xl hover:bg-orange-50 transition-all disabled:opacity-50"
                    >
                      {isFetchingMore ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : null}
                      Xem thêm
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
