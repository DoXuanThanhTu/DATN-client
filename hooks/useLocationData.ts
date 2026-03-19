"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useLocationData = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      if (typeof window === "undefined") return null;

      const CACHE_KEY = "vn-locations-session-cache";
      const cached = sessionStorage.getItem(CACHE_KEY);

      if (cached) return JSON.parse(cached);

      const { data } = await axios.get(
        "http://localhost:5000/api/locations/by-province",
      );
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    },
    staleTime: Infinity,
  });
};
