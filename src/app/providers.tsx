"use client";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </SessionProvider>
  );
}
