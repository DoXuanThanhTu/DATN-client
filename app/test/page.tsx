"use client";

import { useState } from "react";
import AddressModal from "@/components/AddressModal";

const API_KEY = process.env.NEXT_PUBLIC_GOONG_KEY!;

export default function AddressContainer() {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  // 👉 từ AddressModal
  const handleSelectAddress = async (addr: any) => {
    setSelectedAddress(addr);

    const fullAddress = `${addr.detail}, ${addr.ward}, ${addr.province}, Vietnam`;

    await geocode(fullAddress);
  };

  // 👉 từ Autocomplete
  const handleSelectPlace = async (placeId: string, description: string) => {
    await geocode(description);
  };

  // 👉 gọi Geocode chung
  const geocode = async (address: string) => {
    try {
      const res = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${API_KEY}`,
      );

      const data = await res.json();

      if (data.status === "OK" && data.results.length > 0) {
        const best = data.results[0];

        const { lat, lng } = best.geometry.location;

        setCoords([lng, lat]);

        setGeoData({
          formatted: best.formatted_address,
          placeId: best.place_id,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Button mở modal */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-orange-500 text-white rounded-xl"
      >
        Chọn địa chỉ (manual)
      </button>

      {/* Autocomplete */}

      <AddressModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={handleSelectAddress}
      />

      {/* Hiển thị địa chỉ */}
      {selectedAddress && (
        <div className="p-4 bg-gray-50 rounded-xl">
          <b>Địa chỉ đã chọn:</b>
          <p>
            {selectedAddress.detail}, {selectedAddress.ward},{" "}
            {selectedAddress.province}
          </p>
        </div>
      )}

      {/* Geocode */}
      {geoData && (
        <div className="p-4 bg-green-50 rounded-xl">
          <p>📍 {geoData.formatted}</p>
          <p>🆔 {geoData.placeId}</p>
        </div>
      )}

      {/* Map */}
    </div>
  );
}
