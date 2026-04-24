"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Banknote,
  RotateCcw,
  ArrowRightLeft,
  UserIcon,
  ArrowUpRight,
  Plus,
  History,
} from "lucide-react";
import api from "@/app/services/api";
import type { LucideIcon } from "lucide-react";

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
  ledger: {
    items: LedgerItem[];
    pagination: {
      totalPages: number;
    };
  };
}

type TransactionConfig = {
  label: string;
  color: string;
  bgColor: string;
  icon: LucideIcon; // ✅ FIX any
};

// ================= CONFIG =================
const TYPE_CONFIG: Record<string, TransactionConfig> = {
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

  const [data, setData] = useState<{
    wallet: WalletData | null;
    items: LedgerItem[];
  }>({
    wallet: null,
    items: [],
  });

  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWalletData = useCallback(async (page: number) => {
    try {
      setIsLoading(true);

      const res = await api.get<{ data: WalletResponse }>(
        `/wallet/me?page=${page}&limit=10`,
      );

      const { wallet, ledger } = res.data.data;

      setData({
        wallet,
        items: ledger.items,
      });

      setTotalPages(ledger.pagination.totalPages);
    } catch (err) {
      console.error("Wallet Fetch Error:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  }, []);

  useEffect(() => {
    fetchWalletData(currentPage);
  }, [currentPage, fetchWalletData]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-full mx-auto p-6 md:p-12 space-y-12 animate-in fade-in duration-1000">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:w-4xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Tài chính của tôi
          </h1>
          <p className="text-slate-500 font-medium">
            Quản lý thu nhập và theo dõi dòng tiền của bạn.
          </p>
        </div>
      </header>

      <div className="flex flex-col justify-center md:w-4xl mx-auto">
        {/* BALANCE */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-70">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase text-emerald-400">
              Available Balance
            </span>
            <h2 className="text-5xl md:text-7xl font-black">
              {data.wallet ? formatVND(data.wallet.availableBalance) : "••••••"}
            </h2>
          </div>

          <div className="pt-8 border-t border-white/5">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-2">
              Đang tạm giữ (Escrow)
            </p>
            <p className="font-bold text-2xl text-amber-400">
              {data.wallet ? formatVND(data.wallet.pendingBalance) : "---"}
            </p>
          </div>
        </div>

        {/* LIST */}
        <div>
          <div className="px-10 py-8 border-b flex items-center gap-4">
            <History size={24} />
            <h3 className="font-black text-2xl">Lịch sử dòng tiền</h3>
          </div>

          <div className="min-h-[500px]">
            {isLoading ? (
              <SkeletonRows />
            ) : data.items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="px-4">
                {data.items.map((item) => {
                  const config =
                    TYPE_CONFIG[item.transactionType] || TYPE_CONFIG.DEFAULT;

                  const Icon = config.icon;

                  return (
                    <div
                      key={item._id}
                      className="flex justify-between items-center px-6 py-7 hover:bg-slate-50 rounded-2xl"
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={`w-16 h-16 flex items-center justify-center rounded-3xl ${config.bgColor} ${config.color}`}
                        >
                          <Icon size={28} />
                        </div>

                        <div>
                          <p className={`font-black ${config.color}`}>
                            {config.label}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        </div>
                      </div>

                      <p className={`text-xl font-black ${config.color}`}>
                        {item.type === "CREDIT" ? "+" : "-"}{" "}
                        {formatVND(item.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {!isLoading && totalPages > 1 && (
            <div className="p-10 flex justify-center gap-4">
              <PaginationButton
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} />
              </PaginationButton>

              <PaginationButton
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} />
              </PaginationButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================= SUB =================

function PaginationButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-12 h-12 rounded-2xl border bg-white disabled:opacity-20"
    >
      {children}
    </button>
  );
}

function SkeletonRows() {
  return <div className="p-10 animate-pulse">Loading...</div>;
}

function EmptyState() {
  return (
    <div className="p-20 text-center text-gray-400">Chưa có giao dịch</div>
  );
}
