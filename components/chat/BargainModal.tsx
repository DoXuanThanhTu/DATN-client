"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  X,
  Tag,
  Send,
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

const MAX_MSG_LENGTH = 50;

// ─── Bargain Modal ───────────────────────────────────────────────────────────
interface BargainModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductData;
  onSend: (offerPrice: number, message: string) => Promise<void>;
}

function BargainModal({ open, onClose, product, onSend }: BargainModalProps) {
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [message, setMessage] = useState("Để cho mình giá này nhé sóp!");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setOfferPrice("");
      setMessage("Để cho mình giá này nhé sóp!");
      setSent(false);
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const discountOptions = [
    { label: "-5%", pct: 0.05 },
    { label: "-10%", pct: 0.1 },
    { label: "-15%", pct: 0.15 },
  ];

  const applyDiscount = (pct: number) => {
    const discounted = Math.round((product.price * (1 - pct)) / 1000) * 1000;
    setOfferPrice(discounted.toString());
  };

  const handleSend = async () => {
    const price = parseInt(offerPrice.replace(/\D/g, ""), 10);
    if (!price || price <= 0) return;
    setIsSending(true);
    try {
      await onSend(price, message);
      setSent(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      // error handled by parent
    } finally {
      setIsSending(false);
    }
  };

  const formattedOffer = offerPrice
    ? parseInt(offerPrice.replace(/\D/g, ""), 10).toLocaleString("vi-VN")
    : "";

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "slideUp 0.25s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
          <h2 className="text-base font-bold text-gray-900">Trả giá</h2>
          <div className="w-8" />
        </div>

        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Product preview */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <img
              src={product.images?.[0] || "/placeholder.png"}
              alt={product.title}
              className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-200"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                {product.title}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {product.price.toLocaleString("vi-VN")} đ
              </p>
            </div>
          </div>

          {/* Message input */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Nhập tin nhắn <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, MAX_MSG_LENGTH))
                }
                placeholder="Nhập lời nhắn cho người bán..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
              />
              {message && (
                <button
                  onClick={() => setMessage("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <p className="text-right text-[11px] text-gray-400 mt-1">
              {message.length}/{MAX_MSG_LENGTH}
            </p>
          </div>

          {/* Offer price input */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Giá muốn trả
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formattedOffer}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setOfferPrice(raw);
                }}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition text-right font-semibold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                đ
              </span>
            </div>
          </div>

          {/* Discount quick-picks */}
          <div className="flex gap-2">
            {discountOptions.map((opt) => {
              const val =
                Math.round((product.price * (1 - opt.pct)) / 1000) * 1000;
              return (
                <button
                  key={opt.label}
                  onClick={() => applyDiscount(opt.pct)}
                  className="flex-1 text-center text-xs font-semibold border border-gray-200 rounded-xl py-2.5 hover:border-yellow-400 hover:bg-yellow-50 transition-all active:scale-95"
                  style={{ color: "#555" }}
                >
                  <span className="text-gray-800">
                    {val.toLocaleString("vi-VN")} đ
                  </span>
                  <br />
                  <span className="text-gray-400">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Send button */}
          {sent ? (
            <div className="w-full py-3.5 rounded-xl bg-green-500 text-white font-bold text-center text-sm flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> Đã gửi thành công!
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={!offerPrice || isSending}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: !offerPrice || isSending ? "#e5e7eb" : "#FACC15",
                color: !offerPrice || isSending ? "#9ca3af" : "#1a1a1a",
              }}
            >
              {isSending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Đang gửi...
                </span>
              ) : (
                <>
                  <Send size={16} /> Gửi
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const params = useParams();
  const identity = params?.id;
  const router = useRouter();

  const { user: currentUser } = useAuthStore();
  const { selectUser, getConversations, sendMessage } = useChatStore();

  const [data, setData] = useState<ProductData | null>(null);
  const [related, setRelated] = useState<ProductData[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showBargain, setShowBargain] = useState(false);

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
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
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

  // ── Handle bargain offer: init conversation then send message directly ──────
  const handleBargainSend = async (offerPrice: number, message: string) => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để trả giá!");
      throw new Error("Unauthenticated");
    }
    if (!data?.seller) throw new Error("No seller");

    const fullMessage = `💰 Trả giá: ${offerPrice.toLocaleString("vi-VN")} đ\n${message}`;

    await getConversations();
    await selectUser(data.seller);
    await sendMessage(fullMessage);
  };

  const handleOpenBargain = () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để trả giá!");
      return;
    }
    setShowBargain(true);
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
              {isOwner ? (
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
                <>
                  {/* Trả giá button — only show when negotiable */}
                  {data.priceNegotiable && (
                    <button
                      onClick={handleOpenBargain}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all active:scale-95 text-gray-900"
                      style={{ background: "#FACC15" }}
                    >
                      <Tag size={18} /> Trả giá
                    </button>
                  )}

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

      {/* SẢN PHẨM LIÊN QUAN */}
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
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-10">
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
          <div className="text-gray-500">Không có tin đăng liên quan</div>
        )}
      </div>

      {/* BARGAIN MODAL */}
      {data && (
        <BargainModal
          open={showBargain}
          onClose={() => setShowBargain(false)}
          product={data}
          onSend={handleBargainSend}
        />
      )}
    </div>
  );
}
