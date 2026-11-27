"use client";

import * as React from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/components/auth/AuthProvider";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function isClerkConfigured(): boolean {
  return Boolean(PUBLISHABLE_KEY && PUBLISHABLE_KEY.startsWith("pk_"));
}

export function ClerkAuthWrapper({ children }: { children: React.ReactNode }) {
  if (!PUBLISHABLE_KEY || !PUBLISHABLE_KEY.startsWith("pk_")) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "#050505",
          borderRadius: "0.75rem",
        },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </ClerkProvider>
  );
}
