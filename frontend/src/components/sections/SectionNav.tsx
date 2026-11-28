const SECTIONS = [
  { href: "#platform", label: "Platform" },
  { href: "#products", label: "Products" },
  { href: "#architecture", label: "Architecture" },
  { href: "#pricing", label: "Pricing" },
];

export function SectionNav() {
  return (
    <nav
      aria-label="On this page"
      className="border-b border-[var(--cv-border)] bg-[var(--cv-canvas)]"
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8 py-2">
        {SECTIONS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex min-h-[32px] items-center rounded-full px-3.5 text-caption font-medium text-[var(--cv-text-secondary)] transition-colors hover:bg-[var(--cv-surface-raised)] hover:text-[var(--cv-text-primary)] whitespace-nowrap"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
