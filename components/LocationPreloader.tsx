"use client";

import { useLocationData } from "@/hooks/useLocationData";

export default function LocationPreloader() {
  useLocationData();
  return null;
}
