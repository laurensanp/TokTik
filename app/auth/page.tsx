"use client";

import { ApiInstance, useAuth } from "@/context/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";

const AuthPage = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
      window.location.href = "http://localhost:8080/oauth2/authorization/discord";
  }

  return (
    <div className="p-24">
      {isAuthenticated ? (
        <div className="flex flex-col space-y-12">
          <div>Angemeldet als {user?.user?.username}</div>
          <a
            className="rounded-lg bg-red-900 p-4 cursor-pointer w-fit"
            onClick={handleLogout}
          >
            Logout
          </a>
        </div>
      ) : (
        <div>
          <div
              onClick={handleLogin}
            className="rounded-lg bg-[#7289da] p-4 cursor-pointer">
            Mit Discord anmelden
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
