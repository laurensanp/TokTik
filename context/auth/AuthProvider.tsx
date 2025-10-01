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

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextValue {
  user?: any;
  logout: any;
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
}

export const ApiInstance = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
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
  const { data: user, isSuccess: loginSuccess } = useGetAuthUser();
  const { mutateAsync, isSuccess: logoutSuccess } = useLogout();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user?.data);
  }, [user]);

  const value = {
    user: user?.data,
    isAuthenticated,
    logout: mutateAsync,
    setIsAuthenticated,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
