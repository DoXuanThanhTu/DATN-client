"use client";

import { useState, ChangeEvent, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";
import {
  Camera,
  MapPin,
  ChevronRight,
  X,
  Eye,
  Loader2,
  Tag,
} from "lucide-react";

import AddressModal from "@/components/AddressModal";
import ImagePreview from "@/components/ImagePreview";
import { uploadFile, deleteImageFromServer } from "@/services/upload.service";
import api from "@/app/services/api";
import { useCategoryData } from "@/hooks/useCategoryData";

// --- Interfaces ---
interface Category {
  _id: string;
  name: string;
  children?: Category[];
}

interface MediaItem {
  id: string;
  url: string | null;
  previewUrl: string;
  progress: number;
  fileId?: string;
  isNew: boolean; // true: vừa upload, false: ảnh cũ
}

interface AddressData {
  province: string;
  provinceCode: string;
  ward: string;
  wardCode: string;
  detail: string;
}

interface IProductForm {
  title: string;
  description: string;
  price: number;
  priceNegotiable: boolean;
  parentCategoryId: string;
  categoryId?: string | null;
  province: string;
  provinceCode: string;
  ward: string;
  wardCode: string;
  detail: string;
  status: "pending" | "active" | "sold" | "hidden" | "rejected";
  condition: {
    label: "new" | "like_new" | "good" | "fair" | "for_parts";
    percentage: number;
    isFullbox: boolean;
    warranty: string;
  };
  images: string[];
}

// --- Schema (giống như component đăng tin) ---
const schema = yup.object().shape({
  title: yup
    .string()
    .required("Vui lòng nhập tiêu đề")
    .min(10, "Tiêu đề phải có ít nhất 10 ký tự")
    .max(70, "Tiêu đề không được vượt quá 70 ký tự"),
  description: yup
    .string()
    .required("Vui lòng nhập mô tả")
    .min(10, "Mô tả phải có ít nhất 10 ký tự"),
  price: yup
    .number()
    .typeError("Giá phải là số")
    .required("Vui lòng nhập giá")
    .min(0, "Giá phải lớn hơn hoặc bằng 0"),
  priceNegotiable: yup.boolean().default(false),
  parentCategoryId: yup.string().required("Vui lòng chọn danh mục chính"),
  categoryId: yup.string().nullable().notRequired(),
  province: yup.string().required("Vui lòng chọn tỉnh/thành phố"),
  provinceCode: yup.string().required("Vui lòng chọn tỉnh/thành phố"),
  ward: yup.string().required("Vui lòng chọn phường/xã"),
  wardCode: yup.string().required("Vui lòng chọn phường/xã"),
  detail: yup.string().ensure(),
  status: yup
    .string()
    .oneOf(["pending", "active", "sold", "hidden", "rejected"])
    .default("active"),
  condition: yup.object().shape({
    label: yup
      .string()
      .oneOf(["new", "like_new", "good", "fair", "for_parts"])
      .required("Chọn tình trạng"),
    percentage: yup.number().min(0).max(100).required("Nhập % độ mới"),
    isFullbox: yup.boolean().default(false),
    warranty: yup.string().ensure().default("Không bảo hành"),
  }),
  images: yup
    .array()
    .of(yup.string().required())
    .min(1, "Cần ít nhất 1 ảnh")
    .required(),
}) as yup.ObjectSchema<IProductForm>;

export default function ProductEditForm() {
  const router = useRouter();
  const { id } = useParams(); // Lấy ID từ URL
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [trashIds, setTrashIds] = useState<string[]>([]); // fileId của ảnh mới bị xoá
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  const { data: categories, isLoading: isLoadingCats } = useCategoryData() as {
    data: Category[] | undefined;
    isLoading: boolean;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IProductForm>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      priceNegotiable: false,
      status: "active",
      condition: {
        label: "good",
        percentage: 90,
        isFullbox: false,
        warranty: "Không bảo hành",
      },
      images: [],
      parentCategoryId: "",
      categoryId: "",
    },
  });

  const formData = watch();

  // --- Danh mục con ---
  const subCategories = useMemo(() => {
    if (!formData.parentCategoryId || !categories) return [];
    const parent = categories.find((c) => c._id === formData.parentCategoryId);
    return parent?.children || [];
  }, [formData.parentCategoryId, categories]);

  // Reset danh mục con khi đổi danh mục cha
  useEffect(() => {
    setValue("categoryId", "");
  }, [formData.parentCategoryId, setValue]);

  // Đồng bộ images từ media vào form
  useEffect(() => {
    const urls = media.filter((m) => m.url).map((m) => m.url as string);
    setValue("images", urls, { shouldValidate: true });
  }, [media, setValue]);

  // Dọn dẹp URL preview khi unmount
  const mediaRef = useRef(media);
  useEffect(() => {
    mediaRef.current = media;
    return () => {
      mediaRef.current.forEach((m) => {
        if (m.previewUrl && m.isNew) URL.revokeObjectURL(m.previewUrl);
      });
    };
  }, [media]);

  // --- Lấy dữ liệu sản phẩm cần chỉnh sửa ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        const post = res.data.data;

        // Mapping dữ liệu từ API sang form
        const formValues: IProductForm = {
          title: post.title,
          description: post.description,
          price: post.price,
          priceNegotiable: post.priceNegotiable ?? false,
          parentCategoryId: post.category._id,
          categoryId: post.subCategory?._id ?? null,
          province: post.location.provinceName,
          provinceCode: post.location.provinceCode,
          ward: post.location.wardName,
          wardCode: post.location.wardCode,
          detail: post.location.detail || "",
          status: post.status,
          condition: {
            label: post.condition.label,
            percentage: post.condition.percentage,
            isFullbox: post.condition.isFullbox ?? false,
            warranty: post.condition.warranty ?? "Không bảo hành",
          },
          images: post.images,
        };

        reset(formValues);

        // Tạo media từ ảnh cũ
        const existingMedia: MediaItem[] = post.images.map(
          (url: string, idx: number) => ({
            id: `old-${idx}`,
            url,
            previewUrl: url,
            progress: 100,
            isNew: false,
          }),
        );
        setMedia(existingMedia);
      } catch (error) {
        toast.error("Không tìm thấy thông tin sản phẩm");
        router.push("/manage-posts");
      } finally {
        setIsLoadingProduct(false);
      }
    };

    if (id) fetchProduct();
  }, [id, reset, router]);

  // --- Xử lý upload ảnh mới ---
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (media.length + files.length > 6) {
      toast.warn("Chỉ được đăng tối đa 6 ảnh");
      return;
    }

    const newItems: MediaItem[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      url: null,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      isNew: true,
    }));

    setMedia((prev) => [...prev, ...newItems]);

    // Upload song song
    newItems.forEach(async (item, i) => {
      try {
        const res = await uploadFile(files[i], (p: number) => {
          setMedia((prev) =>
            prev.map((m) => (m.id === item.id ? { ...m, progress: p } : m)),
          );
        });

        setMedia((prev) =>
          prev.map((m) =>
            m.id === item.id
              ? { ...m, url: res.url, fileId: res.fileId, progress: 100 }
              : m,
          ),
        );
      } catch (error) {
        toast.error(`Lỗi tải ảnh: ${files[i].name}`);
        URL.revokeObjectURL(item.previewUrl);
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
      }
    });

    e.target.value = "";
  };

  // --- Xoá ảnh (cả mới và cũ) ---
  const removeImage = (item: MediaItem) => {
    if (item.isNew && item.fileId) {
      // Ảnh mới: lưu fileId để xoá sau khi submit thành công
      setTrashIds((prev) => [...prev, item.fileId!]);
    }
    // Ảnh cũ không cần xoá trực tiếp, chỉ cần không gửi lên server nữa
    if (item.previewUrl && item.isNew) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setMedia((prev) => prev.filter((i) => i.id !== item.id));
  };

  // --- Submit chỉnh sửa ---
  const onSubmit = async (data: IProductForm) => {
    // Kiểm tra upload hoàn tất
    if (media.some((m) => m.progress < 100)) {
      toast.info("Vui lòng đợi ảnh tải lên hoàn tất");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gửi toàn bộ data (ảnh cũ + mới) lên server
      await api.patch(`/posts/update/${id}`, data);
      toast.success("Cập nhật tin đăng thành công!");

      // Xoá ảnh rác (ảnh mới đã tải lên nhưng bị xoá)
      if (trashIds.length > 0) {
        trashIds.forEach((fileId) => deleteImageFromServer(fileId));
      }

      setTimeout(() => router.push("/my-posts"), 1500);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="max-w-2xl mx-auto bg-white p-4 border-b sticky top-0 z-10 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={24} />
        </button>
        <h1 className="font-bold text-xl">Chỉnh sửa tin đăng</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl mx-auto bg-white shadow-sm"
      >
        {/* PHẦN 1: HÌNH ẢNH */}
        <div className="p-6 border-b">
          <h3 className="font-bold text-lg mb-4">
            Hình ảnh sản phẩm <span className="text-red-500">*</span>
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-2xl bg-orange-50 cursor-pointer">
              <Camera className="text-orange-500" />
              <input
                type="file"
                multiple
                hidden
                onChange={handleFileChange}
                accept="image/*"
              />
            </label>
            {media.map((m) => (
              <div key={m.id} className="relative aspect-square">
                <ImagePreview
                  fileData={{
                    url: m.url || m.previewUrl,
                    progress: m.progress,
                    name: "img",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(m)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          {errors.images && (
            <p className="text-red-500 text-xs mt-2">{errors.images.message}</p>
          )}
        </div>

        {/* PHẦN 2: THÔNG TIN CHI TIẾT */}
        <div className="p-6 space-y-6">
          {/* Danh mục 2 cấp */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                <Tag size={16} className="text-gray-400" /> Danh mục chính{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                {...register("parentCategoryId")}
                className={`w-full p-3 border rounded-xl outline-none bg-white font-medium ${
                  errors.parentCategoryId ? "border-red-500" : "border-gray-200"
                }`}
                disabled={isLoadingCats}
              >
                <option value="">
                  {isLoadingCats ? "Đang tải..." : "Chọn danh mục"}
                </option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.parentCategoryId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.parentCategoryId.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                Chi tiết (Tùy chọn)
              </label>
              <select
                {...register("categoryId")}
                disabled={!formData.parentCategoryId || isLoadingCats}
                className={`w-full p-3 border rounded-xl outline-none bg-white font-medium ${
                  !formData.parentCategoryId
                    ? "bg-gray-100 border-gray-200"
                    : "border-gray-200"
                }`}
              >
                <option value="">-- Khác --</option>
                {subCategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="block text-sm font-bold mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title")}
              className={`w-full p-3 border rounded-xl outline-none ${
                errors.title
                  ? "border-red-500"
                  : "border-gray-200 focus:border-orange-500"
              }`}
              placeholder="VD: iPhone 14 Pro Max..."
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Giá và thương lượng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">
                Giá bán (đ) *
              </label>
              <input
                type="number"
                {...register("price")}
                className={`w-full p-3 border rounded-xl outline-none ${
                  errors.price ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("priceNegotiable")}
                  className="w-5 h-5 accent-orange-500"
                />
                <span className="text-sm font-medium">Có thể thương lượng</span>
              </label>
            </div>
          </div>

          {/* Tình trạng chi tiết */}
          <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
            <h4 className="font-bold text-sm text-gray-600 uppercase">
              Chi tiết tình trạng
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Tình trạng *
                </label>
                <select
                  {...register("condition.label")}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="new">Mới (Chưa khui)</option>
                  <option value="like_new">Như mới (99%)</option>
                  <option value="good">Tốt (Đã sử dụng)</option>
                  <option value="fair">Khá (Trầy xước nhẹ)</option>
                  <option value="for_parts">Lấy linh kiện (Hỏng)</option>
                </select>
              </div>
              {/* <div>
                <label className="block text-xs font-bold mb-1">
                  Độ mới (%)
                </label>
                <input
                  type="number"
                  {...register("condition.percentage")}
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  placeholder="VD: 95"
                />
              </div> */}
            </div>
            {/* <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Bảo hành</label>
                <input
                  type="text"
                  {...register("condition.warranty")}
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  placeholder="VD: 12 tháng"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("condition.isFullbox")}
                    className="w-5 h-5 accent-orange-500"
                  />
                  <span className="text-sm font-medium">
                    Fullbox (Đầy đủ phụ kiện)
                  </span>
                </label>
              </div>
            </div> */}
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-bold mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className={`w-full p-3 border rounded-xl outline-none resize-none ${
                errors.description ? "border-red-500" : "border-gray-200"
              }`}
              placeholder="Mô tả tình trạng, phụ kiện..."
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-sm font-bold mb-2">
              Địa chỉ giao dịch <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddrModalOpen(true)}
              className="w-full p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <MapPin
                  size={20}
                  className={
                    formData.province ? "text-orange-500" : "text-gray-400"
                  }
                />
                <span
                  className={
                    formData.province
                      ? "text-gray-800 font-medium"
                      : "text-gray-400"
                  }
                >
                  {formData.province
                    ? `${formData.detail ? formData.detail + ", " : ""}${formData.ward}, ${formData.province}`
                    : "Chọn địa chỉ"}
                </span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            {(errors.province || errors.ward) && (
              <p className="text-red-500 text-xs mt-1">
                Vui lòng chọn địa chỉ đầy đủ
              </p>
            )}
          </div>
        </div>

        {/* Nút bấm */}
        <div className="p-6 flex gap-4">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 py-4 font-bold text-gray-700 bg-gray-100 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Eye size={20} /> Xem trước
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-600 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>

      {/* Modal địa chỉ */}
      <AddressModal
        isOpen={isAddrModalOpen}
        onClose={() => setIsAddrModalOpen(false)}
        initialData={{
          province: watch("province"),
          provinceCode: watch("provinceCode"),
          ward: watch("ward"),
          wardCode: watch("wardCode"),
          detail: watch("detail"),
        }}
        onSelect={(d: AddressData) => {
          setValue("province", d.province, { shouldValidate: true });
          setValue("provinceCode", d.provinceCode, { shouldValidate: true });
          setValue("ward", d.ward, { shouldValidate: true });
          setValue("wardCode", d.wardCode, { shouldValidate: true });
          setValue("detail", d.detail, { shouldValidate: true });
          setIsAddrModalOpen(false);
        }}
      />

      {isPreviewOpen && (
        <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-extrabold text-gray-800">
                Xem trước tin đăng
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 bg-white rounded-full shadow-sm"
              >
                <X size={20} color="gray" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Hình ảnh */}
              <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden">
                {media.length > 0 ? (
                  <img
                    src={media[0].previewUrl}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Chưa có ảnh
                  </div>
                )}
              </div>

              {/* Tiêu đề */}
              <h2 className="text-xl font-extrabold text-gray-800">
                {formData.title || "Tiêu đề"}
              </h2>

              {/* Giá và thương lượng */}
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-orange-600">
                  {formData.price?.toLocaleString()} đ
                </p>
                {formData.priceNegotiable && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    Có thể thương lượng
                  </span>
                )}
              </div>

              {/* Tình trạng & Khu vực */}
              <div className="flex gap-4 py-4 border-t border-b border-gray-100">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    Tình trạng
                  </p>
                  <p className="font-bold text-gray-700">
                    {(() => {
                      const labelMap: Record<string, string> = {
                        new: "Mới (Chưa khui)",
                        like_new: "Như mới",
                        good: "Tốt",
                        fair: "Khá",
                        for_parts: "Lấy linh kiện",
                      };
                      const base =
                        labelMap[formData.condition.label] ||
                        formData.condition.label;
                      return `${base} • ${formData.condition.percentage}%`;
                    })()}
                  </p>
                  {formData.condition.isFullbox && (
                    <p className="text-xs text-green-600 mt-1">✅ Fullbox</p>
                  )}
                  {formData.condition.warranty &&
                    formData.condition.warranty !== "Không bảo hành" && (
                      <p className="text-xs text-blue-600">
                        🔧 Bảo hành: {formData.condition.warranty}
                      </p>
                    )}
                </div>
                <div className="flex-1 pl-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    Khu vực
                  </p>
                  <p className="font-bold text-gray-700 truncate">
                    {formData.province || "Chưa chọn"}
                  </p>
                </div>
              </div>

              {/* Địa chỉ đầy đủ */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Địa chỉ đầy đủ
                </p>
                <p className="text-sm font-medium text-gray-700">
                  {formData.province
                    ? [formData.detail, formData.ward, formData.province]
                        .filter(Boolean)
                        .join(", ")
                    : "Chưa nhập địa chỉ"}
                </p>
              </div>
            </div>

            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-[20px] font-bold hover:bg-gray-300 transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
