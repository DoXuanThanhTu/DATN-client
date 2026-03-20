"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocationData } from "@/hooks/useLocationData";
import SelectionOverlay from "./SelectionOverlay";
import { ChevronRight, X, MapPin } from "lucide-react";

// --- 1. Định nghĩa Interfaces ---
interface IWard {
  Code: string;
  FullName: string;
}

interface IProvince {
  Code: string;
  Name: string;
  Wards: IWard[];
}

interface AddressState {
  province: string;
  provinceCode: string;
  ward: string;
  wardCode: string;
  detail: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: AddressState) => void;
  initialData?: AddressState; // Nhận dữ liệu từ form cũ
}

export default function AddressModal({
  isOpen,
  onClose,
  onSelect,
  initialData,
}: AddressModalProps) {
  // --- 2. Logic Đồng bộ dữ liệu cũ ---
  const [address, setAddress] = useState<AddressState>(() => ({
    province: initialData?.province || "",
    provinceCode: initialData?.provinceCode || "",
    ward: initialData?.ward || "",
    wardCode: initialData?.wardCode || "",
    detail: initialData?.detail || "",
  }));

  const [step, setStep] = useState<number | null>(null);

  // Ép kiểu dữ liệu từ hook
  const { data, isLoading } = useLocationData();
  const locations = data as IProvince[] | undefined;

  const updateAddress = useCallback((data: Partial<AddressState>) => {
    setAddress((prev) => ({ ...prev, ...data }));
  }, []);

  const fullAddressPreview = useMemo(() => {
    const parts = [address.detail, address.ward, address.province].filter(
      Boolean,
    );
    return parts.join(", ");
  }, [address]);

  // --- 3. Xử lý Danh sách hiển thị ---
  const currentListData = useMemo((): string[] => {
    if (!locations) return [];

    if (step === 1) {
      return locations.map((p) => p.Name);
    }

    if (step === 2 && address.provinceCode) {
      const selectedProv = locations.find(
        (p) => p.Code === address.provinceCode,
      );
      return selectedProv ? selectedProv.Wards.map((w) => w.FullName) : [];
    }
    return [];
  }, [step, locations, address.provinceCode]);

  // --- 4. Xử lý Chọn địa điểm ---
  const handleOverlaySelect = (name: string) => {
    if (!locations) return;

    if (step === 1) {
      const selectedProv = locations.find((p) => p.Name === name);
      updateAddress({
        province: name,
        provinceCode: selectedProv?.Code || "",
        ward: "",
        wardCode: "",
      });
    } else if (step === 2) {
      const currentProv = locations.find(
        (p) => p.Code === address.provinceCode,
      );
      const selectedWard = currentProv?.Wards.find((w) => w.FullName === name);
      updateAddress({
        ward: name,
        wardCode: selectedWard?.Code || "",
      });
    }
    setStep(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X size={24} />
          </button>
          <h3 className="text-lg font-black text-gray-800">
            Địa chỉ giao dịch
          </h3>
          <div className="w-10"></div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Tỉnh / Thành phố */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">
              Tỉnh / Thành phố *
            </label>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-orange-200 transition-all"
            >
              <span
                className={
                  address.province ? "text-gray-800 font-bold" : "text-gray-400"
                }
              >
                {address.province || "Chọn tỉnh / thành phố"}
              </span>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Phường / Xã */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">
              Phường / Xã *
            </label>
            <button
              type="button"
              disabled={!address.province || isLoading}
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-2xl disabled:bg-gray-50 disabled:opacity-60 transition-all"
            >
              <span
                className={
                  address.ward ? "text-gray-800 font-bold" : "text-gray-400"
                }
              >
                {address.ward || "Chọn phường / xã"}
              </span>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Địa chỉ cụ thể */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">
              Địa chỉ cụ thể (Số nhà, tên đường)
            </label>
            <input
              className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-orange-400 font-bold text-gray-800 transition-all placeholder:text-gray-300"
              placeholder="Ví dụ: 123 Đường ABC..."
              value={address.detail}
              onChange={(e) => updateAddress({ detail: e.target.value })}
            />
          </div>

          {/* Xem trước địa chỉ */}
          {address.ward && (
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-top-2">
              <MapPin size={18} className="text-orange-500 shrink-0" />
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                <span className="text-orange-600 font-bold text-xs uppercase block mb-1">
                  Địa chỉ sẽ hiển thị:
                </span>
                {fullAddressPreview}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <button
            disabled={!address.ward || !address.province}
            onClick={() => {
              onSelect(address);
              onClose();
            }}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-black rounded-2xl uppercase transition-all active:scale-[0.98] shadow-lg shadow-orange-200 disabled:shadow-none"
          >
            Xác nhận địa chỉ
          </button>
        </div>

        {/* Selection Overlay */}
        {step !== null && (
          <SelectionOverlay
            title={step === 1 ? "Chọn Tỉnh / Thành phố" : "Chọn Phường / Xã"}
            data={currentListData}
            onBack={() => setStep(null)}
            onSelect={handleOverlaySelect}
          />
        )}
      </div>
    </div>
  );
}
