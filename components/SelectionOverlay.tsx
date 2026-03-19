"use client";
import { useState, useMemo } from "react";
import { Search, ChevronLeft, X } from "lucide-react";

interface Props {
  title: string;
  data: string[];
  onBack: () => void;
  onSelect: (val: string) => void;
}

export default function SelectionOverlay({
  title,
  data,
  onBack,
  onSelect,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data, searchTerm]);

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {" "}
      {/* Header */}
      <div className="px-4 py-4 border-b flex items-center gap-2">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h4 className="flex-1 text-center font-bold text-gray-800 mr-8">
          {title}
        </h4>
      </div>
      <div className="p-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            autoFocus
            className="w-full pl-11 pr-10 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-400/20 transition-all text-sm font-medium"
            placeholder="Tìm kiếm nhanh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <button
              key={index}
              onClick={() => onSelect(item)}
              className="w-full px-6 py-4 text-left hover:bg-orange-50 border-b border-gray-50 transition-colors flex items-center justify-between group"
            >
              <span className="text-[15px] font-medium text-gray-700 group-hover:text-orange-600">
                {item}
              </span>
            </button>
          ))
        ) : (
          <div className="p-10 text-center text-gray-400">
            <p>Không tìm thấy kết quả</p>
          </div>
        )}
      </div>
    </div>
  );
}
