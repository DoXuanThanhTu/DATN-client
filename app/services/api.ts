import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/useAuthStore";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_MODE === "development"
      ? process.env.NEXT_PUBLIC_SERVER_URL_DEVELOPMENT
      : process.env.NEXT_PUBLIC_SERVER_URL_PRODUCTION,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("Token hết hạn hoặc không hợp lệ. Đang đăng xuất...");

      useAuthStore.getState().logout();

      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    }

    if (status === 403) {
      alert("Bạn không có quyền thực hiện hành động này!");
    }

    return Promise.reject(error);
  },
);

export default api;
