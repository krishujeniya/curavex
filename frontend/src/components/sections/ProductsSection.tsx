"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";

type Category = "scoring" | "mlops" | "platform";

const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All products" },
  { id: "scoring", label: "Scoring" },
  { id: "mlops", label: "MLOps" },
  { id: "platform", label: "Platform" },
];

function DemoFrame({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [playing, setPlaying] = React.useState(true);
  return (
    <div
      className={`demo-stage relative overflow-hidden rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] ${playing ? "" : "demo-paused"} ${className}`}
    >
      {children}
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? `Pause ${label} demo` : `Play ${label} demo`}
        title={playing ? "Pause demo" : "Play demo"}
        className="absolute bottom-2.5 right-2.5 inline-flex size-8 items-center justify-center rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-secondary)] shadow-sm transition-colors hover:text-[var(--cv-text-primary)] cursor-pointer"
      >
        {playing ? (
          <IconPlayerPause size={14} aria-hidden="true" />
        ) : (
          <IconPlayerPlay size={14} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function PredictDemo() {
  return (
    <div className="flex h-full flex-col justify-between gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-caption text-[var(--cv-text-secondary)]">
          /api/v1/predict
        </span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          live
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline gap-2 tabular-nums">
          <span className="text-title text-[var(--cv-text-primary)]">7.20</span>
          <span className="text-caption text-[var(--cv-text-secondary)]">/ 10.0</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--cv-border)]">
          <div
            className="h-full rounded-full bg-[var(--cv-accent)]"
            style={{ animation: "cv-demo-bar 5s ease-in-out infinite" }}
          />
        </div>
        <div className="flex justify-between font-mono text-[10px] text-[var(--cv-text-secondary)]">
          <span>CI [4.34 – 10.00]</span>
          <span>0.2 ms</span>
        </div>
      </div>
    </div>
  );
}

function BatchDemo() {
  const rows = [
    { id: "PT-014", score: "7.2" },
    { id: "PT-022", score: "5.8" },
    { id: "PT-031", score: "8.4" },
  ];
  return (
    <div className="flex h-full flex-col gap-2 p-5">
      <span className="font-mono text-caption text-[var(--cv-text-secondary)]">
        cohort.csv · 1,000 rows
      </span>
      <div className="flex-1 space-y-2">
        {rows.map((row, i) => (
          <div
            key={row.id}
            className="flex items-center justify-between rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2"
            style={{ animation: `cv-demo-row 4.5s ease-in-out ${i * 0.4}s infinite` }}
          >
            <span className="font-mono text-caption text-[var(--cv-text-primary)]">
              {row.id}
            </span>
            <span className="font-mono text-caption tabular-nums text-[var(--cv-text-secondary)]">
              {row.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegistryDemo() {
  const versions = [
    { v: "v2.0.0", state: "PRODUCTION" },
    { v: "v1.4.2", state: "STAGING" },
    { v: "v1.4.1", state: "ARCHIVED" },
  ];
  return (
    <div className="flex h-full flex-col gap-2 p-5">
      <span className="font-mono text-caption text-[var(--cv-text-secondary)]">
        model-registry
      </span>
      <div className="flex-1 space-y-2">
        {versions.map((row, i) => (
          <div
            key={row.v}
            className="flex items-center justify-between rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2"
            style={{ animation: `cv-demo-row 4.5s ease-in-out ${i * 0.35}s infinite` }}
          >
            <span className="font-mono text-caption text-[var(--cv-text-primary)]">
              gradient_boosting-{row.v}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                row.state === "PRODUCTION"
                  ? "bg-[var(--cv-accent)] text-[var(--cv-on-accent)]"
                  : "bg-[var(--cv-border)] text-[var(--cv-text-secondary)]"
              }`}
            >
              {row.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriftDemo() {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-caption text-[var(--cv-text-secondary)]">
          drift-detector · PSI
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          stable
        </span>
      </div>
      <svg viewBox="0 0 240 64" className="w-full flex-1" aria-hidden="true">
        <polyline
          points="0,48 30,44 60,46 90,36 120,38 150,28 180,30 210,20 240,16"
          fill="none"
          stroke="var(--cv-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="240"
          style={{ animation: "cv-demo-spark 4s ease-in-out infinite" }}
        />
      </svg>
      <div className="flex justify-between font-mono text-[10px] text-[var(--cv-text-secondary)]">
        <span>Dosage_mg</span>
        <span>PSI 0.11</span>
      </div>
    </div>
  );
}

function KeysDemo() {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <span className="font-mono text-caption text-[var(--cv-text-secondary)]">
        x-api-key · provisioned
      </span>
      <div className="flex items-center justify-between rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2.5">
        <code className="font-mono text-caption text-[var(--cv-text-primary)]">
          cv_live_••••••••••7f2a
        </code>
        <span className="rounded-full bg-[var(--cv-accent)] px-2 py-0.5 text-[10px] font-medium text-[var(--cv-on-accent)]">
          free tier
        </span>
      </div>
      <div className="mt-auto space-y-1.5">
        <div className="flex justify-between font-mono text-[10px] text-[var(--cv-text-secondary)]">
          <span>monthly quota</span>
          <span>4 / 5</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--cv-border)]">
          <div
            className="h-full w-4/5 rounded-full bg-[var(--cv-accent)]"
            style={{ animation: "cv-demo-bar 6s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}

interface Product {
  name: string;
  category: Exclude<Category, never>;
  categoryLabel: string;
  description: string;
  href: string;
  cta: string;
  featured?: boolean;
  demo: React.ReactNode;
  demoClassName?: string;
}

const PRODUCTS: Product[] = [
  {
    name: "Clinical scoring",
    category: "scoring",
    categoryLabel: "Scoring",
    description:
      "Point estimates with 95% confidence intervals and per-feature attribution for a single patient regimen.",
    href: "/scoring",
    cta: "Try scoring",
    featured: true,
    demo: <PredictDemo />,
    demoClassName: "min-h-[220px]",
  },
  {
    name: "Batch cohort scoring",
    category: "scoring",
    categoryLabel: "Scoring",
    description:
      "Upload a CSV cohort and score every patient row in one deterministic pass.",
    href: "/scoring",
    cta: "Score a cohort",
    demo: <BatchDemo />,
    demoClassName: "min-h-[190px]",
  },
  {
    name: "Model registry",
    category: "mlops",
    categoryLabel: "MLOps",
    description:
      "Versioned .joblib artifacts with STAGING-to-PRODUCTION promotion and benchmark history.",
    href: "/scoring?tab=models",
    cta: "Open registry",
    demo: <RegistryDemo />,
    demoClassName: "min-h-[190px]",
  },
  {
    name: "Drift & audit monitoring",
    category: "mlops",
    categoryLabel: "MLOps",
    description:
      "Hourly KS/PSI drift checks and an append-only inference audit trail.",
    href: "/monitoring",
    cta: "View monitoring",
    demo: <DriftDemo />,
    demoClassName: "min-h-[190px]",
  },
  {
    name: "API keys & quotas",
    category: "platform",
    categoryLabel: "Platform",
    description:
      "Tiered X-API-Key credentials, monthly quotas, and per-key usage visibility.",
    href: "/monitoring?tab=keys",
    cta: "Manage keys",
    demo: <KeysDemo />,
    demoClassName: "min-h-[190px]",
  },
];

export function ProductsSection() {
  const [filter, setFilter] = React.useState<Category | "all">("all");

  const featured = PRODUCTS.filter((p) => p.featured);
  const catalogue = PRODUCTS.filter(
    (p) => !p.featured && (filter === "all" || p.category === filter),
  );

  return (
    <section
      id="products"
      className="border-t border-[var(--cv-border)] bg-[var(--cv-surface)] py-20 sm:py-24 lg:py-28 scroll-mt-20"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[65ch] space-y-4">
            <p className="text-caption font-medium uppercase tracking-[0.14em] text-[var(--cv-text-secondary)]">
              Products
            </p>
            <h2 className="text-title text-[var(--cv-text-primary)]">
              Everything Curavex does, in one place
            </h2>
            <p className="text-body text-[var(--cv-text-secondary)]">
              Featured workflows first, then the full catalogue — filter by
              category to jump straight to what you need.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter products by category"
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-[36px] items-center rounded-full border px-4 text-caption font-medium transition-colors duration-200 cursor-pointer ${
                    active
                      ? "border-[var(--cv-accent)] bg-[var(--cv-accent)] text-[var(--cv-on-accent)]"
                      : "border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-secondary)] hover:border-[var(--cv-border-strong)] hover:text-[var(--cv-text-primary)]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured showcase — full prominence before the catalogue */}
        {featured.map((product) => (
          <Link
            key={product.name}
            href={product.href}
            className="group grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] shadow-[0_12px_32px_rgba(20,20,23,0.06)] transition-shadow hover:shadow-[0_16px_40px_rgba(20,20,23,0.1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cv-accent)]"
          >
            <div className="flex flex-col justify-between gap-6 p-7 sm:p-10 order-2 lg:order-1">
              <div className="space-y-4">
                <span className="inline-flex items-center rounded-full bg-[var(--cv-accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--cv-on-accent)]">
                  Featured
                </span>
                <h3 className="text-title text-[var(--cv-text-primary)]">
                  {product.name}
                </h3>
                <p className="text-body text-[var(--cv-text-secondary)] max-w-[46ch]">
                  {product.description}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-label font-medium text-[var(--cv-text-primary)]">
                {product.cta}
                <IconArrowUpRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </span>
            </div>
            <div className="order-1 lg:order-2 p-4 sm:p-6 bg-[var(--cv-canvas)]">
              <DemoFrame label={product.name} className={product.demoClassName}>
                {product.demo}
              </DemoFrame>
            </div>
          </Link>
        ))}

        {/* Catalogue — filterable grid */}
        <div
          key={filter}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {catalogue.map((product, i) => (
            <div
              key={product.name}
              className="cv-enter flex flex-col overflow-hidden rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] shadow-[0_12px_32px_rgba(20,20,23,0.06)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <DemoFrame label={product.name} className={product.demoClassName}>
                {product.demo}
              </DemoFrame>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-heading text-[var(--cv-text-primary)]">
                    {product.name}
                  </h3>
                  <span className="rounded-full border border-[var(--cv-border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--cv-text-secondary)]">
                    {product.categoryLabel}
                  </span>
                </div>
                <p className="text-body text-[var(--cv-text-secondary)] flex-1">
                  {product.description}
                </p>
                <Link
                  href={product.href}
                  className="inline-flex items-center gap-1.5 pt-1 text-label font-medium text-[var(--cv-text-primary)] hover:underline underline-offset-4"
                >
                  {product.cta}
                  <IconArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
