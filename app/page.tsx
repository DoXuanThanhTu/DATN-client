"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Smartphone,
  Laptop,
  Watch,
  Camera,
  MapPin,
  Flame,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import api from "@/app/services/api";

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  createdAt: string;
  location: {
    provinceName: string;
    wardName: string;
    fullAddress: string;
  };
}

const CATEGORIES = [
  {
    id: 1,
    name: "Điện thoại",
    icon: <Smartphone size={24} />,
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: 2,
    name: "Laptop",
    icon: <Laptop size={24} />,
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: 3,
    name: "Đồng hồ",
    icon: <Watch size={24} />,
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: 4,
    name: "Máy ảnh",
    icon: <Camera size={24} />,
    color: "bg-green-50 text-green-600",
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/posts");
        setProducts(response.data.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách tin:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return diffInSeconds <= 0 ? "Vừa xong" : `${diffInSeconds} giây trước`;
    }

    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }

    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    }

    if (diffInDays < 30) {
      return `${diffInDays} ngày trước`;
    }

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-orange-500 p-6 pb-12 rounded-b-[40px] shadow-lg text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black tracking-tighter italic uppercase">
              RE-COMMERCE
            </h1>
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span className="text-sm font-bold">Toàn quốc</span>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Bạn đang tìm món đồ gì?"
              className="w-full p-4 pl-12 rounded-2xl border-none shadow-xl outline-none text-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={22}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-4xl p-6 shadow-sm grid grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`p-4 rounded-2xl ${cat.color} group-hover:scale-110 transition-transform shadow-sm`}
              >
                {cat.icon}
              </div>
              <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-tighter">
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <Flame className="text-orange-500" fill="currentColor" /> Tin đăng
              mới nhất
            </h2>
            <Link
              href="/all"
              className="text-sm font-bold text-orange-600 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p className="font-medium">Đang tải tin đăng...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <Link
                  key={product._id}
                  href={`/post/${product._id}`}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-gray-100"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <img
                      src={
                        product.images[0] ||
                        "https://placehold.co/400?text=No+Image"
                      }
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-10">
                      {product.title}
                    </h3>
                    <p className="text-base font-black text-orange-600">
                      {product.price.toLocaleString()} đ
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
                      <span>{formatTime(product.createdAt)}</span>
                      <span className="truncate max-w-20">
                        {product.location.provinceName}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-4xl text-gray-400 font-bold">
              Chưa có tin đăng nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
