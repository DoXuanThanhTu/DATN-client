"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/app/services/api";
import { Loader2, Package, Store, MapPin } from "lucide-react";
import ReviewModal from "./ReviewModal";

// --- INTERFACES ---
interface OrderProduct {
  _id: string;
  title: string;
  images: string[];
  price: number;
}

interface OrderSeller {
  _id: string;
  name: string;
}

interface ShippingAddress {
  receiverName: string;
  phone: string;
  fullAddress: string;
}

interface IOrder {
  _id: string;
  orderNumber: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  product: OrderProduct;
  seller: OrderSeller;
  unitPrice: number;
  shippingAddress: ShippingAddress;
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

export default function MyOrdersList() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const openReviewModal = (order: IOrder) => {
    setSelectedOrder(order);
    setIsReviewModalOpen(true);
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/me?role=buyer&status=${activeStatus}`);
      setOrders(res.data.data);
    } catch (err) {
      console.error("Lỗi lấy đơn mua:", err);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (status === "delivered" && !confirm("Bạn xác nhận đã nhận được hàng?"))
      return;
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert("Cập nhật thất bại");
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs cuộn ngang */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-gray-100 sticky top-[104px] bg-gray-50/80 backdrop-blur-md z-10 px-1">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status.key}
            onClick={() => setActiveStatus(status.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
              activeStatus === status.key
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white text-gray-500 border border-gray-100 hover:border-blue-200"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs text-gray-400 font-medium">
            Đang tải đơn hàng...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
          <Package className="mx-auto mb-4 text-gray-200" size={64} />
          <p className="text-sm text-gray-400 font-medium">
            Bạn chưa có đơn mua nào ở mục này
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 hover:shadow-md transition-shadow space-y-4"
            >
              {/* Header: Mã & Trạng thái */}
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  #{order.orderNumber}
                </span>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    order.status === "cancelled"
                      ? "bg-red-50 text-red-500"
                      : order.status === "delivered"
                        ? "bg-green-50 text-green-600"
                        : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {ORDER_STATUSES.find((s) => s.key === order.status)?.label ||
                    order.status}
                </span>
              </div>

              {/* Sản phẩm */}
              <div className="flex gap-4">
                <img
                  src={order.product?.images[0]}
                  alt={order.product?.title}
                  className="w-20 h-20 rounded-2xl object-cover bg-gray-50 border border-gray-100"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <h4 className="font-bold text-[14px] text-gray-800 line-clamp-2 leading-tight">
                    {order.product?.title}
                  </h4>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 line-through">
                        {order.product?.price?.toLocaleString()}đ
                      </span>
                      <span className="text-sm font-black text-blue-600">
                        {order.unitPrice?.toLocaleString()}đ
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
                      <Store size={12} className="text-gray-400" />
                      Bán bởi:{" "}
                      <span className="text-blue-500">
                        {order.seller?.name}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin giao hàng */}
              <div className="bg-gray-50 rounded-2xl p-3 text-[11px] text-gray-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-gray-800">
                  <MapPin size={12} className="text-blue-500" /> Địa chỉ nhận
                  hàng
                </div>
                <div className="pl-4 border-l-2 border-blue-100 ml-1.5">
                  <p className="font-bold text-gray-700">
                    {order.shippingAddress?.receiverName} •{" "}
                    {order.shippingAddress?.phone}
                  </p>
                  <p className="line-clamp-1 text-gray-500">
                    {order.shippingAddress?.fullAddress}
                  </p>
                </div>
              </div>

              {/* Hành động */}
              <div className="pt-1">
                {order.status === "shipped" && (
                  <button
                    onClick={() => handleUpdateStatus(order._id, "delivered")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-blue-100"
                  >
                    Xác nhận đã nhận hàng
                  </button>
                )}
                {order.status === "delivered" && !order.isReviewed && (
                  <button
                    onClick={() => openReviewModal(order)}
                    className="w-full bg-white border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-bold text-sm transition-all hover:bg-blue-50 active:scale-[0.98]"
                  >
                    Đánh giá người bán
                  </button>
                )}
                {order.isReviewed && (
                  <div className="text-center py-2 text-green-600 font-bold text-[11px] bg-green-50 rounded-lg italic">
                    ✓ Bạn đã hoàn thành đánh giá cho đơn hàng này
                  </div>
                )}
              </div>
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
          revieweeId={selectedOrder.seller?._id}
          type="BUYER_TO_SELLER"
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
