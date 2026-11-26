"use client";

import * as React from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js";
import type { FeatureAttribution } from "@/lib/api";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

interface ChartThemeTokens {
  primary: string;
  secondary: string;
  muted: string;
  surface: string;
  border: string;
  grid: string;
  danger: string;
  success: string;
}

function readChartTokens(): ChartThemeTokens {
  if (typeof window === "undefined") {
    return {
      primary: "#f4f4f5",
      secondary: "#a8a8a8",
      muted: "#52525b",
      surface: "#101010",
      border: "#242424",
      grid: "rgba(255, 255, 255, 0.08)",
      danger: "#e11d2e",
      success: "#34d399",
    };
  }
  const styles = getComputedStyle(document.documentElement);
  const isDark =
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark";

  return {
    primary: styles.getPropertyValue("--cv-text-primary").trim() || (isDark ? "#f4f4f5" : "#050505"),
    secondary: styles.getPropertyValue("--cv-text-secondary").trim() || (isDark ? "#a8a8a8" : "#525252"),
    muted: isDark ? "#52525b" : "#a3a3a3",
    surface: styles.getPropertyValue("--cv-surface").trim() || (isDark ? "#101010" : "#ffffff"),
    border: styles.getPropertyValue("--cv-border-strong").trim() || (isDark ? "#4d4d4d" : "#a3a3a3"),
    grid: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(5, 5, 5, 0.08)",
    danger: styles.getPropertyValue("--primitive-destructive").trim() || (isDark ? "#e11d2e" : "#dc2626"),
    success: styles.getPropertyValue("--primitive-success").trim() || (isDark ? "#34d399" : "#047857"),
  };
}

function useThemeTick(): number {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setTick((t) => t + 1);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return tick;
}

export function FeatureAttributionChart({
  items,
}: {
  items: FeatureAttribution[];
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const themeTick = useThemeTick();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const tokens = readChartTokens();
    const labels = items.map((item) => item.feature);
    const values = items.map((item) =>
      Math.abs(item.impact ?? item.importance ?? 0),
    );
    const rawImpacts = items.map((item) => item.impact ?? item.importance ?? 0);

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Attribution magnitude",
            data: values,
            backgroundColor: rawImpacts.map((val) =>
              val >= 0 ? tokens.primary : tokens.muted,
            ),
            borderRadius: 4,
            maxBarThickness: 20,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tokens.surface,
            titleColor: tokens.primary,
            bodyColor: tokens.secondary,
            borderColor: tokens.border,
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const raw = rawImpacts[context.dataIndex] ?? 0;
                const sign = raw >= 0 ? "+" : "";
                return `Impact: ${sign}${raw.toFixed(3)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: tokens.grid },
            ticks: { color: tokens.secondary, font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: tokens.primary, font: { size: 11 } },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [items, themeTick]);

  return (
    <div className="h-44 w-full">
      <canvas ref={canvasRef} aria-label="Feature impact attribution chart" />
    </div>
  );
}

export function LatencyPercentilesChart({
  latency,
}: {
  latency: { avg: number; p50: number; p95: number; p99: number };
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const themeTick = useThemeTick();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const tokens = readChartTokens();

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Avg", "p50", "p95", "p99"],
        datasets: [
          {
            label: "Latency (ms)",
            data: [
              latency.avg || 0,
              latency.p50 || 0,
              latency.p95 || 0,
              latency.p99 || 0,
            ],
            backgroundColor: [
              tokens.muted,
              tokens.secondary,
              tokens.secondary,
              tokens.primary,
            ],
            borderRadius: 4,
            maxBarThickness: 36,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tokens.surface,
            titleColor: tokens.primary,
            bodyColor: tokens.secondary,
            borderColor: tokens.border,
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tokens.secondary },
          },
          y: {
            grid: { color: tokens.grid },
            ticks: { color: tokens.secondary },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [latency, themeTick]);

  return (
    <div className="h-48 w-full">
      <canvas ref={canvasRef} aria-label="Latency percentiles chart" />
    </div>
  );
}

export function DriftMetricsChart({
  numericMetrics,
}: {
  numericMetrics: Record<string, { p_value: number }>;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const themeTick = useThemeTick();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const tokens = readChartTokens();
    const labels = Object.keys(numericMetrics);
    const pValues = labels.map((key) => numericMetrics[key].p_value);
    const backgroundColors = pValues.map((value) =>
      value < 0.05 ? tokens.danger : tokens.primary,
    );

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "KS-test p-value (threshold 0.05)",
            data: pValues,
            backgroundColor: backgroundColors,
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tokens.surface,
            titleColor: tokens.primary,
            bodyColor: tokens.secondary,
            borderColor: tokens.border,
            borderWidth: 1,
            callbacks: {
              afterLabel: (context) =>
                Number(context.raw) < 0.05
                  ? "Drift detected (p < 0.05)"
                  : "Within reference distribution",
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tokens.secondary } },
          y: {
            min: 0,
            max: 1.0,
            grid: { color: tokens.grid },
            ticks: { color: tokens.secondary },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [numericMetrics, themeTick]);

  return (
    <div className="h-48 w-full">
      <canvas ref={canvasRef} aria-label="Kolmogorov-Smirnov drift chart" />
    </div>
  );
}
