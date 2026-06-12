"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-black text-black">404</h1>

      <p className="text-xl font-bold text-gray-700 mt-2 mb-6">
        Trang này không tồn tại
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-8 py-3 bg-gray-500 text-white rounded-2xl font-black shadow-lg hover:bg-gray-600 transition-all"
        >
          <ArrowLeft size={20} />
          QUAY LẠI
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-2xl font-black shadow-lg hover:bg-green-600 transition-all"
        >
          <Home size={20} />
          QUAY VỀ TRANG CHỦ
        </Link>
      </div>
    </div>
  );
}