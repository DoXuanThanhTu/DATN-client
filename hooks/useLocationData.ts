"use client";
import api from "@/app/services/api";
import { useQuery } from "@tanstack/react-query";

export const useLocationData = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      if (typeof window === "undefined") return null;

      const CACHE_KEY = "vn-locations-session-cache";
      const cached = sessionStorage.getItem(CACHE_KEY);

      if (cached) return JSON.parse(cached);

      const { data } = await api.get("/locations/by-province");
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    },
    staleTime: Infinity,
  });
};
