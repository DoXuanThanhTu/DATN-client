"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/app/services/api";
import {
  Loader2,
  Package,
  Store,
  MapPin,
  ShoppingBag,
  CheckCircle2,
  Plus,
} from "lucide-react";
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
  paymentStatus: "pending" | "paid";
  product: OrderProduct;
  seller: OrderSeller;
  unitPrice: number;
  shippingAddress: ShippingAddress;
  isReviewed: boolean;
  totalAmount: number;
}

const ORDER_STATUSES = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipped", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
  { key: "cancelled", label: "Đã hủy" },
] as const;
const PAYMENT_STATUSES = [
  { key: "pending", label: "Chờ thanh toán" },
  { key: "paid", label: "Đã thanh toán" },
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
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar border-b border-gray-100  top-[104px] bg-gray-50/80 backdrop-blur-md z-10 px-1">
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
              className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 space-y-6"
            >
              {/* Header: Mã đơn & Trạng thái song song */}
              <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-slate-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Mã đơn hàng
                  </p>
                  <span className="text-sm font-black text-slate-900 tracking-tight">
                    #{order.orderNumber}
                  </span>
                </div>

                <div className="flex gap-2">
                  {/* Payment Status Badge */}
                  <span
                    className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm ${
                      order.paymentStatus === "paid"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {PAYMENT_STATUSES.find((s) => s.key === order.paymentStatus)
                      ?.label || order.paymentStatus}
                  </span>

                  {/* Order Status Badge */}
                  <span
                    className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm ${
                      order.status === "cancelled"
                        ? "bg-rose-50 text-rose-500"
                        : order.status === "delivered"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-900 text-white"
                    }`}
                  >
                    {ORDER_STATUSES.find((s) => s.key === order.status)
                      ?.label || order.status}
                  </span>
                </div>
              </div>

              {/* Sản phẩm: Layout rộng rãi hơn */}
              <div className="flex gap-6">
                <div className="relative group">
                  <img
                    src={order.product?.images[0]}
                    alt={order.product?.title}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] object-cover bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-white shadow-lg rounded-full w-8 h-8 flex items-center justify-center border border-slate-50">
                    <ShoppingBag size={14} className="text-slate-900" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="font-black text-lg text-slate-900 line-clamp-1 leading-none mb-2 tracking-tight">
                      {order.product?.title}
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-blue-600 tracking-tighter">
                        {order.totalAmount?.toLocaleString()}đ
                      </span>
                      {/* <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">
                        x1 sản phẩm
                      </span> */}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <Store size={12} className="text-slate-500" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Shop:{" "}
                      <span className="text-blue-600">
                        {order.seller?.name}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Địa chỉ: Card-in-Card style */}
              <div className="bg-slate-50/80 rounded-[1.8rem] p-5 border border-slate-100/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <MapPin size={12} className="text-blue-600" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    Thông tin giao nhận
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-sm">
                    {order.shippingAddress?.receiverName}
                    <span className="mx-2 text-slate-300 font-normal">|</span>
                    {order.shippingAddress?.phone}
                  </p>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">
                    {order.shippingAddress?.fullAddress}
                  </p>
                </div>
              </div>

              {/* Hành động: Full width & High Contrast */}
              <div className="pt-2">
                {order.status === "shipped" && (
                  <button
                    onClick={() => handleUpdateStatus(order._id, "delivered")}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.97] shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Xác nhận đã nhận hàng
                  </button>
                )}

                {order.status === "delivered" && !order.isReviewed && (
                  <button
                    onClick={() => openReviewModal(order)}
                    className="w-full bg-white border-2 border-slate-200 text-slate-900 py-4 rounded-2xl font-black text-sm transition-all hover:border-slate-900 active:scale-[0.97] flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Viết đánh giá sản phẩm
                  </button>
                )}

                {order.isReviewed && (
                  <div className="flex items-center justify-center gap-2 py-4 bg-emerald-50 rounded-2xl text-emerald-600 font-black text-xs uppercase tracking-widest border border-emerald-100">
                    <CheckCircle2 size={16} /> Hoàn thành đánh giá
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
