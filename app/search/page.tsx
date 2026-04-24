"use client";
import Select, { StylesConfig } from "react-select";
import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/app/services/api";
import { useLocationData } from "@/hooks/useLocationData";
import { useCategoryData } from "@/hooks/useCategoryData";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import Footer from "@/components/Footer";

// Cập nhật Interface để khớp với dữ liệu thực tế
interface Category {
  _id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface Ward {
  Code: string;
  Name: string;
  FullName: string;
}

interface Location {
  Code: string;
  Name: string;
  FullName: string;
  Wards?: Ward[];
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
    wardName?: string;
    fullAddress?: string;
  };
  createdAt: string;
}

interface SelectOption {
  value: string;
  label: string;
}

const SearchContent = () => {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const catSlug = searchParams.get("cat") || "";

  const [sortBy, setSortBy] = useState<SelectOption>({
    value: "newest",
    label: "Tin mới nhất",
  });

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

  // Options for select components
  const categoryOptions = useMemo((): SelectOption[] => {
    if (!categories) return [];
    return [
      { value: "", label: "Tất cả danh mục" },
      ...categories.map((cat) => ({
        value: cat._id,
        label: cat.name,
      })),
    ];
  }, [categories]);

  const subCategoryOptions = useMemo((): SelectOption[] => {
    if (!tempFilters.parentCategoryId || !categories) return [];
    const parentCat = categories.find(
      (cat) => cat._id === tempFilters.parentCategoryId,
    );
    if (!parentCat?.children) return [];
    return [
      { value: "", label: "Tất cả loại sản phẩm" },
      ...parentCat.children.map((sub) => ({
        value: sub._id,
        label: sub.name,
      })),
    ];
  }, [tempFilters.parentCategoryId, categories]);

  const provinceOptions = useMemo((): SelectOption[] => {
    if (!locations) return [];
    return [
      { value: "", label: "Toàn quốc" },
      ...locations.map((loc) => ({
        value: loc.Code,
        label: loc.FullName,
      })),
    ];
  }, [locations]);

  // Logic lấy Wards dựa trên provinceCode đã chọn
  const availableWards = useMemo((): Ward[] => {
    if (!tempFilters.provinceCode || !locations) return [];
    const selectedLocation = locations.find(
      (loc) => loc.Code === tempFilters.provinceCode,
    );
    return selectedLocation?.Wards || [];
  }, [tempFilters.provinceCode, locations]);

  const wardOptions = useMemo((): SelectOption[] => {
    if (availableWards.length === 0) return [];
    return [
      { value: "", label: "Tất cả Phường/Xã" },
      ...availableWards.map((ward) => ({
        value: ward.Code,
        label: ward.FullName,
      })),
    ];
  }, [availableWards]);

  const sortOptions: SelectOption[] = [
    { value: "newest", label: "Tin mới nhất" },
    { value: "price_asc", label: "Giá thấp nhất" },
    { value: "price_desc", label: "Giá cao nhất" },
  ];

  // Xử lý slug từ URL sang ID bộ lọc
  useEffect(() => {
    const handler = setTimeout(() => {
      if (catSlug && !isCatLoading && categories?.length) {
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
      const response = await api.get(`/posts`, {
        params: {
          keyword,
          ...appliedFilters,
          sortBy: sortBy.value,
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
  }, [keyword, appliedFilters, sortBy.value, isReady]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProducts]);

  const handleApplyFilter = () =>
    setAppliedFilters({ ...tempFilters, page: 1 });

  const customStyles: StylesConfig<SelectOption> = {
    menuList: (base) => ({
      ...base,
      maxHeight: 220,
      overflowY: "auto" as const,
    }),
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? "#f97316" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 1px #f97316" : "none",
      "&:hover": {
        borderColor: "#f97316",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#f97316"
        : state.isFocused
          ? "#fff7ed"
          : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:active": {
        backgroundColor: "#f97316",
      },
    }),
  };

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

  const availableSubCats = useMemo(() => {
    if (!tempFilters.parentCategoryId || !categories) return [];
    return (
      categories.find((cat) => cat._id === tempFilters.parentCategoryId)
        ?.children || []
    );
  }, [tempFilters.parentCategoryId, categories]);

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* ASIDE - BỘ LỌC */}
          <aside className="w-full md:w-1/4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 ">
              <div className="flex justify-between items-center mb-5 border-b pb-3">
                <span className="font-bold text-gray-700">Bộ lọc</span>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 font-medium hover:underline cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>

              {/* Danh mục */}
              <div className="mb-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Danh mục
                </label>
                <Select<SelectOption>
                  options={categoryOptions}
                  styles={customStyles}
                  value={categoryOptions.find(
                    (opt) => opt.value === tempFilters.parentCategoryId,
                  )}
                  onChange={(selected) =>
                    setTempFilters({
                      ...tempFilters,
                      parentCategoryId: selected?.value || "",
                      categoryId: "",
                    })
                  }
                  isSearchable
                  placeholder="Chọn danh mục"
                  className="text-sm mb-2"
                  classNamePrefix="react-select"
                />

                {availableSubCats.length > 0 && (
                  <Select<SelectOption>
                    options={subCategoryOptions}
                    styles={customStyles}
                    value={subCategoryOptions.find(
                      (opt) => opt.value === tempFilters.categoryId,
                    )}
                    onChange={(selected) =>
                      setTempFilters({
                        ...tempFilters,
                        categoryId: selected?.value || "",
                      })
                    }
                    isSearchable
                    placeholder="Chọn loại sản phẩm"
                    className="text-sm animate-in fade-in duration-300"
                    classNamePrefix="react-select"
                  />
                )}
              </div>

              {/* Khoảng giá */}
              <div className="mb-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
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
                    className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-gray-400"
                  />
                  <span className="text-gray-300">-</span>
                  <input
                    type="number"
                    placeholder="Đến"
                    value={tempFilters.max}
                    onChange={(e) =>
                      setTempFilters({ ...tempFilters, max: e.target.value })
                    }
                    className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Địa điểm */}
              <div className="mb-8">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Địa điểm
                </label>
                <Select<SelectOption>
                  options={provinceOptions}
                  styles={customStyles}
                  value={provinceOptions.find(
                    (opt) => opt.value === tempFilters.provinceCode,
                  )}
                  onChange={(selected) =>
                    setTempFilters({
                      ...tempFilters,
                      provinceCode: selected?.value || "",
                      wardCode: "",
                    })
                  }
                  isSearchable
                  placeholder="Chọn tỉnh/thành phố"
                  className="text-sm mb-2"
                  classNamePrefix="react-select"
                />

                {availableWards.length > 0 && (
                  <Select<SelectOption>
                    options={wardOptions}
                    styles={customStyles}
                    value={wardOptions.find(
                      (opt) => opt.value === tempFilters.wardCode,
                    )}
                    onChange={(selected) =>
                      setTempFilters({
                        ...tempFilters,
                        wardCode: selected?.value || "",
                      })
                    }
                    isSearchable
                    placeholder="Tất cả Phường/Xã"
                    className="text-sm"
                    classNamePrefix="react-select"
                  />
                )}
              </div>

              <button
                onClick={handleApplyFilter}
                className="w-full cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-gray-100 active:scale-95"
              >
                ÁP DỤNG BỘ LỌC
              </button>
            </div>
          </aside>

          {/* MAIN - DANH SÁCH SẢN PHẨM */}
          <main className="w-full md:w-3/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
              {isReady && (
                <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
                  <span className="text-sm text-gray-500">
                    Tìm thấy{" "}
                    <b className="text-gray-800">{pagination.totalResult}</b>{" "}
                    tin đăng {keyword && `cho "${keyword}"`}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Sắp xếp:
                    </label>
                    <Select<SelectOption>
                      options={sortOptions}
                      value={sortBy}
                      onChange={(selected) =>
                        setSortBy(
                          selected || {
                            value: "newest",
                            label: "Tin mới nhất",
                          },
                        )
                      }
                      className="w-48 text-sm"
                      classNamePrefix="react-select"
                      styles={{
                        ...customStyles,
                        control: (base) => ({
                          ...base,
                          minHeight: "36px",
                          borderColor: "#e5e7eb",
                        }),
                      }}
                      isSearchable={false}
                    />
                  </div>
                </div>
              )}

              {loading || !isReady ? (
                <div className="divide-y divide-gray-100">
                  {[...Array(5)].map((_, i) => (
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
                      className="p-4 flex gap-5 hover:bg-gray-50 transition-all group"
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
                          <h3 className="text-sm md:text-lg font-semibold text-gray-800 line-clamp-2 uppercase  leading-tight">
                            {item.title}
                          </h3>
                          <div className="text-red-600 font-bold text-lg md:text-xl mt-2">
                            {item.price.toLocaleString()} đ
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] md:text-xs text-gray-400">
                          {/* <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            Cá nhân
                          </span> */}
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {item.location?.wardName
                              ? item.location.wardName +
                                ", " +
                                item.location.provinceName
                              : item.location?.provinceName || "Toàn quốc"}
                          </div>
                          <span className="ml-auto italic">
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
                <div className="py-32 text-center">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700">
                    Không tìm thấy kết quả
                  </h3>
                  <p className="text-gray-400 mt-2 text-sm">
                    Vui lòng thử lại với bộ lọc khác hoặc từ khóa khác.
                  </p>
                </div>
              )}
            </div>

            {!loading && isReady && products.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPage={pagination.totalPage}
                onPageChange={(page: number) =>
                  setAppliedFilters((prev) => ({ ...prev, page }))
                }
              />
            )}
          </main>
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
        <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}
