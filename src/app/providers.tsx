"use client";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <SubscriptionProvider>
          {children}
        </SubscriptionProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
