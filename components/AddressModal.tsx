"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLocationData } from "@/hooks/useLocationData";
import SelectionOverlay from "./SelectionOverlay";
import GoongMap from "@/components/map/GoongMap";
import {
  ChevronRight,
  X,
  MapPin,
  Navigation,
  Search,
  Loader2,
} from "lucide-react";

const GOONG_API_KEY = "uWnZhSu6PnSQLjSecNxaVLa14bGwsKLkFw6ZnKIa";

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
  lat: number;
  lng: number;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: AddressState) => void;
  initialData?: AddressState;
}

export default function AddressModal({
  isOpen,
  onClose,
  onSelect,
  initialData,
}: AddressModalProps) {
  const [address, setAddress] = useState<AddressState>(() => ({
    province: initialData?.province || "",
    provinceCode: initialData?.provinceCode || "",
    ward: initialData?.ward || "",
    wardCode: initialData?.wardCode || "",
    detail: initialData?.detail || "",
    lat: initialData?.lat || 21.0285,
    lng: initialData?.lng || 105.8542,
  }));

  const [mapPreviewAddress, setMapPreviewAddress] = useState("");
  const [hasEnteredDetail, setHasEnteredDetail] = useState(
    !!initialData?.detail,
  );
  const [step, setStep] = useState<number | null>(null);
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Ref để xử lý click ra ngoài đóng gợi ý
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const isAutoFilling = useRef(false);

  const { data, isLoading: isLocationLoading } = useLocationData();
  const locations = data as IProvince[] | undefined;

  // Xử lý sự kiện click toàn cục để đóng Autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setPredictions([]); // Đóng danh sách gợi ý
      }
    };

    if (predictions.length > 0) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [predictions]);

  // Logic Autocomplete
  useEffect(() => {
    if (isAutoFilling.current) {
      isAutoFilling.current = false;
      setPredictions([]);
      return;
    }

    if (address.detail.length < 2) {
      setPredictions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchQuery = `${address.detail}${address.ward ? `, ${address.ward}` : ""}${address.province ? `, ${address.province}` : ""}`;
        const res = await fetch(
          `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(searchQuery)}`,
        );
        const data = await res.json();
        setPredictions(data.predictions || []);
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [address.detail]);

  const handleSelectPrediction = async (prediction: any) => {
    try {
      isAutoFilling.current = true;
      const res = await fetch(
        `https://rsapi.goong.io/Place/Detail?place_id=${prediction.place_id}&api_key=${GOONG_API_KEY}`,
      );
      const data = await res.json();
      const { location } = data.result.geometry;

      setAddress((prev) => ({
        ...prev,
        lat: location.lat,
        lng: location.lng,
        detail: prediction.structured_formatting.main_text,
      }));

      setPredictions([]);
      setHasEnteredDetail(true);
      setMapPreviewAddress("");
    } catch (error) {
      isAutoFilling.current = false;
    }
  };

  const handleMapChange = (mapData: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    setAddress((prev) => ({ ...prev, lat: mapData.lat, lng: mapData.lng }));
    setMapPreviewAddress(mapData.address);
    setPredictions([]);
  };

  const fullAddressPreview = useMemo(() => {
    // if (mapPreviewAddress) return mapPreviewAddress;
    const parts = [address.detail, address.ward, address.province].filter(
      Boolean,
    );
    return parts.join(", ");
  }, [address, mapPreviewAddress]);

  const currentListData = useMemo((): string[] => {
    if (!locations) return [];
    if (step === 1) return locations.map((p) => p.Name);
    if (step === 2 && address.provinceCode) {
      const selectedProv = locations.find(
        (p) => p.Code === address.provinceCode,
      );
      return selectedProv ? selectedProv.Wards.map((w) => w.FullName) : [];
    }
    return [];
  }, [step, locations, address.provinceCode]);

  const handleOverlaySelect = (name: string) => {
    if (!locations) return;
    if (step === 1) {
      const selectedProv = locations.find((p) => p.Name === name);
      setAddress((prev) => ({
        ...prev,
        province: name,
        provinceCode: selectedProv?.Code || "",
        ward: "",
        wardCode: "",
      }));
    } else if (step === 2) {
      const currentProv = locations.find(
        (p) => p.Code === address.provinceCode,
      );
      const selectedWard = currentProv?.Wards.find((w) => w.FullName === name);
      setAddress((prev) => ({
        ...prev,
        ward: name,
        wardCode: selectedWard?.Code || "",
      }));
    }
    setStep(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg h-auto max-h-[90vh] rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black text-gray-800 tracking-tight">
            Địa chỉ giao hàng
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Nội dung Form */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-gray-400 uppercase ml-1">
                Tỉnh / Thành phố *
              </label>
              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 border-2 border-transparent hover:border-orange-200 rounded-2xl transition-all"
              >
                <span
                  className={
                    address.province
                      ? "text-gray-800 font-bold"
                      : "text-gray-400"
                  }
                >
                  {address.province || "Chọn tỉnh / thành phố"}
                </span>
                <ChevronRight size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-gray-400 uppercase ml-1">
                Phường / Xã *
              </label>
              <button
                disabled={!address.province || isLocationLoading}
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 border-2 border-transparent disabled:opacity-50 rounded-2xl transition-all"
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
          </div>

          {/* Bọc phần Textarea và Dropdown vào Ref */}
          <div className="space-y-1 relative" ref={autocompleteRef}>
            <label className="text-[11px] font-black text-gray-400 uppercase ml-1">
              Địa chỉ cụ thể
            </label>
            <div className="relative">
              <textarea
                rows={2}
                className="w-full p-4 pr-12 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-orange-400 font-medium text-gray-800 transition-all placeholder:text-gray-300 resize-none"
                placeholder="Số nhà, tên đường..."
                value={address.detail}
                onChange={(e) => {
                  isAutoFilling.current = false;
                  setAddress({ ...address, detail: e.target.value });
                  setMapPreviewAddress("");
                  if (e.target.value.trim().length > 0)
                    setHasEnteredDetail(true);
                }}
              />
              <div className="absolute right-4 top-4 text-gray-400">
                {isSearching ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Search size={20} />
                )}
              </div>
            </div>

            {/* Dropdown gợi ý */}
            {predictions.length > 0 && (
              <div className="absolute z-[3000] left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-2xl border border-gray-100 max-h-[220px] overflow-y-auto">
                {predictions.map((item: any) => (
                  <button
                    key={item.place_id}
                    onClick={() => handleSelectPrediction(item)}
                    className="w-full text-left p-4 hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors flex items-start gap-3"
                  >
                    <MapPin size={16} className="text-gray-400 mt-1 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm text-gray-800 truncate">
                        {item.structured_formatting.main_text}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasEnteredDetail && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
              <label className="text-[11px] font-black text-gray-400 uppercase ml-1">
                Địa chỉ chính xác{" "}
              </label>
              <div className="w-full h-[250px] rounded-3xl overflow-hidden relative border-2 border-gray-50 shadow-inner">
                <GoongMap
                  center={[address.lng, address.lat]}
                  onChange={handleMapChange}
                />
              </div>
            </div>
          )}

          {(address.ward || mapPreviewAddress) && (
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3 animate-in fade-in">
              <MapPin size={20} className="text-orange-500 shrink-0" />
              <div className="text-sm text-gray-700 font-medium leading-tight">
                <span className="text-orange-600 font-black text-[10px] uppercase block mb-1">
                  Địa chỉ sẽ lưu:
                </span>
                {fullAddressPreview}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button
            disabled={
              !address.ward ||
              !address.province ||
              (!address.detail && !mapPreviewAddress)
            }
            onClick={() => {
              onSelect({
                ...address,
                detail: mapPreviewAddress || address.detail,
              });
              onClose();
            }}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-black rounded-2xl uppercase transition-all active:scale-[0.98] shadow-xl shadow-orange-200"
          >
            Lưu địa chỉ này
          </button>
        </div>

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
