export function HeroSection() {
  return (
    <section className="border-b border-[var(--cv-border)] bg-[var(--cv-canvas)]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 min-w-0">
            <h1 className="text-display text-[var(--cv-text-primary)] max-w-[16ch]">
              Score every patient. Govern every model.
            </h1>

            <p className="text-body text-[var(--cv-text-secondary)] max-w-[56ch] mt-6">
              Curavex predicts clinical treatment response from regimen
              parameters, scores multi-subject cohorts, and monitors
              statistical drift across every prediction in production.
            </p>
          </div>

          <div className="lg:col-span-5 min-w-0">
            <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] shadow-[0_12px_32px_rgba(20,20,23,0.06)] overflow-hidden">
              <div className="relative aspect-square w-full overflow-hidden bg-[var(--cv-canvas)]">
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-0 size-full"
                  aria-hidden="true"
                >
                  {[60, 110, 160, 210].map((r) => (
                    <circle
                      key={r}
                      cx="200"
                      cy="200"
                      r={r}
                      fill="none"
                      stroke="var(--cv-border)"
                      strokeWidth="1"
                    />
                  ))}
                  <line x1="200" y1="0" x2="200" y2="400" stroke="var(--cv-border)" strokeWidth="1" />
                  <line x1="0" y1="200" x2="400" y2="200" stroke="var(--cv-border)" strokeWidth="1" />
                  <g
                    style={{
                      transformOrigin: "200px 200px",
                      animation: "cv-radar-sweep 4s linear infinite",
                    }}
                  >
                    <path
                      d="M200 200 L200 20 A180 180 0 0 1 320 95 Z"
                      fill="var(--cv-accent)"
                      opacity="0.08"
                    />
                    <line
                      x1="200"
                      y1="200"
                      x2="200"
                      y2="20"
                      stroke="var(--cv-accent)"
                      strokeWidth="1.5"
                      opacity="0.5"
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
