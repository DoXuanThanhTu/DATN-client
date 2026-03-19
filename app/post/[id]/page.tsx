"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/services/api";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useChatStore } from "@/app/store/useChatStore";
import { User } from "@/app/types/chat";

interface ProductData {
  _id: string;
  title: string;
  price: number;
  description: string;
  images: string[];
  priceNegotiable: boolean;
  location: {
    fullAddress: string;
  };
  createdAt: string;
  seller: User & {
    lastActive?: string;
    phone?: string;
  };
}

const formatTime = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Vừa xong";
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  if (diffInDays < 7) return `${diffInDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
};

export default function ProductDetail() {
  const params = useParams();
  const identity = params?.id;
  const router = useRouter();

  const { user: currentUser } = useAuthStore();
  const { selectUser, getConversations } = useChatStore();

  const [data, setData] = useState<ProductData | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!identity) return;
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<{ data: ProductData }>(
          `/posts/${identity}`,
        );
        setData(response.data.data);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [identity]);

  const handleChat = async () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để chat với người bán!");
      return;
    }

    if (!data?.seller) return;

    const sellerId = data.seller._id || data.seller.id;
    const myId = currentUser.id || currentUser.id;

    if (sellerId === myId) {
      alert("Đây là bài đăng của bạn, bạn không thể tự chat với chính mình!");
      return;
    }

    try {
      await getConversations();
      await selectUser(data.seller);
      router.push("/chat");
    } catch (error) {
      console.error("Lỗi khi mở chat:", error);
      alert("Không thể kết nối với người bán lúc này.");
    }
  };

  const sellerStatus = useMemo(() => {
    if (!data?.seller?.lastActive) return "Ngoại tuyến";
    const diff = Date.now() - new Date(data.seller.lastActive).getTime();
    if (diff < 5 * 60 * 1000)
      return (
        <span className="flex items-center gap-1 text-green-500 font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          Đang hoạt động
        </span>
      );
    return `Hoạt động ${formatTime(data.seller.lastActive)}`;
  }, [data?.seller?.lastActive]);

  if (isLoading)
    return (
      <div className="p-10 text-center text-gray-500">Đang tải sản phẩm...</div>
    );
  if (!data)
    return (
      <div className="p-10 text-center text-gray-500">
        Không tìm thấy sản phẩm.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 min-h-screen">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm relative group">
          <div className="aspect-4/3 bg-zinc-100 flex items-center justify-center">
            <img
              src={data.images?.[activeImg] || "/placeholder.png"}
              className="w-full h-full object-contain"
              alt={data.title}
            />
          </div>

          {data.images?.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveImg((prev) => (prev > 0 ? prev - 1 : prev))
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() =>
                  setActiveImg((prev) =>
                    prev < data.images.length - 1 ? prev + 1 : prev,
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {data.images?.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImg(index)}
              className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                activeImg === index
                  ? "border-orange-500 scale-95"
                  : "border-transparent opacity-70"
              }`}
            >
              <img
                src={img}
                className="w-full h-full object-cover"
                alt={`thumb-${index}`}
              />
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {data.title}
          </h1>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-red-600">
              {data.price?.toLocaleString()} đ
            </span>
            <div className="flex items-center gap-1 text-[13px] text-green-700 bg-green-50 px-3 py-1.5 rounded-full font-bold">
              <ShieldCheck size={16} />
              {data.priceNegotiable ? "Có thể thương lượng" : "Giá cố định"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 border-y py-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-gray-400" />
              <span className="truncate">
                {data.location?.fullAddress || "Toàn quốc"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              Đăng {formatTime(data.createdAt)}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">
              Mô tả sản phẩm
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px]">
              {data.description || "Không có mô tả cho sản phẩm này."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-linear-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {data.seller?.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {data.seller?.name || "Người bán"}
                </p>
                <div className="text-xs mt-1 font-medium">{sellerStatus}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={`tel:${data.seller?.phone}`}
              className="flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm active:scale-95"
            >
              <Phone size={20} /> {data.seller?.phone || "Gọi điện"}
            </a>
            <button
              onClick={handleChat}
              className="flex items-center justify-center gap-2 bg-white border-2 border-orange-500 text-orange-500 py-3.5 rounded-xl font-bold hover:bg-orange-50 transition-all active:scale-95"
            >
              <MessageCircle size={20} /> Chat ngay
            </button>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-bold text-gray-800 mb-4">
              Trả giá cho sản phẩm
            </h3>
            <div className="relative mb-4">
              <input
                type="number"
                placeholder="Nhập giá đề xuất..."
                className="w-full p-4 pr-12 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                đ
              </span>
            </div>
            <button className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all active:scale-95">
              Gửi đề nghị
            </button>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 border border-amber-100">
          <Info className="text-amber-500 shrink-0" size={20} />
          <p className="text-[12px] text-amber-800 leading-snug">
            <b>Mẹo an toàn:</b> Luôn kiểm tra sản phẩm tại nơi công cộng, không
            chuyển khoản trước khi nhận hàng.
          </p>
        </div>
      </div>
    </div>
  );
}
