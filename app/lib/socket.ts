import { io as clientIO, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const initSocket = (userId: string): Socket => {
  return clientIO(SOCKET_URL, {
    query: { userId },
    transports: ["websocket"],
  });
};
