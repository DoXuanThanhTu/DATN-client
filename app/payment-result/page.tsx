// app/payment-result/page.tsx
import { Suspense } from "react";
import PaymentResult from "@/components/PaymentResult";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Đang xử lý...</div>}>
      <PaymentResult />
    </Suspense>
  );
}
