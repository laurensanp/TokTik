"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import {AuthProvider} from "@/context/auth/AuthProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
      <QueryClientProvider client={client}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
  )
}
