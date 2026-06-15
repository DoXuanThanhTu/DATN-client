export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  address?: {
    provinceName: string;
    provinceCode: string;
    wardName: string;
    wardCode: string;
    detail: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string | null) => void;
  updateUser: (data: Partial<User>) => void;
}

export interface JwtPayload {
  id: string;
  exp: number;
}
