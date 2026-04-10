"use client";

import { useState } from "react";
import { Truck, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";
import { PaymentMethod } from "@/mock/order";

export const CheckoutModal = ({
  product,
  finalPrice,
  onConfirm,
}: {
  product: {
    name: string;
    price: number;
    image: string;
  };
  finalPrice: number;
  onConfirm: (data: {
    method: PaymentMethod;
    address: string;
    finalPrice: number;
  }) => void;
}) => {
  const [method, setMethod] = useState<PaymentMethod>("escrow");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProcessOrder = async () => {
    setIsSubmitting(true);
    // Giả lập gọi API tạo đơn hàng
    setTimeout(() => {
      onConfirm({ method, address, finalPrice });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="p-6 bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Xác nhận giao dịch
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Sản phẩm:{" "}
        <span className="font-semibold text-gray-800">{product.name}</span>
      </p>

      <div className="space-y-3 mb-6">
        {/* Option 1: Escrow */}
        <div
          onClick={() => setMethod("escrow")}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === "escrow" ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck
              className={
                method === "escrow" ? "text-blue-600" : "text-gray-400"
              }
            />
            <div>
              <p className="font-bold text-sm">Thanh toán đảm bảo (Escrow)</p>
              <p className="text-[11px] text-gray-500">
                Tiền được Sàn giữ an toàn đến khi nhận hàng.
              </p>
            </div>
          </div>
        </div>

        {/* Option 2: COD */}
        <div
          onClick={() => setMethod("cod")}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === "cod" ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <Truck
              className={method === "cod" ? "text-blue-600" : "text-gray-400"}
            />
            <div>
              <p className="font-bold text-sm">Giao hàng thu tiền (COD)</p>
              <p className="text-[11px] text-gray-500">
                Trả tiền cho shipper khi kiểm tra hàng.
              </p>
            </div>
          </div>
        </div>

        {/* Option 3: Meetup */}
        <div
          onClick={() => setMethod("meetup")}
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === "meetup" ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
        >
          <div className="flex items-center gap-3">
            <MapPin
              className={
                method === "meetup" ? "text-blue-600" : "text-gray-400"
              }
            />
            <div>
              <p className="font-bold text-sm">Giao dịch trực tiếp</p>
              <p className="text-[11px] text-gray-500">
                Hẹn gặp trực tiếp để kiểm tra và trả tiền.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input địa chỉ (Ẩn nếu là meetup) */}
      {method !== "meetup" && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-2">
          <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">
            Địa chỉ nhận hàng
          </label>
          <textarea
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Số nhà, tên đường, quận/huyện..."
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      )}

      <button
        onClick={handleProcessOrder}
        disabled={isSubmitting || (method !== "meetup" && !address)}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          `Xác nhận đơn hàng - ${finalPrice.toLocaleString()}đ`
        )}
      </button>
    </div>
  );
};
