"use client";

import * as React from "react";
import { IconKey, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/wensity/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/wensity/card";
import { EmptyState } from "@/components/wensity/empty-state";
import { Progress } from "@/components/wensity/progress";
import { curavexApi, type ApiKeyUsage } from "@/lib/api";

export function ApiKeyDashboard() {
  const [usage, setUsage] = React.useState<ApiKeyUsage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsage(await curavexApi.getApiKeyUsage());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load API key usage.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const keys = usage?.keys ?? [];
  const monthlyLimit = usage?.monthly_limit ?? 10;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <Button
          variant="outline"
          size="md"
          loading={loading}
          leftIcon={<IconRefresh size={16} />}
          onClick={() => void load()}
          className="min-h-[44px]"
        >
          Refresh usage
        </Button>
      </div>

      {error && (
        <p className="text-body text-[var(--cv-text-secondary)]">{error}</p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 space-y-1">
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Active API keys
            </div>
            <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
              {keys.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-1">
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Calls per month
            </div>
            <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
              {usage?.total_calls_month ?? 0}
              <span className="text-body text-[var(--cv-text-secondary)]">
                {" "}
                / {monthlyLimit}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-1">
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Total API calls
            </div>
            <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
              {usage?.total_calls ?? 0}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-heading">Usage by key</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length > 0 ? (
            <div className="divide-y divide-[var(--cv-border)]">
              {keys.map((key) => {
                const pct = Math.min(
                  100,
                  Math.round(((key.calls_month ?? 0) / monthlyLimit) * 100),
                );
                return (
                  <div key={key.key_id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <span className="text-label font-medium text-[var(--cv-text-primary)]">
                          {key.name}
                        </span>
                        <code className="block truncate font-mono text-caption text-[var(--cv-text-secondary)] slashed-zero">
                          {key.key_prefix}••••••{key.key_suffix}
                        </code>
                      </div>
                      <div className="font-mono text-caption tabular-nums text-[var(--cv-text-secondary)] shrink-0">
                        {key.calls_month ?? 0}/{monthlyLimit} per month
                      </div>
                    </div>
                    <Progress
                      value={key.calls_month ?? 0}
                      max={monthlyLimit}
                      size="sm"
                      tone={
                        (key.calls_month ?? 0) >= monthlyLimit
                          ? "warning"
                          : "neutral"
                      }
                      label={`Monthly usage for ${key.name}`}
                      className="mt-3"
                    />
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
              description="Create a key in the Create tab to start tracking usage."
              className="py-6"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
