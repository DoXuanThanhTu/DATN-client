import { Suspense } from "react";
import WalletClient from "@/components/WalletClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Đang tải ví...</div>}>
      <WalletClient />
    </Suspense>
  );
}
