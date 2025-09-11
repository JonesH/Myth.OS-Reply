"use client";
import { ReactNode } from "react";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SubscriptionProvider>
      {children}
    </SubscriptionProvider>
  );
}
