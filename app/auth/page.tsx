"use client";

import { ApiInstance, useAuth } from "@/context/auth/AuthProvider";

const AuthPage = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleLogin = () => {
      window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth2/authorization/discord`;
  }

  console.log({user})

  return (
    <div className="p-24">
      {isAuthenticated ? (
        <div className="flex flex-col space-y-12">
          <div>Angemeldet als {user?.handle}</div>
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
