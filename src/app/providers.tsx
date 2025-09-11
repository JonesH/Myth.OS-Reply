"use client";
import { ReactNode } from "react";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </AuthProvider>
  );
}
