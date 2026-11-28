"use client";

import * as React from "react";
import { IconEye, IconEyeOff, IconKey, IconTrash } from "@tabler/icons-react";
import { Alert } from "@/components/wensity/alert";
import { Button } from "@/components/wensity/button";
import { Card, CardContent } from "@/components/wensity/card";
import { CopyButton } from "@/components/wensity/copy-button";
import { EmptyState } from "@/components/wensity/empty-state";
import { Input } from "@/components/wensity/input";
import { Separator } from "@/components/wensity/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/wensity/tabs";
import { useToastManager } from "@/components/wensity/toast";
import { curavexApi, type ApiKeyRecord } from "@/lib/api";

const CURL_SNIPPET = `curl -X POST https://api.curavex.workers.dev/api/v1/predict \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: <YOUR_CURAVEX_API_KEY>" \\
  -d '{
    "Age": 52,
    "Gender": "Male",
    "Condition": "Hypertension",
    "Drug_Name": "Amlodipine",
    "Dosage_mg": 250.0,
    "Treatment_Duration_days": 30
  }'`;

const PYTHON_SNIPPET = `import requests

res = requests.post(
    "https://api.curavex.workers.dev/api/v1/predict",
    headers={"X-API-Key": "<YOUR_CURAVEX_API_KEY>"},
    json={
        "Age": 52,
        "Gender": "Male",
        "Condition": "Hypertension",
        "Drug_Name": "Amlodipine",
        "Dosage_mg": 250.0,
        "Treatment_Duration_days": 30,
    },
    timeout=10,
)
print(res.json()["predicted_score"])`;

const TYPESCRIPT_SNIPPET = `const response = await fetch("https://api.curavex.workers.dev/api/v1/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "<YOUR_CURAVEX_API_KEY>",
  },
  body: JSON.stringify({
    Age: 52,
    Gender: "Male",
    Condition: "Hypertension",
    Drug_Name: "Amlodipine",
    Dosage_mg: 250,
    Treatment_Duration_days: 30,
  }),
});
const data = await response.json();`;

function maskKey(key: string): string {
  if (key.length <= 10) return "••••••••";
  return `${key.slice(0, 6)}••••••${key.slice(-4)}`;
}

