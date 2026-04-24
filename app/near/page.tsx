import { Suspense } from "react";
import NearbyWithMap from "@/components/Near";

export default function Page() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <NearbyWithMap />
    </Suspense>
  );
}
