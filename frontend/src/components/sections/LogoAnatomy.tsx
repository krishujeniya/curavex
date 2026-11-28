const MAIN_PATH =
  "M 292.0 825.4 L 265.6 825.4 L 243.2 822.5 L 157.2 800.6 L 152.7 800.8 L 146.2 809.6 L 143.6 808.8 L 135.3 801.8 L 112.9 773.4 L 109.4 762.7 L 108.8 750.0 L 113.1 735.4 L 119.0 726.6 L 127.0 719.3 L 137.7 713.6 L 147.5 711.4 L 172.9 713.6 L 243.2 727.8 L 271.5 730.0 L 293.9 725.9 L 311.5 720.0 L 328.1 712.2 L 344.7 701.3 L 369.4 676.8 L 385.9 649.4 L 434.5 532.2 L 492.7 405.3 L 517.4 356.4 L 547.3 309.6 L 582.4 268.6 L 611.3 242.0 L 648.4 214.7 L 676.8 198.1 L 704.1 187.1 L 735.4 180.1 L 798.8 172.7 L 811.5 173.6 L 824.2 177.2 L 846.7 190.1 L 856.8 200.2 L 865.7 212.9 L 870.5 223.6 L 874.3 239.3 L 874.5 256.8 L 872.6 267.6 L 866.6 283.2 L 859.8 293.9 L 841.8 311.1 L 819.3 321.6 L 798.8 324.7 L 750.0 324.6 L 735.4 326.3 L 697.3 347.3 L 665.0 373.6 L 638.5 404.3 L 616.9 438.5 L 538.9 586.9 L 493.5 683.6 L 476.9 712.9 L 458.2 739.3 L 440.4 758.3 L 422.9 773.9 L 404.3 787.2 L 381.8 800.1 L 359.4 809.8 L 335.0 817.7 L 292.0 825.4 Z";

const ACCENT_PATH =
  "M 856.4 330.2 L 854.7 330.1 L 855.7 327.1 L 887.7 265.3 L 888.7 260.6 L 888.7 279.4 L 883.9 296.9 L 871.1 317.4 L 856.4 330.2 Z";

const ANNOTATIONS = [
  {
    label: "open curve",
    note: "continuous care — nothing hidden",
    style: { top: "12%", left: "8%" },
    dot: { top: "24%", left: "30%" },
  },
  {
    label: "rising edge",
    note: "every score trends toward better outcomes",
    style: { top: "8%", right: "6%" },
    dot: { top: "20%", right: "24%" },
  },
  {
    label: "detached accent",
    note: "the verified prediction, set apart",
    style: { bottom: "14%", right: "10%" },
    dot: { top: "30%", right: "12%" },
  },
];

export function LogoAnatomy() {
  return (
    <div className="relative aspect-square w-full">
        <svg
          viewBox="0 0 1000 1000"
          className="absolute inset-0 size-full"
          role="img"
          aria-label="Animated Curavex logo mark drawing itself"
        >
          <defs>
            <clipPath id="cv-logo-wipe">
              <g transform="rotate(-35 500 500)">
                <rect x="-800" y="-800" width="2600" height="2600">
                  <animate
                    attributeName="x"
                    values="-3000;0;0;3000"
                    keyTimes="0;0.5;0.9;1"
                    dur="7s"
                    repeatCount="indefinite"
                  />
                </rect>
              </g>
            </clipPath>
          </defs>

          <g clipPath="url(#cv-logo-wipe)">
            <path d={MAIN_PATH} fill="var(--cv-accent)" fillRule="evenodd" />
          </g>

          <path
            d={ACCENT_PATH}
            fill="var(--cv-accent)"
            fillRule="evenodd"
            style={{ animation: "cv-logo-accent 7s ease-in-out infinite" }}
          />
        </svg>

        {ANNOTATIONS.map((a) => (
          <div key={a.label}>
            <span
              className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] shadow-sm"
              style={{ ...a.dot, animation: "cv-logo-label 7s ease-in-out infinite" }}
            />
            <div
              className="absolute max-w-[150px] rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)]/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm"
              style={{ ...a.style, animation: "cv-logo-label 7s ease-in-out infinite" }}
            >
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--cv-text-primary)]">
                {a.label}
              </div>
              <div className="text-[10px] leading-snug text-[var(--cv-text-secondary)]">
                {a.note}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
