"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import {
  Camera,
  MapPin,
  Mail,
  Loader2,
  Save,
  Edit3,
  X,
  ChevronRight,
  User,
  Store,
  ShoppingBag,
  Star,
  Check,
  MessageSquare,
  Heart,
} from "lucide-react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import api from "@/app/services/api";
import { uploadFile } from "@/services/upload.service";
import AddressModal from "@/components/AddressModal";
import { useAuthStore } from "../store/useAuthStore";
import Link from "next/link";

// --- Interfaces ---
interface IAddress {
  province: string;
  provinceCode: string;
  ward: string;
  wardCode: string;
  detail: string;
}

interface IProfileForm {
  name: string;
  phone: string;
  gender: "male" | "female" | "other";
  avatar: string;
  address: IAddress;
}

interface IUserResponse {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  avatar?: string;
  address?: {
    provinceName: string;
    provinceCode: string;
    wardName: string;
    wardCode: string;
    detail: string;
  };
}

interface IReviewUser {
  _id: string;
  name: string;
  avatar: string;
}

interface IReview {
  _id: string;
  reviewer: IReviewUser; // Người viết
  reviewee: IReviewUser; // Người nhận (dùng cho tab Đánh giá của tôi)
  rating: number;
  comment: string;
  createdAt: string;
}

// Định nghĩa 3 loại tab
type ReviewTab = "fromBuyers" | "fromSellers" | "myReviews";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<IUserResponse | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
const [savedPosts, setSavedPosts] = useState<any[]>([]);
const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());  
  const [activeTab, setActiveTab] = useState<ReviewTab>("fromBuyers");
  const [reviews, setReviews] = useState<IReview[]>([]);

  // State cho chỉnh sửa đánh giá
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  // Logic upload avatar
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<IProfileForm>({
      defaultValues: {
        gender: "other",
        avatar: "",
      },
    });

  const avatarWatch = watch("avatar");
  const addressWatch = watch("address");
  const { updateUser } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [activeTab]);
