import { io as clientIO, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_SERVER_URL_PRODUCTION
    : process.env.NEXT_PUBLIC_SERVER_URL_DEVELOPMENT;

export const initSocket = (userId: string): Socket => {
  return clientIO(SOCKET_URL, {
    query: { userId },
    transports: ["websocket"],
  });
};
