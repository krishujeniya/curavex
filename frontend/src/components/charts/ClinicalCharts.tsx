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

export function FeatureAttributionChart({
  items,
}: {
  items: FeatureAttribution[];
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<Chart | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = items.map((item) => item.feature);
    const values = items.map((item) =>
      Math.abs(item.impact ?? item.importance ?? 0),
    );

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Attribution magnitude",
            data: values,
            backgroundColor: "#f4f4f5",
            borderRadius: 3,
            maxBarThickness: 22,
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
            backgroundColor: "#0b0c0e",
            borderColor: "#3a3f4b",
            borderWidth: 1,
            bodyFont: { family: "Inter", size: 12 },
          },
        },
        scales: {
          x: {
            grid: { color: "#1a1c22" },
            ticks: { color: "#a1a1aa", font: { family: "Inter", size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: "#e4e4e7", font: { family: "Inter", size: 11 } },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [items]);

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

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

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
            backgroundColor: ["#52525b", "#71717a", "#a1a1aa", "#f4f4f5"],
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
            backgroundColor: "#0b0c0e",
            borderColor: "#3a3f4b",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#a1a1aa" },
          },
          y: {
            grid: { color: "#1a1c22" },
            ticks: { color: "#a1a1aa" },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [latency]);

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

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = Object.keys(numericMetrics);
    const pValues = labels.map((key) => numericMetrics[key].p_value);
    const backgroundColors = pValues.map((value) =>
      value < 0.05 ? "#f4f4f5" : "#52525b",
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
            borderRadius: 3,
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
            backgroundColor: "#0b0c0e",
            borderColor: "#3a3f4b",
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
          x: { grid: { display: false }, ticks: { color: "#a1a1aa" } },
          y: {
            min: 0,
            max: 1.0,
            grid: { color: "#1a1c22" },
            ticks: { color: "#a1a1aa" },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [numericMetrics]);

  return (
    <div className="h-48 w-full">
      <canvas ref={canvasRef} aria-label="Kolmogorov-Smirnov drift chart" />
    </div>
  );
}
