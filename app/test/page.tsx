// "use client";

// import { useState } from "react";
// import AddressModal from "@/components/AddressModal";

// const API_KEY = process.env.NEXT_PUBLIC_GOONG_KEY!;

// export default function AddressContainer() {
//   const [open, setOpen] = useState(false);
//   const [coords, setCoords] = useState<[number, number] | null>(null);
//   const [geoData, setGeoData] = useState<any>(null);
//   const [selectedAddress, setSelectedAddress] = useState<any>(null);

//   // 👉 từ AddressModal
//   const handleSelectAddress = async (addr: any) => {
//     setSelectedAddress(addr);

//     const fullAddress = `${addr.detail}, ${addr.ward}, ${addr.province}, Vietnam`;

//     await geocode(fullAddress);
//   };

//   // 👉 từ Autocomplete
//   const handleSelectPlace = async (placeId: string, description: string) => {
//     await geocode(description);
//   };

//   // 👉 gọi Geocode chung
//   const geocode = async (address: string) => {
//     try {
//       const res = await fetch(
//         `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${API_KEY}`,
//       );

//       const data = await res.json();

//       if (data.status === "OK" && data.results.length > 0) {
//         const best = data.results[0];

//         const { lat, lng } = best.geometry.location;

//         setCoords([lng, lat]);

//         setGeoData({
//           formatted: best.formatted_address,
//           placeId: best.place_id,
//         });
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return (
//     <div className="p-6 space-y-4">
//       {/* Button mở modal */}
//       <button
//         onClick={() => setOpen(true)}
//         className="px-4 py-2 bg-orange-500 text-white rounded-xl"
//       >
//         Chọn địa chỉ (manual)
//       </button>

//       {/* Autocomplete */}

//       <AddressModal
//         isOpen={open}
//         onClose={() => setOpen(false)}
//         onSelect={handleSelectAddress}
//       />

//       {/* Hiển thị địa chỉ */}
//       {selectedAddress && (
//         <div className="p-4 bg-gray-50 rounded-xl">
//           <b>Địa chỉ đã chọn:</b>
//           <p>
//             {selectedAddress.detail}, {selectedAddress.ward},{" "}
//             {selectedAddress.province}
//           </p>
//         </div>
//       )}

//       {/* Geocode */}
//       {geoData && (
//         <div className="p-4 bg-green-50 rounded-xl">
//           <p>📍 {geoData.formatted}</p>
//           <p>🆔 {geoData.placeId}</p>
//         </div>
//       )}

//       {/* Map */}
//     </div>
//   );
// }
"use client";
import React, { useEffect, useState } from "react";
import api from "../services/api";
/**
 * TYPE
 */
type RecommendItem = {
  item: any;
  score: number;
  debug: {
    tfidfSim: number;
    loc: number;
    price: number;
    cond: number;
    cat: number;
    pop: number;
  };
};

type Response = {
  success: boolean;
  type: string;
  baseItem: string;
  data: RecommendItem[];
};

/**
 * API
 */
const fetchRecommend = async (): Promise<Response> => {
  const res = await api.get("/recommend/get-content-based-debug");
  return res.data;
};

/**
 * PAGE
 */
export default function RecommendFullPage() {
  const [data, setData] = useState<RecommendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"score" | "price" | "views">("score");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetchRecommend();
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  /**
   * SORT
   */
  const sortedData = [...data].sort((a, b) => {
    if (sort === "score") return b.score - a.score;
    if (sort === "price") return b.item.price - a.item.price;
    return b.item.views - a.item.views;
  });

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        Loading AI recommendations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          🤖 AI Recommendation Feed
        </h1>

        {/* SORT */}
        <select
          className="border p-2 rounded"
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
        >
          <option value="score">Sort by AI Score</option>
          <option value="price">Sort by Price</option>
          <option value="views">Sort by Views</option>
        </select>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedData.map((x) => (
          <div
            key={x.item._id}
            className="bg-white rounded-xl shadow hover:shadow-xl transition overflow-hidden"
          >
            {/* IMAGE */}
            <img
              src={x.item.images?.[0]}
              className="w-full h-52 object-cover"
            />

            <div className="p-4">
              {/* TITLE */}
              <h2 className="font-semibold text-lg line-clamp-2">
                {x.item.title}
              </h2>

              {/* PRICE */}
              <p className="text-green-600 font-bold text-lg mt-1">
                {x.item.price.toLocaleString()} đ
              </p>

              {/* LOCATION */}
              <p className="text-sm text-gray-500">
                📍 {x.item.location?.provinceName}
              </p>

              {/* VIEWS */}
              <p className="text-xs text-gray-400">
                👁 {x.item.views} views
              </p>

              {/* SCORE */}
              <div className="mt-2">
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded">
                  AI Score: {x.score.toFixed(3)}
                </span>
              </div>

              {/* CONDITION */}
              <p className="text-xs text-gray-400 mt-1">
                Condition: {x.item.condition?.label} (
                {x.item.condition?.percentage}%)
              </p>

              {/* BUTTON */}
              <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                View detail
              </button>

              {/* DEBUG PANEL */}
              <details className="mt-3 text-xs text-gray-500">
                <summary className="cursor-pointer">
                  AI Debug Breakdown
                </summary>

                <div className="mt-2 space-y-1">
                  <div>TF-IDF: {x.debug.tfidfSim.toFixed(3)}</div>
                  <div>Location: {x.debug.loc}</div>
                  <div>Price: {x.debug.price.toFixed(3)}</div>
                  <div>Condition: {x.debug.cond}</div>
                  <div>Category: {x.debug.cat}</div>
                  <div>Popularity: {x.debug.pop.toFixed(3)}</div>
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}