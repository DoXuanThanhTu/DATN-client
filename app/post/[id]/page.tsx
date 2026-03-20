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
  Flame,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
    provinceName?: string;
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
  const [related, setRelated] = useState<ProductData[]>([]); // Lưu sản phẩm liên quan
  const [activeImg, setActiveImg] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!identity) return;
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        // Controller mới trả về { success, data, related }
        const response = await api.get<{
          data: ProductData;
          related: ProductData[];
        }>(`/posts/${identity}`);
        setData(response.data.data);
        setRelated(response.data.related || []);
        setActiveImg(0); // Reset ảnh về tấm đầu tiên khi đổi sản phẩm
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi xem sản phẩm khác
  }, [identity]);

  const handleChat = async () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để chat với người bán!");
      return;
    }
    if (!data?.seller) return;
    const sellerId = data.seller._id || data.seller.id;
    if (sellerId === currentUser.id) {
      alert("Đây là bài đăng của bạn!");
      return;
    }
    try {
      await getConversations();
      await selectUser(data.seller);
      router.push("/chat");
    } catch (error) {
      console.error("Lỗi khi mở chat:", error);
    }
  };
  const isOwner = useMemo(() => {
    if (!data?.seller || !currentUser) return false;
    return data.seller._id === currentUser.id;
  }, [data?.seller, currentUser]);
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
    return <div className="p-10 text-center text-gray-500">Đang tải...</div>;
  if (!data)
    return (
      <div className="p-10 text-center text-gray-500">
        Không tìm thấy sản phẩm.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHI TIẾT SẢN PHẨM */}
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() =>
                    setActiveImg((prev) =>
                      prev < data.images.length - 1 ? prev + 1 : prev,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
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
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 ${activeImg === index ? "border-orange-500 scale-95" : "border-transparent opacity-70"}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
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
                <MapPin size={18} />{" "}
                <span className="truncate">{data.location?.fullAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} /> Đăng {formatTime(data.createdAt)}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">
                Mô tả sản phẩm
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px]">
                {data.description}
              </p>
            </div>
          </div>
        </div>

        {/* NGƯỜI BÁN */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {data.seller?.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {data.seller?.name}
                </p>
                <div className="text-xs mt-1 font-medium">{sellerStatus}</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {/* <a
                href={`tel:${data.seller?.phone}`}
                className="flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm active:scale-95"
              >
                <Phone size={20} /> {data.seller?.phone || "Gọi điện"}
              </a> */}
              {isOwner ? (
                // HIỂN THỊ KHI LÀ CHỦ BÀI ĐĂNG
                <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-100 text-orange-700 p-3 rounded-xl text-center font-medium text-sm">
                    Đây là bài đăng của bạn
                  </div>
                  <button
                    onClick={() => router.push(`/post/edit/${data._id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all active:scale-95"
                  >
                    Chỉnh sửa tin đăng
                  </button>
                </div>
              ) : (
                // HIỂN THỊ KHI LÀ NGƯỜI MUA
                <>
                  {/* <a
                    href={`tel:${data.seller?.phone}`}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm active:scale-95"
                  >
                    <Phone size={20} /> {data.seller?.phone || "Gọi điện"}
                  </a> */}
                  <button
                    onClick={handleChat}
                    className="flex items-center justify-center gap-2 border-2 border-orange-500 text-orange-500 py-3.5 rounded-xl font-bold hover:bg-orange-50 transition-all active:scale-95"
                  >
                    <MessageCircle size={20} /> Chat ngay
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SẢN PHẨM LIÊN QUAN (MỚI THÊM) */}
      <div className="mt-12 min-h-40">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-gray-800">
          Tin đăng tương tự
        </h2>
        {related.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((item) => (
              <Link key={item._id} href={`/post/${item._id}`} className="group">
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 h-full flex flex-col">
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <img
                      src={item.images?.[0] || "/placeholder.png"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem]">
                        {item.title}
                      </h4>
                      <p className="text-red-600 font-bold text-sm mt-1">
                        {item.price.toLocaleString()} đ
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2">
                      <MapPin size={12} />
                      <span className="truncate">
                        {item.location?.provinceName || "Toàn quốc"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className=" text-gray-500">Không có tin đăng liên quan</div>
        )}
      </div>
    </div>
  );
}
