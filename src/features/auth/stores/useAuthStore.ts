import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import type { User, AuthState } from "../types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => {
        set({ user, token });
        Cookies.set("token", token, { expires: 7 });
      },
      logout: () => {
        set({ user: null, token: null });
        Cookies.remove("token");
        toast.success("Đăng xuất thành công!");
      },
      setToken: (token) => {
        set({ token });
      },
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
