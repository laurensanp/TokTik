"use client";

import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import useGetAuthUser from "@/hooks/auth/useGetAuthUser";
import useLogout from "@/hooks/auth/useLogout";
import useGetAuthStatus from "@/hooks/auth/useGetAuthStatus";
import {getToken} from "@/lib/authToken";

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextValue {
  user?: any;
  logout: any;
  isAuthenticated: boolean;
}

export const ApiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
});

const AuthContext = createContext<AuthContextValue | null>(null);
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const { data: authStatus } = useGetAuthStatus();
  const { data: user } = useGetAuthUser(authStatus?.authenticated);
  const { mutateAsync } = useLogout();
  console.log({ authStatus });

  const value = {
    user: user,
    isAuthenticated: authStatus?.authenticated,
    logout: mutateAsync,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
