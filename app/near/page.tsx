"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import GoongMap from "@/components/map/GoongMap";
import api from "@/app/services/api";
import { MapPin, Navigation, Search, Loader2 } from "lucide-react";

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  distanceKm: number;
}

export default function NearbyWithMap() {
  const searchParams = useSearchParams();
  const provinceCode = searchParams.get("provinceCode");
  const wardCode = searchParams.get("wardCode");

  const [coords, setCoords] = useState<[number, number]>([105.8342, 21.0278]); // Mặc định HN
  const [address, setAddress] = useState("Đang xác định vị trí...");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const apiKey = "uWnZhSu6PnSQLjSecNxaVLa14bGwsKLkFw6ZnKIa";

  // ================= FETCH DATA =================
  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const res = await api.get("/posts/nearby", {
        params: { lat, lng, distance: 10, limit: 8 },
      });
      setProducts(res.data.data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= XỬ LÝ ĐỊA CHỈ TỪ TOẠ ĐỘ (REVERSE GEOCODE) =================
  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${apiKey}`,
      );
      const data = await res.json();
      if (data.results?.[0]) {
        setAddress(data.results[0].formatted_address);
      }
    } catch (error) {
      setAddress("Vị trí đã chọn");
    }
  };

  // ================= LOGIC KHỞI TẠO ƯU TIÊN =================
  useEffect(() => {
    const initLocation = async () => {
      // 1. Nếu có code từ Query (Ưu tiên 2 sau GPS nếu bạn muốn, nhưng ở đây tôi ưu tiên Query trước nếu tồn tại)
      if (provinceCode || wardCode) {
        // Gọi API nội bộ của bạn để lấy tọa độ từ Code tỉnh/huyện
        // Ví dụ giả định: fetchCoordsByCode(provinceCode, wardCode)
        // Nếu không có API đó, ta sẽ nhảy xuống GPS.
      }

      // 2. Mặc định: Xin quyền GPS
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setCoords([longitude, latitude]);
            getAddressFromCoords(latitude, longitude);
            fetchNearby(latitude, longitude);
          },
          () => {
            // Nếu từ chối GPS hoặc lỗi -> Dùng mặc định HN
            fetchNearby(coords[1], coords[0]);
            setAddress("Hà Nội (Mặc định)");
          },
        );
      }
    };

    initLocation();
  }, [provinceCode, wardCode]);

  // ================= HANDLERS =================
  const handleSearch = async () => {
    if (!keyword) return;
    try {
      const res = await fetch(
        `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(keyword)}&api_key=${apiKey}`,
      );
      const data = await res.json();
      const result = data?.results?.[0];
      if (result) {
        const { lat, lng } = result.geometry.location;
        setCoords([lng, lat]);
        setAddress(result.formatted_address);
        fetchNearby(lat, lng);
      }
    } catch (err) {
      alert("Không tìm thấy địa chỉ");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* SEARCH BAR & ACTIONS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <button
          onClick={() =>
            navigator.geolocation.getCurrentPosition((p) => {
              setCoords([p.coords.longitude, p.coords.latitude]);
              fetchNearby(p.coords.latitude, p.coords.longitude);
              getAddressFromCoords(p.coords.latitude, p.coords.longitude);
            })
          }
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-xl font-medium"
        >
          <Navigation size={18} />
          <span className="whitespace-nowrap">Vị trí hiện tại</span>
        </button>

        <div className="relative flex-1 group">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm kiếm khu vực khác..."
            className="w-full pl-11 pr-24 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Tìm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: MAP */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <MapPin size={18} className="text-red-500" />
            <span className="text-sm font-medium truncate">{address}</span>
          </div>

          <div className="h-[450px] rounded-2xl overflow-hidden border-4 border-white shadow-md relative">
            <GoongMap
              center={coords}
              onChange={(data) => {
                setCoords([data.lng, data.lat]);
                setAddress(data.address);
                fetchNearby(data.lat, data.lng);
              }}
            />
          </div>
        </div>

        {/* RIGHT: LIST */}
        <div className="space-y-4">
          <h2 className="font-bold text-xl flex items-center gap-2 text-gray-800">
            ✨ Gợi ý gần bạn
          </h2>

          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            ) : products.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-400">
                  Không tìm thấy bài đăng nào quanh đây
                </p>
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p._id}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-28 h-28 flex-shrink-0">
                    <img
                      src={p.images?.[0] || "/placeholder.png"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                        {p.title}
                      </h4>
                      <p className="text-orange-600 font-bold mt-1">
                        {p.price.toLocaleString()} đ
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                        {p.distanceKm.toFixed(1)} km
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component Skeleton cho hiệu ứng loading mượt mà
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 animate-pulse">
      <div className="w-24 h-24 bg-gray-200 rounded-lg" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/4 mt-4" />
      </div>
    </div>
  );
}
