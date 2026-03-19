"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/useAuthStore";
import api from "@/app/services/api";

export default function ActivityTracker() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const updateStatusApi = async () => {
      try {
        await api.post("/users/status");
      } catch (error) {
        console.error("Failed to update status");
      }
    };

    updateStatusApi();

    const heartbeat = setInterval(updateStatusApi, 120000);

    return () => clearInterval(heartbeat);
  }, [user]);

  return null;
}
