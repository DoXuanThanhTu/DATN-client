export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled";
export type PaymentMethod = "meetup" | "cod" | "escrow";

export interface Order {
  _id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  finalPrice: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  address?: string;
  phoneNumber?: string;
  trackingCode?: string; // Mã vận đơn giả lập
  createdAt: Date;
}

export interface OrderConfirmData {
  method: PaymentMethod;
  address?: string;
  finalPrice: number;
  productId?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
}
