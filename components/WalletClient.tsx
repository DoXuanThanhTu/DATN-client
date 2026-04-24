"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  History,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  Banknote,
  RotateCcw,
  ArrowRightLeft,
  UserIcon,
} from "lucide-react";
import api from "@/app/services/api";
import { LucideIcon } from "lucide-react";

// ================= TYPES =================
interface LedgerItem {
  _id: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  transactionType: string;
  createdAt: string;
}

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
}

interface WalletResponse {
  wallet: WalletData;
  items: LedgerItem[];
}

// 👉 FIX: không dùng any nữa
type TypeConfig = {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
};

const TYPE_CONFIG: Record<string, TypeConfig> = {
  ORDER_PAYMENT: {
    label: "Thanh toán đơn hàng",
    color: "text-blue-600",
    bgColor: "bg-blue-50/50",
    icon: ShoppingBag,
  },
  ESCROW_HOLD: {
    label: "Tạm giữ tiền",
    color: "text-amber-600",
    bgColor: "bg-amber-50/50",
    icon: Clock,
  },
  SELLER_PENDING: {
    label: "Người mua thanh toán",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50/50",
    icon: UserIcon,
  },
  SETTLEMENT: {
    label: "Quyết toán",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50/50",
    icon: CheckCircle2,
  },
  COD_IN: {
    label: "Thu hộ COD",
    color: "text-green-600",
    bgColor: "bg-green-50/50",
    icon: Plus,
  },
  COD_OUT: {
    label: "Chi trả COD",
    color: "text-rose-600",
    bgColor: "bg-rose-50/50",
    icon: ArrowUpRight,
  },
  WITHDRAW: {
    label: "Rút tiền",
    color: "text-slate-600",
    bgColor: "bg-slate-100/50",
    icon: Banknote,
  },
  REFUND: {
    label: "Hoàn tiền",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50/50",
    icon: RotateCcw,
  },
  DEFAULT: {
    label: "Giao dịch",
    color: "text-gray-600",
    bgColor: "bg-gray-50/50",
    icon: ArrowRightLeft,
  },
};

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);

// ================= COMPONENT =================
export default function WalletClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const [data, setData] = useState<WalletResponse>({
    wallet: { availableBalance: 0, pendingBalance: 0 },
    items: [],
  });

  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWalletData = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/wallet/me?page=${page}&limit=10`);

      const { wallet, ledger } = res.data.data;

      setData({
        wallet,
        items: ledger.items,
      });

      setTotalPages(ledger.pagination.totalPages);
    } catch (err) {
      console.error("Wallet Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData(currentPage);
  }, [currentPage, fetchWalletData]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <h1 className="text-3xl font-black">Tài chính của tôi</h1>

      {/* BALANCE */}
      <div className="bg-black text-white p-6 rounded-3xl">
        <p>Số dư khả dụng</p>
        <h2 className="text-4xl font-bold">
          {formatVND(data.wallet.availableBalance)}
        </h2>
      </div>

      {/* LIST */}
      {isLoading ? (
        <p>Đang tải...</p>
      ) : data.items.length === 0 ? (
        <p>Không có giao dịch</p>
      ) : (
        <div>
          {data.items.map((item) => {
            const config =
              TYPE_CONFIG[item.transactionType] || TYPE_CONFIG.DEFAULT;
            const Icon = config.icon;

            return (
              <div
                key={item._id}
                className="flex justify-between py-4 border-b"
              >
                <div className="flex gap-3 items-center">
                  <Icon />
                  <div>
                    <p>{config.label}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>

                <p>
                  {item.type === "CREDIT" ? "+" : "-"}
                  {formatVND(item.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      <div className="flex gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <ChevronLeft />
        </button>

        <span>
          {currentPage} / {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
