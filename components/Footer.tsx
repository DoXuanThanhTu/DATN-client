import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white pt-12 pb-1 mt-auto  text-gray-600 ">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-8 justify-between">
          <div className="col-span-12 sm:col-span-4 md:col-span-4">
            <h3 className="mb-3 text-orange-500 font-black text-2xl">
              CHỢ VIỆT
            </h3>
          </div>

          <div className="col-span-6 sm:col-span-4 md:col-span-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Khám Phá
            </h4>
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-sm text-gray-500 ">
                Trang chủ
              </Link>
              <Link href="/about" className="text-sm text-gray-500 ">
                Về chúng tôi
              </Link>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-4 md:col-span-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Hỗ Trợ</h4>
            <div className="flex flex-col space-y-2">
              <Link href="/chat" className="text-sm text-gray-500 ">
                Điều khoản sử dụng
              </Link>
              <Link href="#" className="text-sm text-gray-500 ">
                Chính sách bảo mật
              </Link>
              <Link href="#" className="text-sm text-gray-500 ">
                Giải quyết tranh chấp
              </Link>
            </div>
          </div>
        </div>
        <hr className="m-4 border-gray-200" />

        <div className="text-center text-sm text-gray-500">
          <span>Copyright © {new Date().getFullYear()} </span>
          <Link href="/" className="font-medium text-gray-700 hover:underline">
            CHỢ VIỆT
          </Link>
          <span>. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
