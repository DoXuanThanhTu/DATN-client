"use client";

import api from "@/app/services/api";
import { useQuery } from "@tanstack/react-query";

export const useCategoryData = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      console.log("1. Bắt đầu queryFn");

      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem("app-categories-session-cache");
        if (cached) {
          console.log("2. Tìm thấy dữ liệu trong Cache, không gọi API nữa");
          return JSON.parse(cached);
        }
      }

      console.log("3. Không có cache, đang gọi API thực tế...");
      const res = await api.get("/categories");
      const data = res.data?.data || res.data || [];

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "app-categories-session-cache",
          JSON.stringify(data),
        );
      }
      return data;
    },
    staleTime: Infinity,
  });
};
