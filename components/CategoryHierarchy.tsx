"use client";

import Link from "next/link";
import {
  Loader2,
  ChevronRight,
  Car,
  Smartphone,
  Sofa,
  Shirt,
  Package,
} from "lucide-react";

const IconMap: any = {
  car: <Car size={18} />,
  smartphone: <Smartphone size={18} />,
  sofa: <Sofa size={18} />,
  shirt: <Shirt size={18} />,
  default: <Package size={18} />,
};

export default function CategoryHoverTree({ categories, isLoadingCats }: any) {
  if (isLoadingCats) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
      {categories.map((parent: any) => (
        <div key={parent._id} className="relative group">
          {/* Nút Danh mục CHA */}
          <Link
            href={`/search?cat=${parent.slug}`}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-orange-500 hover:text-white transition-all duration-300 border border-transparent hover:shadow-lg hover:shadow-orange-200"
          >
            <span className="text-orange-500 group-hover:text-white transition-colors">
              {IconMap[parent.icon] || IconMap.default}
            </span>
            <span className="text-sm font-bold whitespace-nowrap">
              {parent.name}
            </span>
            <ChevronRight
              size={14}
              className="opacity-40 group-hover:rotate-90 group-hover:opacity-100 transition-all"
            />
          </Link>

          {/* Danh mục CON - Chỉ hiện khi Hover */}
          <div
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 
                        opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200"
          >
            <div className="grid grid-cols-1 gap-1">
              {parent.children && parent.children.length > 0 ? (
                parent.children.map((child: any) => (
                  <Link
                    key={child._id}
                    href={`/search?cat=${child.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 group/child transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-600 group-hover/child:text-orange-600">
                      {child.name}
                    </span>
                    {/* <div className="w-1 h-1 bg-gray-300 rounded-full group-hover/child:w-4 group-hover/child:bg-orange-400 transition-all" /> */}
                  </Link>
                ))
              ) : (
                <div className="p-3 text-[10px] text-gray-400 italic">
                  Không có mục con
                </div>
              )}
            </div>

            {/* Mũi tên nhọn phía trên menu xổ xuống */}
            <div className="absolute -top-1 left-6 w-2 h-2 bg-white border-t border-l border-gray-100 rotate-45" />
          </div>
        </div>
      ))}
    </div>
  );
}
