// services/mockService.ts

export const MockService = {
  // Giả lập tính phí ship
  calculateShippingFee: (address: string) => {
    return address.includes("Hà Nội") ? 20000 : 35000;
  },

  // Giả lập mã vận đơn của GHN/GHTK
  generateTrackingCode: () => {
    return "GHN" + Math.random().toString(36).substring(2, 10).toUpperCase();
  },

  // Giả lập cổng thanh toán VNPay
  processVNPayPayment: async (amount: number) => {
    console.log(`Đang chuyển hướng tới VNPay cho số tiền: ${amount}`);
    return new Promise((resolve) => {
      setTimeout(
        () => resolve({ success: true, transactionId: "VNP" + Date.now() }),
        2000,
      );
    });
  },
};
