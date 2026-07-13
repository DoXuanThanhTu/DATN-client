"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import {
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Heart,
  Star,
  Send,
  Info,
  CheckCircle2,
  ShoppingCart,
  PackageX,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/app/services/api";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useChatStore } from "@/app/store/useChatStore";
import { User } from "@/app/types/chat";
import NegotiateModal from "@/components/chat/NegotiateModal";

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
    soldCount?: number;
    responseRate?: number;
    rating?: number;
    reviewCount?: number;
  };
  status?: string;
}
interface ReviewItem {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

interface ReviewStats {
  avgRating: number;
  totalCount: number;
  ratingBreakdown: Record<string, number>; // { "1": 0, "2": 1, ... "5": 10 }
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
  const isTracked = useRef<string | null>(null);
  const { user: currentUser } = useAuthStore();
  const { selectUser, getConversations } = useChatStore();

  const [data, setData] = useState<ProductData | null>(null);
  const [related, setRelated] = useState<ProductData[]>([]);
  const [recommendations, setRecommendations] = useState<ProductData[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNegotiateOpen, setIsNegotiateOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [dealPrice, setDealPrice] = useState("");
  const [quickMessage, setQuickMessage] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const handleSavePost = async () => {
    if (!currentUser) {
      toast.error("Bạn chưa đăng nhập");
      return;
    }
    try {
      const response = await api.post(`/favorites/${identity}`);
      const data = response.data;
      if (data.success) {
        setIsSaved(!isSaved);
        toast.success(isSaved ? "Đã bỏ lưu tin" : "Đã lưu tin thành công");
      }
    } catch (error) {
      console.error("Lỗi khi lưu tin:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };
  const handleNegotiateSend = async (amount: number, userMessage: string) => {
    if (!currentUser || !data?.seller) return;
    try {
      await selectUser(data.seller);
      const offerDetails = {
        productId: data._id,
        productName: data.title,
        productImage: data.images?.[0] || "/placeholder.png",
        originalPrice: data.price,
        offeredPrice: amount,
      };
      await useChatStore
        .getState()
        .sendMessage(
          userMessage ||
            `Tôi muốn trả giá sản phẩm này ${amount.toLocaleString()}đ`,
          "offer",
          offerDetails,
        );
      toast.success("Đã gửi đề nghị trả giá thành công!");
      setIsNegotiateOpen(false);
    } catch (error) {
      console.error("Lỗi khi gửi trả giá:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };
  useEffect(() => {
    if (!data?.seller?._id) return;

    const fetchSellerReviews = async () => {
      try {
        setIsLoadingReviews(true);
        const res = await api.get(`/reviews/user/${data.seller._id}/stats`);
        setReviews(res.data.data.reviews || []);
        setReviewStats(res.data.data.stats || null);
      } catch (error) {
        console.error("Lỗi khi lấy đánh giá người bán:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchSellerReviews();
  }, [data?.seller?._id]);
  useEffect(() => {
    if (!identity) return;
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<{
          data: ProductData;
          related: ProductData[];
        }>(`/posts/${identity}`);
        setData(response.data.data);
        setRelated(response.data.related || []);
        setActiveImg(0);
        await api.post("/users/interaction", { type: "view", post: identity });
        const recommendations = await api.get(`/recommend/hybrid/${identity}`);
        setRecommendations(recommendations.data.data);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFavorite = async () => {
      try {
        const res = await api.get("/favorites");
        const favorites: { post: { _id: string } }[] = res.data.data || [];
        setIsSaved(favorites.some((fav) => fav.post._id === identity));
      } catch (error) {
        console.error("Lỗi khi lấy danh sách yêu thích:", error);
      }
    };

    fetchProduct();
    if (currentUser) fetchFavorite();

    window.scrollTo(0, 0);
  }, [identity, currentUser]);

  const handleChat = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để chat với người bán!");
      return;
    }
    if (!data?.seller) return;
    const sellerId = data.seller._id || data.seller.id;
    if (sellerId === currentUser.id) {
      toast.error("Đây là bài đăng của bạn!");
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
  const handleBuy = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để mua hàng!");
      return;
    }
    if (!data?.seller) return;
    const sellerId = data.seller._id || data.seller.id;
    if (sellerId === currentUser.id) {
      toast.error("Đây là bài đăng của bạn!");
      return;
    }
    router.push("/checkout?id=" + data?._id);
  };

  const handleSendDeal = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }
    const amount = parseInt(dealPrice.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      toast.error("Vui lòng nhập giá hợp lệ");
      return;
    }
    await handleNegotiateSend(
      amount,
      `Tôi muốn trả giá sản phẩm này ${amount.toLocaleString()}đ`,
    );
    setDealPrice("");
  };

  const handleQuickMessage = async () => {
    if (!quickMessage.trim()) return;
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }
    if (!data?.seller) return;
    try {
      await selectUser(data.seller);
      await useChatStore.getState().sendMessage(quickMessage, "text");
      setQuickMessage("");
      toast.success("Đã gửi tin nhắn thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const isOwner = useMemo(() => {
    if (!data?.seller || !currentUser) return false;
    return data.seller._id === currentUser.id;
  }, [data?.seller, currentUser]);

  const sellerStatus = useMemo(() => {
    if (!data?.seller?.lastActive)
      return { text: "Ngoại tuyến", online: false };
    const diff = Date.now() - new Date(data.seller.lastActive).getTime();
    if (diff < 5 * 60 * 1000) return { text: "Đang hoạt động", online: true };
    return {
      text: `Hoạt động ${formatTime(data.seller.lastActive)}`,
      online: false,
    };
  }, [data?.seller?.lastActive]);

  if (isLoading)
    return (
      <div className="bg-[#f4f4f4] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* MAIN CARD SKELETON */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT: Image skeleton */}
              <div>
                <div className="bg-gray-200 rounded-lg aspect-square mb-3 animate-pulse" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-md bg-gray-200 animate-pulse shrink-0"
                    />
                  ))}
                </div>
              </div>

              {/* RIGHT: Info skeleton */}
              <div className="flex flex-col gap-4">
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-full" />
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                  </div>
                  <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse shrink-0" />
                </div>

                <div className="h-9 bg-gray-200 rounded animate-pulse w-40" />

                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-56" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
                </div>

                {/* CTA buttons */}
                <div className="flex gap-3">
                  <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse" />
                </div>

                {/* Seller card */}
                <div className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                    </div>
                  </div>
                </div>

                {/* Quick message */}
                <div className="h-11 bg-gray-200 rounded-lg animate-pulse" />

                {/* Deal giá */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-11 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="w-20 h-11 bg-gray-200 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DESCRIPTION SKELETON */}
          <div className="bg-white rounded-lg shadow-sm p-5 mb-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-36" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-4 bg-gray-200 rounded animate-pulse ${i === 4 ? "w-2/3" : "w-full"}`}
                />
              ))}
            </div>
          </div>

          {/* RELATED PRODUCTS SKELETON */}
          <div className="mb-4">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-48 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100"
                >
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <div className="p-2.5 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  const isOwnerPreview =
    !data?.seller || !currentUser ? false : data.seller._id === currentUser.id;

  if (!data || (data.status !== "active" && !isOwnerPreview))
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f4f4] px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <PackageX size={32} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Không tìm thấy tin đăng
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Tin đăng này không tồn tại hoặc đã bị ẩn.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#f5a623] text-white py-2.5 px-6 rounded-lg font-bold text-sm hover:bg-[#e09610] transition-all"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );

  return (
    <div className="bg-[#f4f4f4] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* MAIN CARD */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT: Images */}
            <div>
              {/* Main image */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square mb-3 group">
                <img
                  src={data.images?.[activeImg] || "/placeholder.png"}
                  className="w-full h-full object-contain"
                  alt={data.title}
                />
                {/* Image counter */}
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeImg + 1}/{data.images?.length || 1}
                </div>
                {data.images?.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImg((prev) => (prev > 0 ? prev - 1 : prev))
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImg((prev) =>
                          prev < data.images.length - 1 ? prev + 1 : prev,
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {data.images?.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImg(index)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                      activeImg === index
                        ? "border-[#f5a623] opacity-100"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Info + Seller */}
            <div className="flex flex-col gap-4">
              {/* Title + Save */}
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl font-bold text-gray-900 leading-snug flex-1">
                  {data.title}
                </h1>
                {isOwner ? null : (
                  <button
                    onClick={() => handleSavePost()}
                    className={`cursor-pointer flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                      isSaved
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
                    {isSaved ? "Đã lưu" : "Lưu"}
                  </button>
                )}
              </div>
              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-[#e53935]">
                  {data.price?.toLocaleString()} đ
                </span>
              </div>

              {/* Location & Time */}
              <div className="flex flex-col gap-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="shrink-0 text-gray-400" />
                  <span className="truncate">{data.location?.fullAddress}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="shrink-0 text-gray-400" />
                  <span>Cập nhật {formatTime(data.createdAt)}</span>
                </div>
              </div>

              {/* CTA buttons — only for non-owner */}
              {isOwner ? (
                <div className="space-y-2">
                  <div className="bg-orange-50 border border-orange-100 text-orange-700 p-3 rounded-lg text-center font-medium text-sm">
                    Đây là bài đăng của bạn
                  </div>
                  <button
                    onClick={() => router.push(`/post/edit/${data._id}`)}
                    className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all"
                  >
                    Chỉnh sửa tin đăng
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    {data.seller?.phone && (
                      <div className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-all">
                        <Phone size={16} />
                        {data.seller?.phone || "Chưa có SĐT"}
                      </div>
                    )}
                    <button
                      onClick={handleChat}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#f5a623] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#e09610] transition-all cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      Chat
                    </button>
                  </div>
                  <button
                    onClick={handleBuy}
                    className="w-full flex items-center justify-center gap-2 bg-[#e53935] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#d32f2f] transition-all cursor-pointer"
                  >
                    <ShoppingCart size={16} />
                    Mua ngay
                  </button>
                </div>
              )}

              {/* Seller info */}
              {!isOwner && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <Link
                    href={`/user/${data.seller._id}`}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {data.seller?.avatar ? (
                        <img
                          src={data.seller.avatar}
                          alt={data.seller.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {data.seller?.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm">
                          {data.seller?.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs mt-0.5">
                          {sellerStatus.online ? (
                            <>
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                              <span className="text-green-600 font-medium">
                                {sellerStatus.text}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">
                              {sellerStatus.text}
                            </span>
                          )}
                          {data.seller.responseRate != null && (
                            <span className="text-gray-400 ml-1">
                              · Phản hồi: {data.seller.responseRate}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-center shrink-0 ml-3">
                      {reviewStats && reviewStats.totalCount > 0 ? (
                        <>
                          <div className="flex items-center gap-1 justify-center">
                            <span className="font-bold text-gray-800 text-sm">
                              {reviewStats.avgRating.toFixed(1)}
                            </span>
                            <Star
                              size={13}
                              className="text-yellow-400 fill-yellow-400"
                            />
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {reviewStats.totalCount} đánh giá
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-gray-400 max-w-[70px] leading-tight">
                          Chưa có đánh giá nào
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {/* Quick message */}
              {!isOwner && (
                <div className="flex gap-2 items-center border border-gray-200 rounded-lg px-3 py-2">
                  <input
                    type="text"
                    value={quickMessage}
                    onChange={(e) => setQuickMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQuickMessage()}
                    placeholder="Nhắn hỏi mua hàng..."
                    className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  />
                  <button
                    onClick={handleQuickMessage}
                    className="w-8 h-8 bg-[#f5a623] rounded-full flex items-center justify-center shrink-0 hover:bg-[#e09610] transition-colors"
                  >
                    <Send size={14} className="text-white ml-0.5" />
                  </button>
                </div>
              )}

              {/* Deal giá */}
              {!isOwner && data.priceNegotiable && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Deal giá
                  </p>
                  <div className="flex gap-2 items-stretch">
                    <div className="flex-1 relative border border-gray-200 rounded-lg overflow-hidden">
                      <input
                        type="text"
                        value={dealPrice}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");

                          if (!raw) {
                            setDealPrice("");
                            return;
                          }

                          const value = Number(raw);

                          if (value > data.price) {
                            setDealPrice(
                              Number(data.price).toLocaleString("vi-VN"),
                            );
                            return;
                          }

                          setDealPrice(value.toLocaleString("vi-VN"));
                        }}
                        placeholder="Nhập giá bạn mong muốn"
                        className="w-full px-3 py-3 text-sm outline-none pr-8 text-gray-700 placeholder-gray-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        đ
                      </span>
                    </div>
                    <button
                      onClick={handleSendDeal}
                      className="px-4 bg-[#f5a623] text-white font-bold text-sm rounded-lg hover:bg-[#e09610] transition-colors"
                    >
                      Trả giá
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Giá gốc: {data.price?.toLocaleString()} đ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESCRIPTION + COMMENTS */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5 mb-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">
            Mô tả chi tiết
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {data.description}
          </p>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-800 mb-3">
              Bài đăng cùng danh mục
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {related.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {recommendations.length > 0 && (
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-800 mb-3">
              Có thể bạn quan tâm
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {recommendations.slice(0, 10).map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Negotiate modal */}
      {isNegotiateOpen && data && (
        <NegotiateModal
          product={{
            title: data.title,
            price: data.price,
            image: data.images?.[0] || "/placeholder.png",
          }}
          onClose={() => setIsNegotiateOpen(false)}
          onSend={handleNegotiateSend}
        />
      )}
    </div>
  );
}

function ProductCard({ item }: { item: any }) {
  return (
    <Link href={`/post/${item._id}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full flex flex-col">
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <img
            src={item.images?.[0] || "/placeholder.png"}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-2.5 flex flex-col flex-1 gap-1">
          <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
            {item.title}
          </h4>
          <p className="text-sm font-bold text-[#e53935]">
            {item.price.toLocaleString()} đ
          </p>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-auto">
            <MapPin size={10} />
            <span className="truncate">
              {item.location?.provinceName || "Toàn quốc"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
