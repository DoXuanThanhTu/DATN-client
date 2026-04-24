"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  MapPin,
  Star,
  ShoppingBag,
  MessageCircle,
  Package,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Store,
  User as UserIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/app/services/api";

// --- Interfaces dựa trên Backend của bạn ---
interface IProduct {
  _id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  createdAt: string;
}

interface IReview {
  _id: string;
  reviewer: {
    _id: string;
    name: string;
    avatar: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface IPublicProfile {
  user: {
    _id: string;
    name: string;
    avatar: string;
    address?: {
      provinceName: string;
      detail: string;
    };
    rating: number;
    totalReviews: number;
    createdAt: string;
  };
  stats: {
    totalProducts: number;
    totalReviews: number;
    rating: number;
  };
  products: IProduct[];
  reviews: IReview[];
}

export default function PublicProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState<IPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "reviews">(
    "products",
  );

  useEffect(() => {
    if (id) fetchPublicProfile();
  }, [id]);

  const fetchPublicProfile = async () => {
    try {
      const res = await api.get(`/users/user/${id}`); // Giả sử route backend của bạn
      setData(res.data.data);
    } catch (error) {
      console.error("Lỗi tải hồ sơ công khai");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
          Đang tải hồ sơ...
        </p>
      </div>
    );

  if (!data)
    return <div className="p-20 text-center">Không tìm thấy người dùng</div>;

  const { user, stats, products, reviews } = data;

  return (
    <div className="md:w-5xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      {/* HEADER CARD - Profile Overview */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        <div className="px-8 pb-10">
          <div className="relative flex flex-col md:flex-row gap-8 items-end -mt-12">
            {/* Avatar */}
            <div className="relative group mx-auto md:mx-0">
              <div className="w-40 h-40 rounded-full border-[6px] border-white overflow-hidden bg-slate-100 shadow-2xl relative flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-full h-full object-cover"
                    alt={user.name}
                  />
                ) : (
                  <UserIcon size={60} className="text-slate-300" />
                )}
              </div>
              {/* <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white shadow-lg">
                <ShieldCheck size={20} />
              </div> */}
            </div>

            {/* Info & Stats Row */}
            <div className="flex-1 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 w-full text-center md:text-left">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {user.name}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-500 text-sm font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-blue-500" /> Tỉnh thành:{" "}
                    {user.address?.provinceName || "Chưa cập nhật"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-slate-400" /> Tham gia{" "}
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>

              {/* <div className="flex gap-3">
                <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  <MessageCircle size={20} /> Nhắn tin
                </button>
              </div> */}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-10 border-t border-slate-50">
            <div className="text-center group cursor-default">
              <div className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                {stats.totalProducts}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Bài đăng
              </div>
            </div>
            <div className="text-center group border-x border-slate-50">
              <div className="text-2xl font-black text-slate-900 flex justify-center items-center gap-1 group-hover:text-amber-500 transition-colors">
                {stats.rating.toFixed(1)}{" "}
                <Star className="fill-amber-400 text-amber-400" size={20} />
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Đánh giá
              </div>
            </div>
            <div className="text-center group">
              <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                100%
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Phản hồi
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT TABS */}
      <div className="space-y-6 ">
        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm w-fit mx-auto md:mx-0">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === "products" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Package size={18} /> Bài đăng
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === "reviews" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Star size={18} /> Đánh giá ({stats.totalReviews})
          </button>
        </div>

        {activeTab === "products" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {products.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest italic">
                Người bán chưa đăng sản phẩm nào
              </div>
            ) : (
              products.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl p-2 border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 relative mb-4">
                    <img
                      src={item.images[0]}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt={item.title}
                    />
                    {item.status === "sold" && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-black text-xs uppercase tracking-widest">
                        Đã bán
                      </div>
                    )}
                  </div>
                  <div className="px-2 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-orange-600 font-black text-lg">
                      {item.price.toLocaleString()}đ
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ĐÁNH GIÁ */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {reviews.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest italic">
                Chưa có đánh giá nào từ cộng đồng
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex gap-6"
                >
                  <img
                    src={rev.reviewer.avatar || "/default-avatar.png"}
                    className="w-14 h-14 rounded-2xl object-cover shadow-md"
                    alt="reviewer"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">
                          {rev.reviewer.name}
                        </h4>
                        <div className="flex gap-0.5 my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                        {formatDistanceToNow(new Date(rev.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50 p-5 rounded-2xl">
                      {rev.comment}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
