"use client";

import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";
import { SignUpButton, Show } from "@clerk/react";
import { isClerkConfigured } from "@/components/auth/ClerkAuthWrapper";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { Badge } from "@/components/wensity/badge";
import { Button } from "@/components/wensity/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/wensity/card";
import { Progress } from "@/components/wensity/progress";
import { Separator } from "@/components/wensity/separator";

const FREE_FEATURES = [
  "5 scoring requests per calendar month",
  "Single-patient and batch CSV cohort scoring",
  "Calibrated 95% confidence intervals",
  "Local feature attribution breakdown",
  "KS-test and PSI drift monitoring",
];

const ENTERPRISE_FEATURES = [
  "Custom monthly request volume and rate limits",
  "Dedicated model training on private cohorts",
  "SSO/SAML and role-based access control",
  "Private Cloudflare Worker or VPC deployment",
  "SLA with direct engineering support",
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-body text-[var(--cv-text-secondary)]">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <IconCheck
            size={16}
            stroke={2}
            className="mt-1 shrink-0 text-[var(--cv-text-primary)]"
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingSection() {
  const { billingStatus } = useCuravex();
  const clerkReady = isClerkConfigured();

  return (
    <section
      id="pricing"
      className="border-t border-[var(--cv-border)] bg-[var(--cv-canvas)] py-16 sm:py-24 lg:py-28 scroll-mt-20"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Free plan ── */}
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-heading">Free plan</CardTitle>
                <Badge variant="neutral" size="sm">
                  {billingStatus?.plan === "free" ? "Current plan" : "Starter"}
                </Badge>
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-display text-[var(--cv-text-primary)]">
                  $0
                </span>
                <span className="text-body text-[var(--cv-text-secondary)]">
                  / month
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {billingStatus && billingStatus.limit !== null && (
                <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 space-y-2">
                  <div className="flex items-center justify-between text-caption">
                    <span className="text-[var(--cv-text-secondary)]">
                      Monthly usage ({billingStatus.period_ym})
                    </span>
                    <span className="font-mono tabular-nums text-[var(--cv-text-primary)]">
                      {billingStatus.used} / {billingStatus.limit}
                    </span>
                  </div>
                  <Progress
                    value={billingStatus.used}
                    max={billingStatus.limit}
                    size="sm"
                    tone={billingStatus.remaining === 0 ? "warning" : "neutral"}
                    label="Monthly free requests used"
                  />
                </div>
              )}

              <Separator />

              <FeatureList items={FREE_FEATURES} />

              {clerkReady ? (
                <>
                  <Show when="signed-out">
                    <SignUpButton mode="modal">
                      <Button variant="outline" size="lg" className="w-full min-h-[44px]">
                        Sign up free
                      </Button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <Button variant="outline" size="lg" asChild className="w-full min-h-[44px]">
                      <Link href="/scoring">Start scoring</Link>
                    </Button>
                  </Show>
                </>
              ) : (
                <Button variant="outline" size="lg" asChild className="w-full min-h-[44px]">
                  <Link href="/scoring">Start scoring</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ── Enterprise plan ── */}
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-heading">Enterprise plan</CardTitle>
                <Badge variant="outline" size="sm">
                  Custom
                </Badge>
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-display text-[var(--cv-text-primary)]">
                  Custom
                </span>
                <span className="text-body text-[var(--cv-text-secondary)]">
                  / month
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Separator />

              <FeatureList items={ENTERPRISE_FEATURES} />

              <Button variant="default" size="lg" asChild className="w-full min-h-[44px]">
                <a href="mailto:enterprise@curavex.com?subject=Enterprise%20inquiry">
                  Contact sales
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
