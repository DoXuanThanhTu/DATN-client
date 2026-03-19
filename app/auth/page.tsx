"use client";

import React, { useState, Suspense, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { useRedirectIfAuth } from "@/hooks/useRedirectIfAuth";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "react-toastify";
import api from "../services/api";

interface AuthErrorResponse {
  message: string;
  status?: string;
}

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const mode = searchParams.get("mode");

  useEffect(() => {
    if (mode === "register") {
      setIsLogin(false);
    } else if (mode === "login") {
      setIsLogin(true);
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/login" : "/register";

    try {
      const response = await api.post(
        `/auth${endpoint}`,
        isLogin
          ? { email: formData.email, password: formData.password }
          : formData,
      );

      if (response.data.status === "success") {
        login(response.data.data.user, response.data.token);
        toast.success("Đăng nhập thành công!");
        router.push(decodeURIComponent(callbackUrl));
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverError = err.response?.data as AuthErrorResponse;
        setError(serverError?.message || "Đã có lỗi xảy ra từ máy chủ.");
      } else {
        setError("Lỗi kết nối mạng. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4] px-4 py-12">
      <div className="max-w-112.5 w-full bg-white rounded-4xl shadow-2xl shadow-gray-200/50 overflow-hidden border border-white">
        <div
          className={`p-8 pb-6 transition-colors duration-500 ${isLogin ? "bg-orange-50" : "bg-blue-50"}`}
        >
          <div className="flex justify-between items-start mb-6">
            <div
              className={`p-3 rounded-2xl shadow-sm ${isLogin ? "bg-orange-500 text-white" : "bg-blue-600 text-white"}`}
            >
              {isLogin ? <LogIn size={28} /> : <UserPlus size={28} />}
            </div>
            <button
              onClick={() => router.push(decodeURIComponent(callbackUrl))}
              className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-400"
            >
              <ChevronLeft size={24} />
            </button>
          </div>

          <h2 className="text-3xl font-900 text-gray-800 tracking-tight">
            {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
          </h2>
          <p className="text-gray-500 mt-2 font-bold text-sm">
            {isLogin
              ? "Đăng nhập để tiếp tục mua sắm"
              : "Tham gia cộng đồng ngay hôm nay"}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 flex items-center gap-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <span className="text-xs font-black leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 tracking-widest">
                  Họ và tên
                </label>
                <div className="relative group">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-700"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 tracking-widest">
                Email đăng nhập
              </label>
              <div className="relative group">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors ${isLogin ? "group-focus-within:text-orange-500" : "group-focus-within:text-blue-500"}`}
                  size={18}
                />
                <input
                  type="email"
                  required
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none transition-all font-bold text-gray-700 ${isLogin ? "focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500" : "focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"}`}
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 tracking-widest">
                Mật khẩu
              </label>
              <div className="relative group">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors ${isLogin ? "group-focus-within:text-orange-500" : "group-focus-within:text-blue-500"}`}
                  size={18}
                />
                <input
                  type="password"
                  required
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none transition-all font-bold text-gray-700 ${isLogin ? "focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500" : "focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-4 text-white font-black rounded-2xl shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 uppercase tracking-widest text-xs ${
                isLogin
                  ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
              }`}
            >
              {loading
                ? "Vui lòng đợi..."
                : isLogin
                  ? "Đăng nhập"
                  : "Tạo tài khoản"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                const targetIsLogin = !isLogin;
                setIsLogin(targetIsLogin);
                setError("");
                router.replace(
                  `/auth?mode=${targetIsLogin ? "login" : "register"}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
                );
              }}
              className="group py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-bold text-gray-400">
                {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản rồi?"}
              </span>
              <span
                className={`ml-2 text-sm font-black transition-colors ${isLogin ? "text-orange-500 group-hover:text-orange-600" : "text-blue-600 group-hover:text-blue-700"}`}
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập tại đây"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPage = () => {
  useRedirectIfAuth();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-bold">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
};

export default AuthPage;
