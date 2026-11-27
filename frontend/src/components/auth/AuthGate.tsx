"use client";

import * as React from "react";
import { SignInButton, useAuth } from "@clerk/clerk-react";
import { IconLock } from "@tabler/icons-react";
import { isClerkConfigured } from "@/components/auth/ClerkAuthWrapper";
import { useLocalAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/wensity/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/wensity/card";

function ClerkAuthGateInner({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="py-12 text-center text-body text-[var(--cv-text-secondary)]">
        Checking session…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card>
          <CardHeader className="space-y-2">
            <div className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--cv-border)] bg-[var(--cv-canvas)] text-[var(--cv-text-primary)]">
              <IconLock size={18} stroke={1.8} />
            </div>
            <CardTitle className="text-heading">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SignInButton mode="modal">
              <Button variant="default" size="lg" className="w-full min-h-[44px]">
                Sign in to continue
              </Button>
            </SignInButton>
            <p className="text-caption text-[var(--cv-text-secondary)]">
              Free accounts include 5 scoring requests per month.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

function LocalAuthGateInner({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { user, loading, openAuthModal } = useLocalAuth();

  if (loading) {
    return (
      <div className="py-12 text-center text-body text-[var(--cv-text-secondary)]">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12">
        <Card>
          <CardHeader className="space-y-2">
            <div className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--cv-border)] bg-[var(--cv-canvas)] text-[var(--cv-text-primary)]">
              <IconLock size={18} stroke={1.8} />
            </div>
            <CardTitle className="text-heading">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="default"
                size="lg"
                className="flex-1 min-h-[44px]"
                onClick={() => openAuthModal("signin")}
              >
                Sign in
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 min-h-[44px]"
                onClick={() => openAuthModal("signup")}
              >
                Sign up
              </Button>
            </div>
            <p className="text-caption text-[var(--cv-text-secondary)]">
              Free accounts include 5 scoring requests per month.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthGate({
  title = "Sign in required",
  description = "Sign in with your Curavex account to access clinical scoring and API keys.",
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  if (!isClerkConfigured()) {
    return (
      <LocalAuthGateInner title={title} description={description}>
        {children}
      </LocalAuthGateInner>
    );
  }

  return (
    <ClerkAuthGateInner title={title} description={description}>
      {children}
    </ClerkAuthGateInner>
  );
}
