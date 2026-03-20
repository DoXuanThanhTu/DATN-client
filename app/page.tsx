"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, Flame, Loader2, Clock } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: categories = [], isLoading: isLoadingCats } = useCategoryData();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/posts");
        setProducts(res.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* HEADER */}
        {/* <div className="bg-orange-500 p-6 pb-12 rounded-b-[40px] text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black italic uppercase">
              RE-COMMERCE
            </h1>
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span className="text-sm font-bold">Toàn quốc</span>
            </div>
          </div>
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bạn đang tìm gì?"
              className="w-full p-4 pl-12 rounded-2xl text-gray-800 outline-none"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div> */}

        {/* CATEGORY */}
        <div className="max-w-4xl mx-auto px-4 -mt-8 pt-20">
          {/* <div className="bg-white rounded-3xl p-6 grid grid-cols-4 gap-4 shadow-sm">
          {isLoadingCats ? (
            <div className="col-span-4 flex justify-center py-6">
              <Loader2 className="animate-spin text-orange-500" />
            </div>
          ) : (
            categories.map((cat: any) => (
              <Link
                key={cat._id}
                href={`/search?cat=${cat.slug}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="p-4 rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                  📦
                </div>
                <span className="text-[10px] md:text-xs font-bold text-center line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            ))
          )}
        </div> */}
          <CategoryHierarchy
            categories={categories}
            isLoadingCats={isLoadingCats}
          />
          {/* PRODUCTS */}
          <div className="mt-8">
            <h2 className="font-bold flex items-center gap-2 mb-4 text-gray-800">
              <Flame className="text-orange-500 fill-orange-500" /> Tin mới
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-orange-500" size={32} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <Link key={p._id} href={`/post/${p._id}`} className="group">
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full border border-gray-100">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={p.images[0] || "/no-image.png"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt={p.title}
                        />
                      </div>

                      <div className="p-3 flex flex-col flex-1 justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug min-h-[2.5rem]">
                            {p.title}
                          </p>
                          <p className="text-orange-600 font-bold text-base">
                            {p.price.toLocaleString()} đ
                          </p>
                        </div>

                        {/* Thông tin phụ (Địa điểm) */}
                        <div className="mt-3 pt-2 border-t border-gray-50 flex items-center text-[10px] text-gray-400 flex justify-between">
                          <div className="flex items-center">
                            <MapPin size={10} className="mr-1" />
                            <span className="truncate">
                              {p.location?.provinceName || "Toàn quốc"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={10} className="ml-1" />
                            <span className="ml-1">
                              {formatDate(p.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
