"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/app/store/useChatStore";
import { useAuthStore } from "@/app/store/useAuthStore";
import { MessageInput } from "./MessageInput";
import { User, Message, Participant } from "@/app/types/chat";
import { ShoppingCart, Inbox } from "lucide-react";
import api from "@/app/services/api";

// --- INTERFACES ---
interface OfferDetails {
  productId: string;
  productName: string;
  productImage: string;
  originalPrice: number;
  offeredPrice: number;
  status: "pending" | "accepted" | "rejected";
}

interface ProductDetails {
  productId: string;
  name: string;
  image: string;
  originalPrice: number;
}

const formatMsgTime = (date: string | Date | undefined) =>
  date
    ? new Date(date).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export const ChatContainer = () => {
  const router = useRouter();
  const {
    selectedConversation,
    messages,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    socket,
    sendMessage,
    onlineUsers,
  } = useChatStore();

  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?.id;
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- LOGIC ĐIỀU HƯỚNG SANG PAGE THANH TOÁN ---
  const goToCheckout = (
    info: OfferDetails | ProductDetails,
    isFromOffer: boolean = false,
  ) => {
    // Ép kiểu hoặc dùng check property để lấy giá trị đúng
    const productId = "productId" in info ? info.productId : "";
    const finalPriceToPay = isFromOffer
      ? (info as OfferDetails).offeredPrice
      : (info as ProductDetails).originalPrice;

    const query = new URLSearchParams({
      id: productId,
      type: isFromOffer ? "negotiated" : "fixed",
      price: finalPriceToPay.toString(),
    }).toString();

    router.push(`/checkout?${query}`);
  };

  // --- QUẢN LÝ SOCKET & MESSAGES ---
  useEffect(() => {
    const cid = selectedConversation?._id;
    if (cid && cid !== "new" && socket) {
      getMessages(cid);
      socket.emit("join_conversation", cid);
      subscribeToMessages();
    }
    return () => {
      if (cid && cid !== "new" && socket) {
        socket.emit("leave_conversation", cid);
      }
      unsubscribeFromMessages();
    };
  }, [
    selectedConversation?._id,
    socket,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  // Tự động cuộn xuống tin nhắn mới
  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const { otherUser, isOnline, statusText } = useMemo(() => {
    const other = selectedConversation?.participants?.find((p: Participant) => {
      const pId = typeof p.userId === "object" ? p.userId._id : p.userId;
      return String(pId) !== String(currentUserId);
    });
    const u = other?.userId as User | undefined;
    const online = u?._id ? onlineUsers.includes(u._id) : false;
    return {
      otherUser: u,
      isOnline: online,
      statusText: online ? "Đang hoạt động" : "Ngoại tuyến",
    };
  }, [selectedConversation, currentUserId, onlineUsers]);

  const handleOfferAction = async (
    msg: Message,
    action: "accepted" | "rejected",
  ) => {
    try {
      await api.put(`/chat/messages/${msg._id}/status`, { status: action });
      const label = action === "accepted" ? "CHẤP NHẬN" : "TỪ CHỐI";
      const offer = msg.offerDetails as OfferDetails;

      await sendMessage(
        `Trạng thái: ${label} trả giá cho "${offer?.productName || "sản phẩm"}"`,
      );

      if (selectedConversation?._id) {
        getMessages(selectedConversation._id);
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái trả giá:", err);
    }
  };

  if (!selectedConversation)
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
        <Inbox size={48} className="mb-2 opacity-20" />
        <p className="text-sm italic">Chọn một cuộc hội thoại để bắt đầu</p>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* HEADER */}
      <header className="px-5 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={
                otherUser?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || "U")}&background=e8d5c0`
              }
              className="w-11 h-11 rounded-full object-cover border border-gray-100"
              alt="Avatar"
            />
            {isOnline && (
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              {otherUser?.name || "Người dùng"}
            </h3>
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300"}`}
              />
              {statusText}
            </p>
          </div>
        </div>
      </header>

      {/* MESSAGES LIST */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-[#f8f9fa]">
        {messages.map((m, idx) => {
          const isMe = String(m.senderId) === String(currentUserId);
          const offer = m.offerDetails as OfferDetails | undefined;
          const product = m.productDetails as ProductDetails | undefined;

          return (
            <div
              key={m._id || `msg-${idx}`}
              className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
            >
              <div className="max-w-[85%] md:max-w-[70%]">
                {m.messageType === "offer" && offer ? (
                  <div
                    className={`p-4 rounded-2xl border shadow-sm ${isMe ? "bg-blue-50 border-blue-100" : "bg-white border-gray-200"}`}
                  >
                    <div className="flex gap-3 mb-3">
                      <img
                        src={offer.productImage}
                        className="w-14 h-14 rounded-xl object-cover border"
                        alt="Product"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate text-gray-900">
                          {offer.productName}
                        </p>
                        <p className="text-xs text-gray-400 line-through">
                          {offer.originalPrice?.toLocaleString()}đ
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-white/50 rounded-xl border border-dashed border-blue-200">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        Giá chốt mong muốn
                      </span>
                      <p className="text-xl font-black text-blue-700">
                        {offer.offeredPrice?.toLocaleString()}đ
                      </p>
                    </div>

                    {offer.status === "accepted" ? (
                      <div className="space-y-2">
                        <div className="text-center py-2 bg-green-100 text-green-700 rounded-xl text-xs font-bold">
                          ✓ Đã đồng ý giá này
                        </div>
                        {isMe && (
                          <button
                            onClick={() => goToCheckout(offer, true)}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                          >
                            <ShoppingCart size={16} /> Mua ngay
                          </button>
                        )}
                      </div>
                    ) : !isMe && offer.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOfferAction(m, "rejected")}
                          className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleOfferAction(m, "accepted")}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Chấp nhận
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-400 text-[11px] italic bg-gray-50 rounded-lg">
                        {offer.status === "rejected"
                          ? "Đã từ chối trả giá"
                          : "Đang chờ phản hồi..."}
                      </div>
                    )}
                  </div>
                ) : m.messageType === "offer" && product ? (
                  <div className="p-3 rounded-2xl border bg-white border-gray-100 shadow-sm overflow-hidden">
                    <img
                      src={product.image}
                      className="w-full h-36 object-cover rounded-xl mb-3"
                      alt="Product"
                    />
                    <div className="px-1">
                      <p className="font-bold text-sm mb-1 text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-blue-600 font-black mb-3">
                        {product.originalPrice?.toLocaleString()}đ
                      </p>
                      <button
                        onClick={() => goToCheckout(product, false)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Mua ngay giá gốc
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${isMe ? "bg-blue-600 text-white" : "bg-white text-gray-800 border border-gray-100"}`}
                  >
                    <p className="text-[14px] leading-relaxed">{m.content}</p>
                  </div>
                )}
                <span
                  className={`text-[10px] text-gray-400 mt-1.5 block ${isMe ? "text-right" : "text-left"}`}
                >
                  {formatMsgTime(m.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </main>

      <footer className="bg-white border-t border-gray-100 p-2">
        <MessageInput />
      </footer>
    </div>
  );
};
