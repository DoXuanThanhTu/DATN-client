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

// ===== TYPES =====
type PaymentStatus = "loading" | "success" | "error";

interface VNPayParams {
  vnp_ResponseCode?: string;
  vnp_Amount?: string;
  vnp_TxnRef?: string;
  vnp_BankCode?: string;
}

interface OrderData {
  amount: number;
  txnRef?: string;
  bankCode?: string;
}

// ===== HELPERS =====
const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);

export default function PaymentResultClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasCalledApi = useRef(false);

  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    const params: VNPayParams = Object.fromEntries(searchParams.entries());

    if (!params.vnp_ResponseCode || hasCalledApi.current) {
      return;
    }

    const verifyPayment = async () => {
      hasCalledApi.current = true;

      try {
        const res = await api.get("/payment/return", { params });

        if (res.data.success) {
          setStatus("success");

          setOrderData({
            amount: Number(params.vnp_Amount || 0),
            txnRef: params.vnp_TxnRef,
            bankCode: params.vnp_BankCode,
          });
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Verify Error:", error);
        setStatus("error");
      }
    };

    verifyPayment();
  }, [searchParams]);

  // ===== LOADING UI =====
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
          Đang xác thực giao dịch...
        </p>
      </div>
    );
  }

  // ===== RESULT UI =====
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-[500px] w-full">
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden">
          {/* HEADER */}
          <div
            className={`p-10 text-center ${
              status === "success" ? "bg-emerald-50" : "bg-rose-50"
            }`}
          >
            <div className="flex justify-center mb-6">
              {status === "success" ? (
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                  <CheckCircle2 size={40} />
                </div>
              ) : (
                <div className="w-20 h-20 bg-rose-500 rounded-2xl flex items-center justify-center text-white">
                  <AlertTriangle size={40} />
                </div>
              )}
            </div>

            <h1
              className={`text-2xl font-bold ${
                status === "success" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {status === "success"
                ? "Thanh toán thành công 🎉"
                : "Thanh toán thất bại"}
            </h1>
          </div>

          {/* CONTENT */}
          <div className="p-8 space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between">
                <span>Số tiền</span>
                <span className="font-bold">
                  {formatVND(orderData?.amount || 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Mã đơn</span>
                <span>#{orderData?.txnRef || "N/A"}</span>
              </div>

              <div className="flex justify-between">
                <span>Ngân hàng</span>
                <span>{orderData?.bankCode || "VNPay"}</span>
              </div>
            </div>

            {/* ACTION */}
            {status === "success" ? (
              <>
                <button
                  onClick={() => router.push("/my-orders?tab=buying")}
                  className="w-full py-4 bg-black text-white rounded-xl font-bold"
                >
                  <ClipboardList /> Xem đơn hàng
                </button>

                <button
                  onClick={() => router.push("/")}
                  className="w-full py-4 border rounded-xl font-bold"
                >
                  <ShoppingBag /> Tiếp tục mua sắm
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/")}
                className="w-full py-4 text-gray-500"
              >
                Quay về trang chủ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
