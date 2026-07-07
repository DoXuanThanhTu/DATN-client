"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import api from "@/app/services/api";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  revieweeId: string;
  type: "BUYER_TO_SELLER" | "SELLER_TO_BUYER";
  onSuccess: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  orderId,
  revieweeId,
  type,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Vui lòng chọn số sao!");
      return;
    }
    setLoading(true);
    try {
      // API Call khớp với Controller Backend đã viết
      await api.post("/reviews", {
        orderId,
        revieweeId,
        rating,
        comment,
        type,
      });

      alert("Cảm ơn bạn đã đánh giá!");
      onSuccess();
      onClose();
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Không thể gửi đánh giá. Có thể bạn đã đánh giá rồi?",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Đánh giá dịch vụ</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 text-center">
          <p className="text-gray-600 mb-6">Trải nghiệm của bạn như thế nào?</p>

          {/* Star Rating */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star
                  size={40}
                  className={`${
                    star <= (hover || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  } transition-colors duration-200`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Để lại nhận xét của bạn về sản phẩm/dịch vụ này..."
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl h-32 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
