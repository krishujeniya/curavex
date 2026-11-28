import { PricingSection } from "@/components/sections/PricingSection";

export default function PricingPage() {
  return (
    <>
      <div className="border-b border-[var(--cv-border)] bg-[var(--cv-canvas)]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-20 sm:pb-14">
          <p className="text-caption font-medium uppercase tracking-[0.18em] text-[var(--cv-text-secondary)]">
            Pricing
          </p>
          <h1 className="text-title text-[var(--cv-text-primary)] mt-4">
            Simple pricing for clinical teams
          </h1>
        </div>
      </div>
      <PricingSection />
    </>
  );
}