const fetchSavedPosts = async () => {
  try {
    const res = await api.get("/favorites");
    const posts = res.data.data || [];
    setSavedPosts(posts);
    setSavedPostIds(new Set(posts.map((item: any) => item.post._id)));
  } catch (error) {
    console.log(error);
  }
};
const toggleSave = async (postId: string) => {
  const isSaved = savedPostIds.has(postId);
  // Optimistic update
  setSavedPostIds((prev) => {
    const next = new Set(prev);
    isSaved ? next.delete(postId) : next.add(postId);
    return next;
  });
  try {
    await api.post(`/favorites/${postId}`);
    toast.success(isSaved ? "Đã bỏ lưu tin" : "Đã lưu tin");
  } catch (error) {
    // Rollback nếu lỗi
    setSavedPostIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.add(postId) : next.delete(postId);
      return next;
    });
    toast.error("Có lỗi xảy ra");
  }
};
useEffect(() => {
  fetchSavedPosts();
}, []);
  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/me");
      const userData: IUserResponse = res.data.data;
      setUser(userData);

      reset({
        name: userData.name || "",
        phone: userData.phone || "",
        gender: userData.gender || "other",
        avatar: userData.avatar || "",
        address: {
          province: userData.address?.provinceName || "",
          provinceCode: userData.address?.provinceCode || "",
          ward: userData.address?.wardName || "",
          wardCode: userData.address?.wardCode || "",
          detail: userData.address?.detail || "",
        },
      });
    } catch (error) {
      toast.error("Không thể tải thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      // Backend nhận param 'tab' để trả về dữ liệu tương ứng
      const res = await api.get(`/reviews/me?tab=${activeTab}`);
      setReviews(res.data.data);
    } catch (error) {
      console.error("Lỗi tải đánh giá", error);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setValue("avatar", previewUrl);
    setIsUploading(true);

    try {
      const res = await uploadFile(file, (progress: number) =>
        setUploadProgress(progress),
      );
      setValue("avatar", res.url);
    } catch (error) {
      toast.error("Lỗi upload ảnh");
      setValue("avatar", user?.avatar || "");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: IProfileForm) => {
    if (isUploading) return toast.info("Đang tải ảnh lên...");
    try {
      const payload = {
        ...data,
        address: {
          provinceName: data.address.province,
          provinceCode: data.address.provinceCode,
          wardName: data.address.ward,
          wardCode: data.address.wardCode,
          detail: data.address.detail,
        },
      };
      await api.patch("/users/profile", payload);
      toast.success("Cập nhật thành công!");
      setIsEditing(false);
      updateUser({ name: data.name, avatar: data.avatar });
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật");
    }
  };

  const handleSaveReview = async (reviewId: string) => {
    try {
      await api.patch(`/reviews/${reviewId}`, {
        rating: editRating,
        comment: editComment,
      });
      toast.success("Đã cập nhật đánh giá");
      setEditingReviewId(null);
      fetchReviews();
    } catch (error) {
      toast.error("Không thể cập nhật đánh giá");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <p className="text-gray-500 font-medium">Đang tải hồ sơ...</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-gray-100 mb-6">
        <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-600 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-16 mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-50 shadow-xl relative flex items-center justify-center">
                {avatarWatch ? (
                  <img
                    src={avatarWatch}
                    className={`w-full h-full object-cover ${isUploading ? "opacity-50" : ""}`}
                    alt="avatar"
                  />
                ) : (
                  <User size={48} className="text-gray-300" />
                )}
                {isUploading && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="6"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="6"
                      strokeDasharray="377"
                      strokeDashoffset={377 - (377 * uploadProgress) / 100}
                      className="transition-all duration-300"
                    />
                  </svg>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-1 right-1 bg-orange-500 p-2.5 rounded-full text-white shadow-lg cursor-pointer hover:bg-orange-600 transition-all border-2 border-white">
                  <Camera size={18} />
                  <input
                    type="file"
                    hidden
                    onChange={handleAvatarChange}
                    accept="image/*"
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile();
                    }}
                    className="px-5 py-2.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 flex items-center gap-2 transition-all"
                  >
                    <X size={18} /> Hủy
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={isUploading}
                    className="px-7 py-2.5 rounded-2xl font-bold bg-orange-500 text-white shadow-lg flex items-center gap-2 hover:bg-orange-600 transition-all"
                  >
                    <Save size={18} /> Lưu
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-7 py-2.5 rounded-2xl font-bold bg-gray-900 text-white hover:bg-black flex items-center gap-2 transition-all shadow-lg"
                >
                  <Edit3 size={18} /> Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-1 space-y-2">
              <h1 className="text-2xl font-black text-gray-800">
                {user?.name}
              </h1>
              <p className="text-gray-400 text-xs font-medium uppercase">
                ID: {user?._id?.slice(-6).toUpperCase()}
              </p>
            </div>
            <div className="md:col-span-2 space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 block">
                    Email
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 cursor-not-allowed font-bold">
                    <Mail size={18} /> {user?.email}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 block">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <input
                      {...register("name", { required: true })}
                      disabled={!isEditing}
                      className="w-full p-4 pl-12 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 disabled:bg-transparent font-bold text-gray-700"
                    />
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 block">
                      Số điện thoại
                    </label>
                    <input
                      {...register("phone")}
                      disabled={!isEditing}
                      className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 disabled:bg-transparent font-bold text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 block">
                      Giới tính
                    </label>
                    <select
                      {...register("gender")}
                      disabled={!isEditing}
                      className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:border-orange-500 bg-white font-bold text-gray-700 appearance-none"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase mb-1.5 block">
                    Địa chỉ giao dịch
                  </label>
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => setIsAddressModalOpen(true)}
                    className={`w-full flex items-center justify-between p-4 border rounded-2xl transition-all ${isEditing ? "bg-white border-orange-200 hover:border-orange-500" : "bg-transparent border-gray-200"}`}
                  >
                    <div className="flex items-center gap-4 text-gray-700 text-left">
                      <MapPin size={20} className="text-orange-500 shrink-0" />
                      <span className="font-bold text-sm">
                        {addressWatch?.province
                          ? `${addressWatch.detail ? addressWatch.detail + ", " : ""}${addressWatch.ward}, ${addressWatch.province}`
                          : "Chưa cập nhật địa chỉ"}
                      </span>
                    </div>
                    {isEditing && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden mt-6">
  <div className="p-6 border-b border-gray-100">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900">Tin đăng đã lưu</h2>
      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
        {savedPosts.length} tin
      </span>
    </div>
  </div>

  <div className="divide-y divide-gray-50">
    {savedPosts.length === 0 ? (
      <div className="py-12 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-400 font-medium">Chưa có tin đăng nào được lưu</p>
      </div>
    ) : (
     savedPosts.map((item) => {
  const isSaved = savedPostIds.has(item.post._id);
  return (
    <div key={item._id} className="flex gap-4 p-4 hover:bg-gray-50 transition-all">
      <Link href={`/post/${item.post._id}`} className="shrink-0">
        <img
          src={item.post.images?.[0] || "/placeholder.jpg"}
          alt={item.post.title}
          className="w-28 h-20 object-cover rounded-2xl"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/post/${item.post._id}`}>
          <h3 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1 hover:text-orange-500 transition-colors">
            {item.post.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <p className="text-orange-500 font-black text-base">
            {Number(item.post.price).toLocaleString("vi-VN")}đ
          </p>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-xs">
          {item.post.createdAt && (
            <>
              <span>
                {formatDistanceToNow(new Date(item.post.createdAt), {
                  addSuffix: false,
                  locale: vi,
                })} trước
              </span>
            </>
          )}
          {item.post.location?.provinceName && (
            <>
              <span>•</span>
              <span>{item.post.location.provinceName}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end justify-between shrink-0">
        <button
          onClick={() => toggleSave(item.post._id)}
          className={`transition-colors cursor-pointer ${isSaved ? "text-red-500" : "text-gray-300 hover:text-red-400"}`}
        >
          <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
        
        
      </div>
    </div>
  );
})
    )}
  </div>
</div>
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="flex border-b border-gray-50 bg-gray-50/30 p-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("fromBuyers")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 rounded-[20px] font-bold text-xs transition-all ${activeTab === "fromBuyers" ? "bg-white text-orange-600 shadow-sm" : "text-gray-400"}`}
          >
            <Store size={18} /> Từ Người Mua
          </button>
          <button
            onClick={() => setActiveTab("fromSellers")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 rounded-[20px] font-bold text-xs transition-all ${activeTab === "fromSellers" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}
          >
            <ShoppingBag size={18} /> Từ Người Bán
          </button>
          <button
            onClick={() => setActiveTab("myReviews")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-4 rounded-[20px] font-bold text-xs transition-all ${activeTab === "myReviews" ? "bg-white text-green-600 shadow-sm" : "text-gray-400"}`}
          >
            <MessageSquare size={18} /> Đánh giá của tôi
          </button>
        </div>

        <div className="p-6">
          {reviews.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-medium italic">
              <Star className="mx-auto mb-4 opacity-10" size={48} /> Chưa có
              đánh giá nào
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev) => {
                // Nếu là tab "Của tôi", hiển thị avatar/tên người NHẬN (reviewee)
                const displayUser =
                  activeTab === "myReviews" ? rev.reviewee : rev.reviewer;

                return (
                  <div
                    key={rev._id}
                    className="group flex gap-4 p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
                  >
                    <img
                      src={displayUser?.avatar || "/default-avatar.png"}
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                      alt="avatar"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm">
                            {activeTab === "myReviews"
                              ? `Bạn đã đánh giá ${displayUser?.name}`
                              : displayUser?.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 uppercase italic">
                            {formatDistanceToNow(new Date(rev.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </span>
                        </div>

                        {/* Chỉ hiện nút sửa khi ở tab "Của tôi" */}
                        {activeTab === "myReviews" &&
                          editingReviewId !== rev._id && (
                            <button
                              onClick={() => {
                                setEditingReviewId(rev._id);
                                setEditRating(rev.rating);
                                setEditComment(rev.comment);
                              }}
                              className="text-orange-500 opacity-0 group-hover:opacity-100 p-2 hover:bg-orange-50 rounded-full transition-all"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                      </div>

                      {editingReviewId === rev._id ? (
                        <div className="mt-2 p-3 bg-white border border-orange-200 rounded-xl shadow-sm">
                          <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={20}
                                className={`cursor-pointer ${s <= editRating ? "fill-orange-400 text-orange-400" : "text-gray-200"}`}
                                onClick={() => setEditRating(s)}
                              />
                            ))}
                          </div>
                          <textarea
                            className="w-full p-2 text-sm border rounded-lg outline-none focus:border-orange-500"
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => setEditingReviewId(null)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <X size={18} />
                            </button>
                            <button
                              onClick={() => handleSaveReview(rev._id)}
                              className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                            >
                              <Check size={18} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={
                                  i < rev.rating
                                    ? "fill-orange-400 text-orange-400"
                                    : "text-gray-200"
                                }
                              />
                            ))}
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {rev.comment}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={(newAddress: IAddress) => {
          setValue("address", newAddress);
          setIsAddressModalOpen(false);
        }}
      />
    </div>
  );
}
