import { LogoAnatomy } from "@/components/sections/LogoAnatomy";

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
            <LogoAnatomy />
          </div>
        </div>
      </div>
    </section>
  );
}
