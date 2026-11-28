import {
  IconHeartbeat,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";

const AUDIENCES = [
  {
    title: "Clinical teams",
    body: "Calibrated scores with confidence intervals and per-feature attribution — decision support you can defend at the point of care.",
    icon: IconHeartbeat,
  },
  {
    title: "MLOps engineers",
    body: "A versioned model registry, KS/PSI drift detection, and an append-only inference audit trail — governance without a second system.",
    icon: IconShieldCheck,
  },
  {
    title: "Platform & security",
    body: "Tiered X-API-Key rate limits, monthly quotas, edge-enforced CORS and security headers, and per-key usage visibility.",
    icon: IconLock,
  },
];

export function PlatformSection() {
  return (
    <section
      id="platform"
      className="border-t border-[var(--cv-border)] bg-[var(--cv-canvas)] scroll-mt-20"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
          {AUDIENCES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="border-t border-[var(--cv-border)] pt-6 space-y-4">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--cv-accent)] text-[var(--cv-on-accent)]">
                  <Icon size={20} stroke={1.8} aria-hidden="true" />
                </span>
                <h3 className="text-heading text-[var(--cv-text-primary)]">
                  {item.title}
                </h3>
                <p className="text-body text-[var(--cv-text-secondary)]">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
