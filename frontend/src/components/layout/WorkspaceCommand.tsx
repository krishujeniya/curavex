"use client";

import * as React from "react";
import {
  IconActivityHeartbeat,
  IconChartBar,
  IconCpu,
  IconExternalLink,
  IconKey,
  IconPalette,
  IconTable,
} from "@tabler/icons-react";
import { Command, type CommandGroup } from "@/components/wensity/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/wensity/dialog";
import { CLINICAL_PRESETS, type ClinicalCasePreset } from "@/lib/clinical-validation";
import { persistTheme, readCurrentTheme } from "@/lib/theme";

export type WorkspaceTabId =
  | "predict"
  | "batch"
  | "mlops"
  | "monitoring"
  | "apikeys";

interface WorkspaceCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docsUrl: string;
  onSelectTab: (tab: WorkspaceTabId) => void;
  onLoadPreset: (preset: ClinicalCasePreset) => void;
}

export function WorkspaceCommand({
  open,
  onOpenChange,
  docsUrl,
  onSelectTab,
  onLoadPreset,
}: WorkspaceCommandProps) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const groups: CommandGroup[] = React.useMemo(
    () => [
      {
        heading: "Workspace views",
        items: [
          {
            id: "tab-predict",
            label: "Single patient",
            description: "Score a single patient regimen with 95% confidence interval",
            icon: <IconActivityHeartbeat size={16} />,
            shortcut: ["1"],
            onSelect: () => {
              onSelectTab("predict");
              onOpenChange(false);
            },
          },
          {
            id: "tab-batch",
            label: "Batch cohort",
            description: "Upload CSV cohorts or score the 10-subject sample file",
            icon: <IconTable size={16} />,
            shortcut: ["2"],
            onSelect: () => {
              onSelectTab("batch");
              onOpenChange(false);
            },
          },
          {
            id: "tab-mlops",
            label: "Model registry",
            description: "Compare candidate models, run benchmarks, or promote",
            icon: <IconCpu size={16} />,
            shortcut: ["3"],
            onSelect: () => {
              onSelectTab("mlops");
              onOpenChange(false);
            },
          },
          {
            id: "tab-monitoring",
            label: "Monitoring",
            description: "Inspect KS-test p-values, PSI shifts, and latency percentiles",
            icon: <IconChartBar size={16} />,
            shortcut: ["4"],
            onSelect: () => {
              onSelectTab("monitoring");
              onOpenChange(false);
            },
          },
          {
            id: "tab-apikeys",
            label: "API keys",
            description: "Provision X-API-Key credentials and copy code examples",
            icon: <IconKey size={16} />,
            shortcut: ["5"],
            onSelect: () => {
              onSelectTab("apikeys");
              onOpenChange(false);
            },
          },
        ],
      },
      {
        heading: "Clinical case presets",
        items: CLINICAL_PRESETS.map((preset) => ({
          id: `preset-${preset.id}`,
          label: preset.label,
          description: preset.summary,
          keywords: [preset.input.Condition, preset.input.Drug_Name, "preset"],
          onSelect: () => {
            onLoadPreset(preset);
            onOpenChange(false);
          },
        })),
      },
      {
        heading: "System & references",
        items: [
          {
            id: "toggle-theme",
            label: "Toggle light / dark theme",
            description: "Switch monochrome editorial polarity",
            icon: <IconPalette size={16} />,
            onSelect: () => {
              const next = readCurrentTheme() === "dark" ? "light" : "dark";
              persistTheme(next);
              onOpenChange(false);
            },
          },
          {
            id: "open-docs",
            label: "Open FastAPI Swagger docs",
            description: docsUrl,
            icon: <IconExternalLink size={16} />,
            onSelect: () => {
              window.open(docsUrl, "_blank", "noopener,noreferrer");
              onOpenChange(false);
            },
          },
        ],
      },
    ],
    [docsUrl, onLoadPreset, onOpenChange, onSelectTab],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden">
        <DialogTitle className="sr-only">Curavex workspace command palette</DialogTitle>
        <Command
          groups={groups}
          placeholder="Jump to workspace view, compound preset, or action…"
          emptyMessage="No matching workspace command."
          autoFocus
        />
      </DialogContent>
    </Dialog>
  );
}
