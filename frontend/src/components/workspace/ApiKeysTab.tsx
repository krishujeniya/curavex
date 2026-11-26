"use client";

import * as React from "react";
import { IconKey } from "@tabler/icons-react";
import { Alert } from "@/components/wensity/alert";
import { Button } from "@/components/wensity/button";
import { CopyButton } from "@/components/wensity/copy-button";
import { EmptyState } from "@/components/wensity/empty-state";
import { Field, FieldControl } from "@/components/wensity/field";
import { NativeSelect } from "@/components/wensity/native-select";
import { Separator } from "@/components/wensity/separator";
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

export function ApiKeysTab({
  apiKeys,
  onKeysUpdated,
}: {
  apiKeys: ApiKeyRecord[];
  onKeysUpdated: () => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [tier, setTier] = React.useState("standard");
  const [isGenerating, setIsGenerating] = React.useState(false);
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
      setFeedback({
        variant: "success",
        title: "API key created",
        description: "The new key is active and ready for X-API-Key requests.",
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Key creation failed",
        description:
          err instanceof Error
            ? err.message
            : "Could not create API key. Try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 min-w-0 space-y-6">
        <section className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-title text-[var(--cv-text-primary)]">
              Manage developer API keys
            </h1>
            <p className="text-body text-[var(--cv-text-secondary)]">
              Send keys in the{" "}
              <code className="rounded bg-[var(--cv-surface-raised)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--cv-text-primary)]">
                X-API-Key
              </code>{" "}
              header to query the clinical scoring API.
            </p>
          </div>

          <Separator />

          {apiKeys.length > 0 ? (
            <div className="space-y-3">
              {apiKeys.map((record) => (
                <div
                  key={record.api_key}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md border border-[var(--cv-border)] bg-[var(--cv-surface-raised)] p-4"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-label font-mono text-[var(--cv-text-primary)]">
                        {record.name}
                      </span>
                      <span className="rounded border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2 py-0.5 text-caption font-mono text-[var(--cv-text-secondary)]">
                        {record.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="truncate font-mono text-caption text-[var(--cv-text-secondary)] slashed-zero">
                        {record.api_key}
                      </code>
                      <CopyButton
                        value={record.api_key}
                        variant="icon"
                        aria-label={`Copy API key for ${record.name}`}
                      />
                    </div>
                  </div>

                  <div className="text-start sm:text-end font-mono text-caption tabular-nums text-[var(--cv-text-secondary)] shrink-0">
                    <div>
                      Limit:{" "}
                      <span className="text-[var(--cv-text-primary)]">
                        {record.requests_per_minute} rpm
                      </span>
                    </div>
                    <div>
                      Monthly:{" "}
                      <span className="text-[var(--cv-text-primary)]">
                        {record.monthly_limit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={
                <IconKey
                  size={28}
                  stroke={1.6}
                  className="text-[var(--cv-text-secondary)]"
                />
              }
              title="No API keys listed"
              description="Provision a new key below to integrate external clinical tools."
              className="py-6"
            />
          )}
        </section>

        <section className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-4">
          <h2 className="text-heading text-[var(--cv-text-primary)]">
            Create a new API key
          </h2>

          {feedback && (
            <Alert
              variant={feedback.variant}
              title={feedback.title}
              description={feedback.description}
              onDismiss={() => setFeedback(null)}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Key name or team" required>
              <FieldControl asChild>
                <input
                  id="new-key-name"
                  type="text"
                  placeholder="Oncology clinical site 4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full min-h-[42px] rounded-md border border-[var(--cv-border)] bg-[#08090b] px-3 py-2 text-base sm:text-sm text-[var(--cv-text-primary)] placeholder:text-[var(--cv-text-disabled)] focus:border-[var(--cv-text-primary)] focus:outline-none"
                />
              </FieldControl>
            </Field>

            <NativeSelect
              id="new-key-tier"
              label="Service tier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              options={[
                {
                  value: "standard",
                  label: "Standard (300 req/min, 100k/mo)",
                },
                {
                  value: "enterprise",
                  label: "Enterprise (1,200 req/min, 1M/mo)",
                },
                { value: "free", label: "Free sandbox (60 req/min, 10k/mo)" },
              ]}
            />

            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={isGenerating}
              className="w-full min-h-[44px]"
            >
              {isGenerating ? "Creating key…" : "Create API key"}
            </Button>
          </form>
        </section>
      </div>

      <aside className="lg:col-span-5 min-w-0 rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-6">
        <h2 className="text-heading text-[var(--cv-text-primary)]">
          Programmatic integration
        </h2>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-label font-mono text-[var(--cv-text-primary)]">
              cURL
            </span>
            <CopyButton
              value={CURL_SNIPPET}
              variant="label"
              aria-label="Copy cURL example"
            />
          </div>
          <pre className="overflow-x-auto rounded-md border border-[var(--cv-border)] bg-[#08090b] p-4 font-mono text-caption leading-[1.6] text-[var(--cv-text-secondary)]">
            <code>{CURL_SNIPPET}</code>
          </pre>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-label font-mono text-[var(--cv-text-primary)]">
              Python requests
            </span>
            <CopyButton
              value={PYTHON_SNIPPET}
              variant="label"
              aria-label="Copy Python example"
            />
          </div>
          <pre className="overflow-x-auto rounded-md border border-[var(--cv-border)] bg-[#08090b] p-4 font-mono text-caption leading-[1.6] text-[var(--cv-text-secondary)]">
            <code>{PYTHON_SNIPPET}</code>
          </pre>
        </div>
      </aside>
    </div>
  );
}
