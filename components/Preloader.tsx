"use client";

import { useLocationData } from "@/hooks/useLocationData";
import { useCategoryData } from "@/hooks/useCategoryData";

export default function Preloader() {
  useLocationData();
  useCategoryData();
  return null;
}