export function ApiKeysTab({
  apiKeys,
  onKeysUpdated,
}: {
  apiKeys: ApiKeyRecord[];
  onKeysUpdated: () => Promise<void>;
}) {
  const toast = useToastManager();
  const [name, setName] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [newKey, setNewKey] = React.useState<ApiKeyRecord | null>(null);
  const [newKeyVisible, setNewKeyVisible] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || isGenerating) return;
    setIsGenerating(true);
    setFeedback(null);

    try {
      const record = await curavexApi.generateApiKey(name.trim(), "standard");
      setName("");
      setNewKey(record);
      setNewKeyVisible(true);
      await onKeysUpdated();
      const msg = "The new key is active and ready for X-API-Key requests.";
      setFeedback({
        variant: "success",
        title: "API key created",
        description: msg,
      });
      toast.add({
        title: "API key created",
        description: msg,
        data: { variant: "success" },
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not create API key. Try again.";
      setFeedback({
        variant: "error",
        title: "Key creation failed",
        description: msg,
      });
      toast.add({
        title: "Key creation failed",
        description: msg,
        data: { variant: "error" },
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (isDeleting) return;
    setIsDeleting(id);
    setFeedback(null);
    try {
      await curavexApi.deleteApiKey(id);
      await onKeysUpdated();
      toast.add({
        title: "API key deleted",
        description: "The key can no longer be used for API requests.",
        data: { variant: "success" },
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not delete API key.";
      setFeedback({
        variant: "error",
        title: "Delete failed",
        description: msg,
      });
    } finally {
      setIsDeleting(null);
    }
  }

  const keyLimitReached = apiKeys.length >= 3;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <Card className="lg:col-span-7 min-w-0">
        <CardContent className="space-y-6 pt-6">
          {feedback && (
            <Alert
              variant={feedback.variant}
              title={feedback.title}
              description={feedback.description}
              onDismiss={() => setFeedback(null)}
            />
          )}

          {newKey && (
            <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label font-medium text-[var(--cv-text-primary)]">
                  {newKey.name}
                </span>
                <button
                  type="button"
                  onClick={() => setNewKey(null)}
                  className="text-caption text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <code className="truncate font-mono text-caption text-[var(--cv-text-secondary)] slashed-zero">
                  {newKeyVisible ? newKey.api_key : maskKey(newKey.api_key)}
                </code>
                <button
                  type="button"
                  aria-label={
                    newKeyVisible ? "Hide new API key" : "Reveal new API key"
                  }
                  onClick={() => setNewKeyVisible((v) => !v)}
                  className="inline-flex size-11 items-center justify-center rounded-md text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] cursor-pointer"
                >
                  {newKeyVisible ? (
                    <IconEyeOff size={15} />
                  ) : (
                    <IconEye size={15} />
                  )}
                </button>
                <CopyButton
                  value={newKey.api_key}
                  variant="icon"
                  aria-label="Copy new API key"
                />
              </div>
              <p className="text-caption text-[var(--cv-text-secondary)]">
                This is the only time the full key is shown — copy it now.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <Input
                  id="new-key-name"
                  type="text"
                  label="New key name"
                  placeholder="Oncology clinical site 4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={keyLimitReached}
                />
              </div>
              <div className="sm:col-span-4">
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  loading={isGenerating}
                  disabled={keyLimitReached}
                  className="w-full min-h-[44px]"
                >
                  {isGenerating ? "Creating…" : "Create key"}
                </Button>
              </div>
            </div>
            {keyLimitReached && (
              <p className="text-caption text-[var(--cv-text-secondary)]">
                Maximum of 3 API keys per user — delete one to create another.
              </p>
            )}
          </form>

          <Separator />

          {apiKeys.length > 0 ? (
            <div className="divide-y divide-[var(--cv-border)] rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)]">
              {apiKeys.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="min-w-0 space-y-1">
                    <span className="text-label font-medium text-[var(--cv-text-primary)]">
                      {record.name}
                    </span>
                    <code className="block truncate font-mono text-caption text-[var(--cv-text-secondary)] slashed-zero">
                      {record.api_key}
                    </code>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete API key ${record.name}`}
                    disabled={isDeleting === record.id}
                    onClick={() => void handleDelete(record.id)}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] cursor-pointer disabled:opacity-50"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={
                <IconKey
                  size={24}
                  stroke={1.6}
                  className="text-[var(--cv-text-secondary)]"
                />
              }
              title="No API keys yet"
              description="Create a key above to authenticate API requests."
              className="py-6"
            />
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-5 min-w-0">
        <CardContent className="pt-6">
          <Tabs variant="segmented" defaultValue="curl">
            <TabsList className="mb-4">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="ts">TypeScript</TabsTrigger>
            </TabsList>

            <TabsContent value="curl" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
                  Shell
                </span>
                <CopyButton
                  value={CURL_SNIPPET}
                  variant="label"
                  aria-label="Copy cURL example"
                />
              </div>
              <pre className="overflow-x-auto rounded-xl border border-[#2e2e2e] bg-[#0a0a0a] p-4 font-mono text-caption leading-[1.6] text-[#f0f0f0]">
                <code>{CURL_SNIPPET}</code>
              </pre>
            </TabsContent>

            <TabsContent value="python" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
                  Python
                </span>
                <CopyButton
                  value={PYTHON_SNIPPET}
                  variant="label"
                  aria-label="Copy Python example"
                />
              </div>
              <pre className="overflow-x-auto rounded-xl border border-[#2e2e2e] bg-[#0a0a0a] p-4 font-mono text-caption leading-[1.6] text-[#f0f0f0]">
                <code>{PYTHON_SNIPPET}</code>
              </pre>
            </TabsContent>

            <TabsContent value="ts" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
                  TypeScript
                </span>
                <CopyButton
                  value={TYPESCRIPT_SNIPPET}
                  variant="label"
                  aria-label="Copy TypeScript example"
                />
              </div>
              <pre className="overflow-x-auto rounded-xl border border-[#2e2e2e] bg-[#0a0a0a] p-4 font-mono text-caption leading-[1.6] text-[#f0f0f0]">
                <code>{TYPESCRIPT_SNIPPET}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
