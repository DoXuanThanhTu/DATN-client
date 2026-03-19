import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-black text-gray-100">404</h1>
      <p className="text-xl font-bold text-gray-700 -mt-8 mb-6">
        Trang này không tồn tại hoặc đã bị gỡ
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-2xl font-black shadow-lg hover:bg-orange-600 transition-all"
      >
        <Home size={20} /> QUAY VỀ TRANG CHỦ
      </Link>
    </div>
  );
}
