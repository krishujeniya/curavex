"use client";

import * as React from "react";
import { IconEye, IconEyeOff, IconKey } from "@tabler/icons-react";
import { Alert } from "@/components/wensity/alert";
import { Badge } from "@/components/wensity/badge";
import { Button } from "@/components/wensity/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/wensity/card";
import { CopyButton } from "@/components/wensity/copy-button";
import { EmptyState } from "@/components/wensity/empty-state";
import { Input } from "@/components/wensity/input";
import { RadioGroup, RadioOption } from "@/components/wensity/radio-group";
import { Separator } from "@/components/wensity/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/wensity/tabs";
import { useToastManager } from "@/components/wensity/toast";
import { curavexApi, type ApiKeyRecord } from "@/lib/api";

const CURL_SNIPPET = `curl -X POST https://api-curavex.pages.dev/api/v1/predict \\
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
    "https://api-curavex.pages.dev/api/v1/predict",
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

const TYPESCRIPT_SNIPPET = `const response = await fetch("https://api-curavex.pages.dev/api/v1/predict", {
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
  const [tier, setTier] = React.useState("standard");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [revealedKeys, setRevealedKeys] = React.useState<Record<string, boolean>>(
    {},
  );
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
      await curavexApi.generateApiKey(name.trim(), tier);
      setName("");
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <Card className="lg:col-span-7 min-w-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-title">API keys</CardTitle>
          <CardDescription>
            Include your key in the{" "}
            <code className="rounded bg-[var(--cv-canvas)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--cv-text-primary)] border border-[var(--cv-border)]">
              X-API-Key
            </code>{" "}
            header when calling{" "}
            <code className="rounded bg-[var(--cv-canvas)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--cv-text-primary)] border border-[var(--cv-border)]">
              /api/v1/predict
            </code>
            .
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {feedback && (
            <Alert
              variant={feedback.variant}
              title={feedback.title}
              description={feedback.description}
              onDismiss={() => setFeedback(null)}
            />
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
                />
              </div>
              <div className="sm:col-span-4">
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  loading={isGenerating}
                  className="w-full min-h-[44px]"
                >
                  {isGenerating ? "Creating…" : "Create key"}
                </Button>
              </div>
            </div>

            <RadioGroup
              label="Tier"
              variant="segment"
              orientation="horizontal"
              value={tier}
              onValueChange={setTier}
            >
              <RadioOption value="free" label="Free (60 rpm)" />
              <RadioOption value="standard" label="Standard (300 rpm)" />
              <RadioOption value="enterprise" label="Enterprise (1,200 rpm)" />
            </RadioGroup>
          </form>

          <Separator />

          {apiKeys.length > 0 ? (
            <div className="divide-y divide-[var(--cv-border)] rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)]">
              {apiKeys.map((record) => {
                const isVisible = Boolean(revealedKeys[record.api_key]);
                return (
                  <div
                    key={record.api_key}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-label font-medium text-[var(--cv-text-primary)]">
                          {record.name}
                        </span>
                        <Badge variant="outline" size="sm">
                          {record.tier}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <code className="truncate font-mono text-caption text-[var(--cv-text-secondary)] slashed-zero">
                          {isVisible ? record.api_key : maskKey(record.api_key)}
                        </code>
                        <button
                          type="button"
                          aria-label={
                            isVisible
                              ? `Hide API key for ${record.name}`
                              : `Reveal API key for ${record.name}`
                          }
                          onClick={() =>
                            setRevealedKeys((prev) => ({
                              ...prev,
                              [record.api_key]: !prev[record.api_key],
                            }))
                          }
                          className="inline-flex size-11 items-center justify-center rounded-md text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] cursor-pointer"
                        >
                          {isVisible ? (
                            <IconEyeOff size={15} />
                          ) : (
                            <IconEye size={15} />
                          )}
                        </button>
                        <CopyButton
                          value={record.api_key}
                          variant="icon"
                          aria-label={`Copy API key for ${record.name}`}
                        />
                      </div>
                    </div>

                    <div className="text-start sm:text-end font-mono text-caption tabular-nums text-[var(--cv-text-secondary)] shrink-0">
                      {record.requests_per_minute} rpm
                    </div>
                  </div>
                );
              })}
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
        <CardHeader className="space-y-1">
          <CardTitle className="text-heading">Quickstart</CardTitle>
          <CardDescription>
            Send a JSON request to score a patient regimen.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
