"use client";

import { useState, Suspense } from "react";
import { ShoppingBag, Store, Loader2 } from "lucide-react";
import MyOrdersList from "@/components/orders/MyOrdersList";
import MySalesList from "@/components/orders/MySalesList";
import { useSearchParams } from "next/navigation";

// 1. Tách logic chính vào component Content
function OrderManagementContent() {
  const searchParams = useSearchParams();

  // Lấy giá trị ban đầu từ URL, mặc định là 'buying'
  const initialTab =
    searchParams.get("tab") === "selling" ? "selling" : "buying";
  const [activeTab, setActiveTab] = useState<"buying" | "selling">(initialTab);

  return (
    <div className="min-h-screen pb-20 bg-white/80 backdrop-blur-md">
      {/* Top Navigation Bar */}
      <div className="px-4 pt-6 pb-4 top-0 z-30">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-5">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Quản lý đơn hàng
            </h1>
          </div>

          {/* Segmented Control (Tab Switcher) */}
          <div className="relative flex bg-gray-100/80 p-1.5 rounded-2xl w-full border border-gray-200/50">
            {/* Background Highlight */}
            <div
              className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out ${
                activeTab === "selling" ? "translate-x-full" : "translate-x-0"
              }`}
            />

            <button
              onClick={() => setActiveTab("buying")}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors duration-200 ${
                activeTab === "buying"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ShoppingBag size={18} strokeWidth={2.5} />
              <span>Đơn mua</span>
            </button>

            <button
              onClick={() => setActiveTab("selling")}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors duration-200 ${
                activeTab === "selling"
                  ? "text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Store size={18} strokeWidth={2.5} />
              <span>Đơn bán</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="transition-all duration-300">
          {activeTab === "buying" ? <MyOrdersList /> : <MySalesList />}
        </div>
      </div>
    </div>
  );
}

// 2. Component Page chính bọc Suspense
export default function OrderManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-sm text-gray-500 font-medium">
            Đang tải danh sách đơn hàng...
          </p>
        </div>
      }
    >
      <OrderManagementContent />
    </Suspense>
  );
}
