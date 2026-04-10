"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Loader2,
  ChevronRight,
  User,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import api from "@/app/services/api";
import AddressModal from "@/components/AddressModal";
import { useAuthStore } from "../store/useAuthStore";

// --- INTERFACES ---
interface AddressData {
  province: string;
  provinceCode: string;
  ward: string;
  wardCode: string;
  detail: string;
}

interface IProductCheckout {
  _id: string;
  title: string;
  images: string[];
  price: number;
  displayPrice: number;
}

// 1. Component chứa logic chính
function CheckoutContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<IProductCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Thông tin nhận hàng
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState<AddressData>({
    province: "",
    provinceCode: "",
    ward: "",
    wardCode: "",
    detail: "",
  });

  const [paymentMethod] = useState<"cod" | "transfer">("cod");

  const type = searchParams.get("type");
  const negotiatedPrice = Number(searchParams.get("price"));
  const productId = (params.id as string) || searchParams.get("id");
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const productRes = await api.get(`/posts/${productId}`);
        const dbProduct = productRes.data.data;

        let finalPrice = dbProduct.price;
        if (type === "negotiated" && negotiatedPrice) {
          finalPrice = negotiatedPrice;
        }

        setProduct({ ...dbProduct, displayPrice: finalPrice });

        if (user) {
          setReceiverName(user.name || "");
          setReceiverPhone(user.phone || "");
          if (user.address) {
            setAddress({
              province: user.address.provinceName || "",
              provinceCode: user.address.provinceCode || "",
              ward: user.address.wardName || "",
              wardCode: user.address.wardCode || "",
              detail: user.address.detail || "",
            });
          }
        }
      } catch (error) {
        console.error("Lỗi fetch dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, type, negotiatedPrice, user]);

  const handleCheckout = async () => {
    if (!product) return;
    if (!receiverName || !receiverPhone || !address.province) {
      alert("Vui lòng kiểm tra lại Tên, SĐT và Địa chỉ nhận hàng!");
      return;
    }

    try {
      setIsSubmitting(true);
      const orderData = {
        productId: product._id,
        quantity: 1,
        negotiatedPrice: type === "negotiated" ? negotiatedPrice : undefined,
        paymentMethod: paymentMethod,
        shippingAddress: {
          receiverName,
          phone: receiverPhone,
          fullAddress: `${address.detail ? address.detail + ", " : ""}${address.ward}, ${address.province}`,
        },
      };

      const response = await api.post("/orders", orderData);
      if (response.data.success) {
        router.push("/my-orders");
      }
      // eslint-disable-next-line
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm text-gray-400 font-medium">
          Đang tải thông tin thanh toán...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-10 text-gray-800">
      {/* Header */}
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Xác nhận thanh toán</h1>
      </div>

      <div className="p-4 space-y-4 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* 1. THÔNG TIN NHẬN HÀNG */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
            <MapPin size={18} /> Thông tin nhận hàng
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 focus-within:border-blue-300 transition-all">
              <User size={18} className="text-gray-400" />
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Họ tên người nhận"
                className="bg-transparent flex-1 text-sm font-bold outline-none"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 focus-within:border-blue-300 transition-all">
              <Phone size={18} className="text-gray-400" />
              <input
                type="text"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="Số điện thoại liên hệ"
                className="bg-transparent flex-1 text-sm font-bold outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsAddrModalOpen(true)}
              className="w-full p-4 border border-gray-200 rounded-2xl flex justify-between items-center hover:bg-gray-50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                  <MapPin size={20} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    Địa chỉ giao hàng
                  </p>
                  <p className="text-sm font-bold line-clamp-1">
                    {address.province
                      ? `${address.detail ? address.detail + ", " : ""}${address.ward}, ${address.province}`
                      : "Vui lòng chọn địa chỉ"}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* 2. THÔNG TIN SẢN PHẨM */}
        <div className="bg-white p-4 rounded-3xl flex gap-4 shadow-sm border border-gray-50">
          <img
            src={product?.images?.[0] || ""}
            className="w-20 h-20 rounded-2xl object-cover bg-gray-100 border border-gray-50"
            alt={product?.title}
          />
          <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
            <h3 className="font-bold text-sm truncate text-gray-800">
              {product?.title}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Giá bán:
              </span>
              <p className="text-blue-600 font-black text-xl">
                {product?.displayPrice?.toLocaleString()}đ
              </p>
            </div>
          </div>
        </div>

        {/* 3. TÓM TẮT & NÚT ĐẶT HÀNG */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">
                Tổng tiền sản phẩm
              </span>
              <span className="font-bold">
                {product?.displayPrice?.toLocaleString()}đ
              </span>
            </div>
            <div className="pt-3 border-t flex justify-between items-center font-bold text-xl">
              <span className="text-gray-800">Tổng thanh toán</span>
              <span className="text-orange-600">
                {product?.displayPrice?.toLocaleString()}đ
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-gray-300 transition-all text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <span className="flex items-center gap-2">
                Xác nhận đặt hàng <CheckCircle2 size={18} />
              </span>
            )}
          </button>
        </div>
      </div>

      <AddressModal
        isOpen={isAddrModalOpen}
        onClose={() => setIsAddrModalOpen(false)}
        initialData={address}
        onSelect={(d: AddressData) => {
          setAddress(d);
          setIsAddrModalOpen(false);
        }}
      />
    </div>
  );
}

// 2. Component xuất ra chính (đã bọc Suspense)
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
          <p className="text-sm text-gray-400 font-medium">
            Đang khởi tạo thanh toán...
          </p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
