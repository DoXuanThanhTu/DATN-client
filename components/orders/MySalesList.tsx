"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/app/services/api";
import {
  Loader2,
  Store,
  Truck,
  XCircle,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import ReviewModal from "./ReviewModal";

// --- INTERFACES ---
interface ISalesProduct {
  _id: string;
  title: string;
  images: string[];
}

interface ISalesBuyer {
  _id: string;
  name: string;
  avatar?: string;
}

interface ISalesOrder {
  _id: string;
  orderNumber: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  product: ISalesProduct;
  buyer: ISalesBuyer;
  quantity: number;
  totalAmount: number;
  notes?: string;
  isReviewed: boolean;
}

const ORDER_STATUSES = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipped", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
] as const;

export default function MySalesList() {
  const [orders, setOrders] = useState<ISalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<ISalesOrder | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/orders/me?role=seller&status=${activeStatus}`,
      );
      setOrders(res.data.data);
    } catch (err) {
      console.error("Lỗi lấy đơn bán:", err);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    let cancelReason = "";
    if (status === "cancelled") {
      cancelReason = prompt("Nhập lý do từ chối đơn hàng này:") || "";
      if (!cancelReason) return;
    }

    try {
      await api.patch(`/orders/${orderId}/status`, { status, cancelReason });
      fetchSales();
    } catch (err) {
      alert("Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab điều hướng trạng thái */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-gray-100 sticky top-[104px] bg-gray-50/80 backdrop-blur-md z-10 px-1">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status.key}
            onClick={() => setActiveStatus(status.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              activeStatus === status.key
                ? "bg-orange-500 text-white shadow-lg shadow-orange-100"
                : "bg-white text-gray-500 border border-gray-100 hover:border-orange-200"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-orange-500" size={32} />
          <p className="text-xs text-gray-400 font-medium">
            Đang tải danh sách bán hàng...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
          <Inbox className="mx-auto mb-4 text-gray-200" size={64} />
          <p className="text-sm text-gray-400 font-medium">
            Chưa có ai đặt mua hàng của bạn ở mục này
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50 hover:shadow-md transition-shadow space-y-4"
            >
              {/* Khách hàng & Trạng thái */}
              <div className="flex justify-between items-center border-b border-orange-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-[12px] font-bold text-orange-600 uppercase border border-orange-200">
                    {order.buyer?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">
                      Khách hàng
                    </span>
                    <span className="text-xs font-bold text-gray-800 leading-none">
                      {order.buyer?.name}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-orange-600 uppercase bg-orange-50 px-2.5 py-1.5 rounded-lg tracking-wider">
                  {ORDER_STATUSES.find((s) => s.key === order.status)?.label ||
                    order.status}
                </span>
              </div>

              {/* Thông tin Sản phẩm */}
              <div className="flex gap-4">
                <img
                  src={order.product?.images[0]}
                  alt={order.product?.title}
                  className="w-16 h-16 rounded-xl object-cover shadow-sm border border-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[14px] text-gray-800 truncate mb-1">
                    {order.product?.title}
                  </h4>
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-gray-400 font-medium">
                      Số lượng:{" "}
                      <span className="text-gray-700">{order.quantity}</span>
                    </p>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        Doanh thu
                      </p>
                      <p className="text-[15px] font-black text-orange-600">
                        {order.totalAmount?.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex gap-2 pt-1">
                {order.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(order._id, "cancelled")}
                      className="flex-1 py-3 flex items-center justify-center gap-1.5 border-2 border-red-50 text-red-500 rounded-xl text-xs font-bold transition-all hover:bg-red-50 active:scale-95"
                    >
                      <XCircle size={16} /> Từ chối
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(order._id, "processing")
                      }
                      className="flex-[2] py-3 flex items-center justify-center gap-1.5 bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-100 active:scale-[0.98] transition-all hover:bg-orange-600"
                    >
                      <CheckCircle2 size={16} /> Xác nhận đơn
                    </button>
                  </>
                )}

                {order.status === "processing" && (
                  <button
                    onClick={() => handleUpdateStatus(order._id, "shipped")}
                    className="w-full py-3.5 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-xl active:scale-[0.98] transition-all"
                  >
                    <Truck size={18} /> Gửi hàng cho vận chuyển
                  </button>
                )}

                {order.status === "delivered" && !order.isReviewed && (
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsReviewModalOpen(true);
                    }}
                    className="w-full py-3 bg-white border-2 border-orange-500 text-orange-500 rounded-xl text-xs font-bold transition-all hover:bg-orange-50 active:scale-[0.98]"
                  >
                    Viết nhận xét khách hàng
                  </button>
                )}

                {order.isReviewed && order.status === "delivered" && (
                  <div className="w-full text-center py-2.5 bg-orange-50 text-orange-600 font-bold text-[11px] rounded-xl italic border border-orange-100">
                    ✓ Bạn đã hoàn thành đánh giá cho người mua này
                  </div>
                )}
              </div>

              {/* Lý do hủy (nếu có) */}
              {order.status === "cancelled" && order.notes && (
                <div className="flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                  <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 leading-relaxed font-medium">
                    <span className="font-bold">Lý do hủy:</span> {order.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Đánh giá */}
      {selectedOrder && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          orderId={selectedOrder._id}
          revieweeId={selectedOrder.buyer?._id}
          type="SELLER_TO_BUYER"
          onSuccess={fetchSales}
        />
      )}
    </div>
  );
}
