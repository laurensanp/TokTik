"use client";

import { ApiInstance, useAuth } from "@/context/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";

const AuthPage = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const query = useQuery({
    queryKey: ["TEST"],
    queryFn: async () => {
      return await ApiInstance.get("/test");
    },
    enabled: isAuthenticated,
  });


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
          <a
            className="rounded-lg bg-[#7289da] p-4 cursor-pointer"
            href="http://localhost:8080/oauth2/authorization/discord"
          >
            Mit Discord anmelden
          </a>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
