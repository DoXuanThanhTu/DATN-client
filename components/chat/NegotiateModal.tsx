"use client";
import React, { useState, useEffect } from "react";
import { X, MessageSquareQuote, Banknote } from "lucide-react";

interface NegotiateModalProps {
  product: {
    title: string;
    price: number;
    image: string;
  };
  onClose: () => void;
  onSend: (amount: number, message: string) => void;
}

export default function NegotiateModal({
  product,
  onClose,
  onSend,
}: NegotiateModalProps) {
  const [negotiatePrice, setNegotiatePrice] = useState<string>("");
  const [message, setMessage] = useState(
    `Mình rất thích món này, để cho mình giá này nhé!`,
  );
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);

  const suggestions = [
    { label: "-5%", rate: 0.95 },
    { label: "-10%", rate: 0.9 },
    { label: "-15%", rate: 0.85 },
  ];

  const formatDisplayPrice = (value: string) => {
    return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (val: string) => {
    setActiveSuggestion(null);
    setNegotiatePrice(formatDisplayPrice(val));
  };

  const selectSuggestion = (rate: number, index: number) => {
    setActiveSuggestion(index);
    const calculatedPrice = Math.round(product.price * rate);
    setNegotiatePrice(formatDisplayPrice(calculatedPrice.toString()));
  };

  const handleSend = () => {
    const amount = parseInt(negotiatePrice.replace(/\D/g, ""));
    if (!amount || amount <= 0) return;
    onSend(amount, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-300">
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">Trả giá</h2>
          <button
            onClick={onClose}
            className="absolute right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Thông tin sản phẩm */}
          <div className="flex gap-4 p-3 bg-gray-50 rounded-2xl items-center">
            <img
              src={product.image}
              className="w-14 h-14 object-cover rounded-xl shadow-sm"
              alt={product.title}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium mb-0.5">
                Giá gốc
              </p>
              <p className="font-bold text-lg text-gray-900 leading-none">
                {product.price.toLocaleString()} đ
              </p>
            </div>
          </div>

          {/* Nhập giá mong muốn */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Banknote size={18} className="text-green-600" />
              Giá bạn muốn trả
            </label>
            <div className="relative group">
              <input
                type="text"
                autoFocus
                placeholder="0"
                value={negotiatePrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full py-5 px-6 bg-white border-2 border-gray-100 rounded-2xl text-center font-black text-3xl text-yellow-600 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 outline-none transition-all placeholder:text-gray-200"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">
                đ
              </span>
            </div>

            {/* Gợi ý nhanh */}
            <div className="flex gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={s.label}
                  onClick={() => selectSuggestion(s.rate, idx)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all border ${
                    activeSuggestion === idx
                      ? "bg-yellow-400 border-yellow-400 text-black shadow-md"
                      : "bg-white border-gray-200 text-gray-600 hover:border-yellow-200 hover:bg-yellow-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nhập tin nhắn */}
          {/* <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MessageSquareQuote size={18} className="text-blue-500" />
              Lời nhắn cho người bán
            </label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 outline-none resize-none h-24 text-sm text-gray-700 leading-relaxed"
                maxLength={100}
              />
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-white/50 backdrop-blur-sm rounded-lg text-[10px] font-medium text-gray-400">
                {message.length}/100
              </div>
            </div>
          </div> */}

          {/* Nút gửi */}
          <button
            onClick={handleSend}
            disabled={!negotiatePrice}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-[0.98] ${
              negotiatePrice
                ? "bg-yellow-400 hover:bg-yellow-500 text-black shadow-yellow-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
