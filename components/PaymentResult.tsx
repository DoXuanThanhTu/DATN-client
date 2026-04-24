"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  ShoppingBag,
  ClipboardList,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import api from "@/app/services/api";

// ================= TYPES =================
type Status = "loading" | "success" | "error" | "invalid";

interface OrderData {
  amount: number;
  txnRef: string;
  bankCode: string;
}

interface VerifyResponse {
  success: boolean;
}

// ================= UTILS =================
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);

// ================= COMPONENT =================
export default function PaymentResultClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasCalledApi = useRef(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<Status>("loading");
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    if (!params.vnp_ResponseCode || hasCalledApi.current) return;

    const verifyPayment = async () => {
      hasCalledApi.current = true;

      try {
        const response = await api.get<VerifyResponse>("/payment/return", {
          params,
        });

        if (response.data.success) {
          setStatus("success");

          setOrderData({
            amount: Number(params.vnp_Amount || 0),
            txnRef: params.vnp_TxnRef || "",
            bankCode: params.vnp_BankCode || "VNPay",
          });
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Verify Error:", error);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">
          Đang xác thực giao dịch...
        </p>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-[500px] w-full animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* HEADER */}
          <div
            className={`p-10 text-center ${
              status === "success" ? "bg-emerald-50/50" : "bg-rose-50/50"
            }`}
          >
            <div className="flex justify-center mb-6">
              {status === "success" ? (
                <div className="w-20 h-20 bg-emerald-500 rounded-[2.2rem] flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                  <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-20 h-20 bg-rose-500 rounded-[2.2rem] flex items-center justify-center text-white shadow-xl shadow-rose-200">
                  <AlertTriangle size={40} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <h1
              className={`text-2xl font-black tracking-tight ${
                status === "success" ? "text-emerald-900" : "text-rose-900"
              }`}
            >
              {status === "success"
                ? "Thanh toán thành công!"
                : "Giao dịch thất bại"}
            </h1>
          </div>

          {/* CONTENT */}
          <div className="p-8 space-y-6">
            <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  Số tiền
                </span>
                <span
                  className={`font-black text-lg ${
                    status === "success" ? "text-slate-900" : "text-rose-600"
                  }`}
                >
                  {formatVND(orderData?.amount ?? 0)}
                </span>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <span className="text-slate-400 font-bold text-[10px] uppercase">
                  Mã đơn hàng
                </span>
                <span className="font-black">
                  #{orderData?.txnRef || "N/A"}
                </span>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <span className="text-slate-400 font-bold text-[10px] uppercase">
                  Ngân hàng
                </span>
                <span className="font-bold uppercase">
                  {orderData?.bankCode || "VNPay"}
                </span>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="space-y-3 pt-4">
              {status === "success" ? (
                <>
                  <button
                    onClick={() => router.push(`/my-orders?tab=buying`)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3"
                  >
                    <ClipboardList size={20} /> Xem đơn hàng
                  </button>

                  <button
                    onClick={() => router.push("/")}
                    className="w-full py-4 border-2 rounded-2xl font-black flex items-center justify-center gap-3"
                  >
                    <ShoppingBag size={20} /> Tiếp tục mua sắm
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-4 text-slate-400 font-bold"
                >
                  Quay lại trang chủ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
