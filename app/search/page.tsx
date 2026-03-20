"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/app/services/api";
import { useLocationData } from "@/hooks/useLocationData";
import { useCategoryData } from "@/hooks/useCategoryData";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import Footer from "@/components/Footer";

interface Category {
  _id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface Location {
  Code: string;
  Name: string;
  Wards?: {
    Code: string;
    Name: string;
  }[];
}

interface Product {
  _id: string;
  title: string;
  slug: string;
  price: number;
  description: string;
  images: string[];
  location: {
    provinceName: string;
  };
  createdAt: string;
}

const SearchContent = () => {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const catSlug = searchParams.get("cat") || "";

  const [sortBy, setSortBy] = useState("newest");
  const { data: locations } = useLocationData() as {
    data: Location[] | undefined;
  };
  const { data: categories, isLoading: isCatLoading } = useCategoryData() as {
    data: Category[] | undefined;
    isLoading: boolean;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPage: 1,
    totalResult: 0,
  });

  const [tempFilters, setTempFilters] = useState({
    min: "",
    max: "",
    provinceCode: "",
    wardCode: "",
    parentCategoryId: "",
    categoryId: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    min: "",
    max: "",
    provinceCode: "",
    wardCode: "",
    parentCategoryId: "",
    categoryId: "",
    page: 1,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      if (catSlug && !isCatLoading && categories && categories.length > 0) {
        let foundParentId = "";
        let foundChildId = "";

        for (const parent of categories) {
          if (parent.slug === catSlug) {
            foundParentId = parent._id;
            break;
          }
          const child = parent.children?.find((c) => c.slug === catSlug);
          if (child) {
            foundParentId = parent._id;
            foundChildId = child._id;
            break;
          }
        }

        const newCatFilter = {
          parentCategoryId: foundParentId,
          categoryId: foundChildId,
        };

        setTempFilters((prev) => ({ ...prev, ...newCatFilter }));
        setAppliedFilters((prev) => ({ ...prev, ...newCatFilter, page: 1 }));
        setIsReady(true);
      } else if (!catSlug) {
        setIsReady(true);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [catSlug, categories, isCatLoading]);

  const fetchProducts = useCallback(async () => {
    if (!isReady) return;

    setLoading(true);
    try {
      const finalCategoryId =
        appliedFilters.categoryId || appliedFilters.parentCategoryId;

      const response = await api.get(`/posts`, {
        params: {
          keyword,
          categoryId: finalCategoryId,
          min: appliedFilters.min,
          max: appliedFilters.max,
          provinceCode: appliedFilters.provinceCode,
          wardCode: appliedFilters.wardCode,
          page: appliedFilters.page,
          sortBy,
          limit: 10,
        },
      });

      setProducts(response.data.data || []);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPage: response.data.pagination.totalPage,
        totalResult: response.data.pagination.totalResult,
      });
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [keyword, appliedFilters, sortBy, isReady]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProducts]);

  const availableSubCats = useMemo(() => {
    if (!tempFilters.parentCategoryId || !categories) return [];
    return (
      categories.find((cat) => cat._id === tempFilters.parentCategoryId)
        ?.children || []
    );
  }, [tempFilters.parentCategoryId, categories]);

  const handleApplyFilter = () =>
    setAppliedFilters({ ...tempFilters, page: 1 });

  const handleReset = () => {
    const reset = {
      min: "",
      max: "",
      provinceCode: "",
      wardCode: "",
      parentCategoryId: "",
      categoryId: "",
    };
    setTempFilters(reset);
    setAppliedFilters({ ...reset, page: 1 });
  };

  return (
    <div>
      <div className="bg-gray-50 min-h-screen pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-1/4 space-y-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                <div className="flex justify-between items-center mb-5 border-b pb-3">
                  <span className="font-bold text-gray-700">Bộ lọc</span>
                  <button
                    onClick={handleReset}
                    className="text-xs text-orange-500 font-medium hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-3">
                    Danh mục
                  </label>
                  <select
                    value={tempFilters.parentCategoryId}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        parentCategoryId: e.target.value,
                        categoryId: "",
                      })
                    }
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-orange-400 bg-gray-50 mb-3"
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {availableSubCats.length > 0 && (
                    <select
                      value={tempFilters.categoryId}
                      onChange={(e) =>
                        setTempFilters({
                          ...tempFilters,
                          categoryId: e.target.value,
                        })
                      }
                      className="w-full border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-orange-400 bg-orange-50/20"
                    >
                      <option value="">Tất cả loại sản phẩm</option>
                      {availableSubCats.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-6">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-3">
                    Khoảng giá (VNĐ)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Từ"
                      value={tempFilters.min}
                      onChange={(e) =>
                        setTempFilters({ ...tempFilters, min: e.target.value })
                      }
                      className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-orange-400"
                    />
                    <span className="text-gray-300">-</span>
                    <input
                      type="number"
                      placeholder="Đến"
                      value={tempFilters.max}
                      onChange={(e) =>
                        setTempFilters({ ...tempFilters, max: e.target.value })
                      }
                      className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-3">
                    Địa điểm
                  </label>
                  <select
                    value={tempFilters.provinceCode}
                    onChange={(e) =>
                      setTempFilters({
                        ...tempFilters,
                        provinceCode: e.target.value,
                        wardCode: "",
                      })
                    }
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-orange-400 bg-gray-50 mb-3"
                  >
                    <option value="">Toàn quốc</option>
                    {locations?.map((loc) => (
                      <option key={loc.Code} value={loc.Code}>
                        {loc.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleApplyFilter}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98]"
                >
                  ÁP DỤNG BỘ LỌC
                </button>
              </div>
            </aside>

            <main className="w-full md:w-3/4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                {isReady && (
                  <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
                    <span className="text-sm text-gray-500 italic">
                      Tìm thấy <b>{pagination.totalResult}</b> tin đăng{" "}
                      {keyword && `cho "${keyword}"`}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">
                        Sắp xếp:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg p-2 outline-none bg-white focus:border-orange-400"
                      >
                        <option value="newest">Tin mới nhất</option>
                        <option value="price_asc">Giá thấp nhất</option>
                        <option value="price_desc">Giá cao nhất</option>
                      </select>
                    </div>
                  </div>
                )}

                {loading || !isReady ? (
                  <div className="divide-y divide-gray-100">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="p-4 flex gap-5 animate-pulse">
                        <div className="w-32 h-32 md:w-44 md:h-44 bg-gray-100 rounded-lg"></div>
                        <div className="flex-1 space-y-4 py-2">
                          <div className="h-5 bg-gray-100 w-3/4 rounded"></div>
                          <div className="h-8 bg-gray-100 w-1/4 rounded"></div>
                          <div className="h-4 bg-gray-100 w-1/2 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {products.map((item) => (
                      <Link
                        key={item._id}
                        href={`/post/${item.slug}`}
                        className="p-4 flex gap-5 hover:bg-gray-50/80 transition-all group cursor-pointer"
                      >
                        <div className="relative w-32 h-32 md:w-44 md:h-44 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100">
                          <img
                            src={item.images[0] || "/no-image.png"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={item.title}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h3 className="text-sm md:text-lg font-semibold text-gray-800 line-clamp-2 uppercase group-hover:text-orange-600 transition-colors">
                              {item.title}
                            </h3>
                            <div className="text-red-600 font-black text-lg md:text-xl italic mt-2">
                              {item.price.toLocaleString()} đ
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] md:text-xs text-gray-500 pt-3">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              Cá nhân
                            </span>
                            <span>
                              {item.location?.provinceName || "Toàn quốc"}
                            </span>
                            <span className="ml-auto opacity-70">
                              {new Date(item.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-24 text-center">
                    <h3 className="text-lg font-bold text-gray-700">
                      Không tìm thấy kết quả
                    </h3>
                    <p className="text-gray-400 mt-2 text-sm">
                      Vui lòng thử lại với bộ lọc khác.
                    </p>
                  </div>
                )}
              </div>

              {!loading && isReady && products.length > 0 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPage={pagination.totalPage}
                  onPageChange={(page) =>
                    setAppliedFilters((prev) => ({ ...prev, page }))
                  }
                />
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
