"use client";

import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const useLocationData = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await api.get("/locations");
      return res.data?.data || [];
    },
  });
};
