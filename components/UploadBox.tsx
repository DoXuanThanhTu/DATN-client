"use client";

import { useState, ChangeEvent, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  Camera,
  MapPin,
  ChevronRight,
  X,
  AlertCircle,
  Eye,
  Loader2,
} from "lucide-react";

import AddressModal from "./AddressModal";
import ImagePreview from "./ImagePreview";
import { uploadFile, deleteImageFromServer } from "../services/upload.service";
import api from "@/app/services/api";

const schema: yup.ObjectSchema<IProductForm> = yup.object().shape({
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
    .typeError("Phải là số")
    .required()
    .min(0, "Giá phải lớn hơn hoặc bằng 0"),
  province: yup.string().required("Vui lòng chọn tỉnh/thành phố"),
  provinceCode: yup.string().required("Vui lòng chọn tỉnh/thành phố"),
  ward: yup.string().required("Vui lòng chọn phường/xã"),
  wardCode: yup.string().required("Vui lòng chọn phường/xã"),
  detail: yup.string().ensure(),
  condition: yup.string().required("Vui lòng chọn tình trạng"),
  images: yup
    .array()
    .of(yup.string().required())
    .min(1, "Cần ít nhất 1 ảnh")
    .required(),
});

interface MediaItem {
  id: string;
  fileId?: string;
  url: string | null;
  previewUrl: string;
  progress: number;
}

interface IProductForm {
  title: string;
  description: string;
  price: number;
  province: string;
  provinceCode: string;
  ward: string;
  wardCode: string;
  detail: string;
  condition: string;
  images: string[];
}

interface AddressData {
  province: string;
  provinceCode: string;
  ward: string;
  wardCode: string;
  detail: string;
}

export default function ProductPostForm() {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [trashIds, setTrashIds] = useState<string[]>([]);
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      title: "",
      description: "",
      images: [],
      province: "",
      ward: "",
      condition: "Đã sử dụng (chưa sửa chữa)",
    },
  });

  const formData = watch();

  useEffect(() => {
    const urls = media.filter((m) => m.url).map((m) => m.url as string);
    setValue("images", urls, { shouldValidate: true });
  }, [media, setValue]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (media.length + files.length > 6) {
      toast.warn("Tối đa 6 ảnh");
      return;
    }

    const items: MediaItem[] = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      url: null,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
    }));

    setMedia((prev) => [...prev, ...items]);

    items.forEach(async (item, i) => {
      try {
        const res = await uploadFile(files[i], (p) => {
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
      } catch {
        toast.error(`Lỗi tải ảnh: ${files[i].name}`);
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
      }
    });
    e.target.value = "";
  };

  const onSubmit = async (data: IProductForm) => {
    const isUploading = media.some((m) => m.progress < 100);
    if (isUploading) {
      toast.info("Vui lòng đợi ảnh tải lên xong");
      return;
    }

    setIsSubmitting(true);

    const postPromise = api.post("/posts", data);

    toast.promise(postPromise, {
      pending: "Đang đăng tin của bạn...",
      success: "Đăng tin thành công!",
      error: {
        render({ data }) {
          const err = data as AxiosError<{ message: string }>;
          return err.response?.data?.message || "Đăng tin thất bại";
        },
      },
    });

    try {
      await postPromise;
      if (trashIds.length > 0) {
        Promise.allSettled(trashIds.map((id) => deleteImageFromServer(id)));
      }
      reset();
      setMedia([]);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl mx-auto bg-white shadow-sm"
      >
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
                  fileData={{ url: m.url, progress: m.progress, name: "img" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (m.fileId) setTrashIds([...trashIds, m.fileId]);
                    setMedia(media.filter((i) => i.id !== m.id));
                  }}
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

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title")}
              className={`w-full p-3 border rounded-xl outline-none ${errors.title ? "border-red-500" : "border-gray-200 focus:border-orange-500"}`}
              placeholder="VD: iPhone 14 Pro Max 256GB..."
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">
                Giá bán (đ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("price")}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none"
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                Tình trạng <span className="text-red-500">*</span>
              </label>
              <select
                {...register("condition")}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none bg-white font-medium"
              >
                <option value="Mới">Mới</option>
                <option value="Đã sử dụng (chưa sửa chữa)">
                  Đã sử dụng (chưa sửa chữa)
                </option>
                <option value="Đã sử dụng (đã sửa chữa)">
                  Đã sử dụng (đã sửa chữa)
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none resize-none"
              placeholder="Mô tả tình trạng sản phẩm, phụ kiện đi kèm..."
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Địa chỉ giao dịch <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddrModalOpen(true)}
              className="w-full p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:bg-gray-50 transition-colors"
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
          </div>
        </div>

        <div className="p-6 flex gap-4 bg-white ">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex-1 py-4 font-bold text-gray-700 bg-gray-100 rounded-2xl flex items-center justify-center gap-2"
          >
            <Eye size={20} /> Xem trước
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-600 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Đăng tin ngay"
            )}
          </button>
        </div>
      </form>
      <AddressModal
        isOpen={isAddrModalOpen}
        onClose={() => setIsAddrModalOpen(false)}
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
              <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden">
                {formData.images.length > 0 ? (
                  <img
                    src={
                      media.find((m) => m.url === formData.images[0])
                        ?.previewUrl
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Chưa có ảnh
                  </div>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-gray-800">
                {formData.title || "Tiêu đề"}
              </h2>
              <p className="text-2xl font-black text-orange-600">
                {formData.price?.toLocaleString()} đ
              </p>

              <div className="flex gap-4  py-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    Tình trạng
                  </p>
                  <p className="font-bold text-gray-700">
                    {formData.condition}
                  </p>
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
