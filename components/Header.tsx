"use client";

import { useAuth } from "@/context/auth/AuthProvider";
import { ClockFading } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC } from "react";

interface HeaderItem {
  name: string;
  link: string;
}

interface HeaderProps {
  logo?: string;
  disabledPaths?: string[];
}

const Header: FC<HeaderProps> = ({ logo, disabledPaths = [] }) => {
  const { user, isAuthenticated } = useAuth();
  console.log({ nigger: user });
  const path = usePathname();
  const links: HeaderItem[] = [
    {
      name: "Uploade TokTik™️ now",
      link: "/video/upload",
    },
    {
      name: "Watch TokTik™️ now",
      link: "/video",
    },
    {
      name: "User?",
      link: "/user",
    },
    {
      name: "Auth",
      link: "/auth",
    },
  ];
  return (
    !disabledPaths.includes(path) && (
      <nav className="flex bg-black px-8 py-4 items-center justify-between shadow-lg">
        {/* Logo added back */}
        <div className="flex items-center">
          {logo && (
            <Link href="/">
              <img src={logo} alt="Toktik Logo" className="h-10 w-auto mr-4" />
            </Link>
          )}
        </div>
        <div className="flex items-center gap-6">
          {links.map((item, index) => (
            <Link
              key={`${item.link}-${index}`}
              href={item.link}
              className={`text-lg font-medium px-4 py-2 rounded-md transition-colors
                ${
                  path === item.link
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
            >
              {item.name}
            </Link>
          ))}

          {isAuthenticated && (
            <div className="shrink-0">
              <Link href={`/user/${user?.id}`}>
                <img src={user?.imageUrl} className="rounded-full size-14" />
              </Link>
            </div>
          )}
        </div>
      </nav>
    )
  );
};

export default Header;
