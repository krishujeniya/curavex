"use client";

import * as React from "react";
import Link from "next/link";
import { IconArrowUp } from "@tabler/icons-react";

export function SiteFooter({ docsUrl }: { docsUrl: string }) {
  const wordmarkRef = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);
  const [hasMotion, setHasMotion] = React.useState(false);

  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setInView(true);
      setHasMotion(false);
      return;
    }

    setHasMotion(true);
    let rafId = 0;

    const updateFooterWordmark = () => {
      rafId = 0;
      const el = wordmarkRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const halfLine = rect.top + rect.height * 0.5;
      setInView(halfLine <= vh);
    };

    const queueFooter = () => {
      if (!rafId) rafId = window.requestAnimationFrame(updateFooterWordmark);
    };

    updateFooterWordmark();
    window.addEventListener("scroll", queueFooter, { passive: true });
    window.addEventListener("resize", queueFooter, { passive: true });
    return () => {
      window.removeEventListener("scroll", queueFooter);
      window.removeEventListener("resize", queueFooter);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className={`site-footer ${hasMotion ? "footer-motion" : ""}`}>
      <div className="footer-shell">
        <div className="footer-top">
          <p className="footer-tagline">
            © 2026 Curavex — Clinical treatment-response regression and MLOps
          </p>
          <nav className="footer-links" aria-label="Footer">
            <Link href="/">Overview</Link>
            <Link href="/scoring">Scoring</Link>
            <Link href="/models">Models</Link>
            <Link href="/monitoring">Monitoring</Link>
            <Link href="/api-keys">API keys</Link>
            <a href={docsUrl} target="_blank" rel="noopener noreferrer">
              API docs
            </a>
            <a
              href="https://github.com/krishujeniya/curavex"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="footer-banner">
          <div
            ref={wordmarkRef}
            className={`footer-wordmark ${inView ? "in-view" : ""}`}
            aria-label="Curavex"
          >
            <span className="footer-part footer-left">
              <span className="footer-letter">C</span>
              <span className="footer-letter">u</span>
              <span className="footer-letter">r</span>
              <span className="footer-letter">a</span>
            </span>
            <span className="footer-part footer-right">
              <span className="footer-letter footer-float-1">v</span>
              <span className="footer-letter footer-float-2">e</span>
              <span className="footer-letter footer-float-3">x</span>
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-meta">
            <span>Curavex</span>
            <span className="footer-sep" aria-hidden="true">
              /
            </span>
            <a
              href="https://github.com/krishujeniya"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built by Krish Ujeniya
            </a>
          </div>
          <button
            type="button"
            onClick={scrollToTop}
            className="back-top"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <IconArrowUp size={14} stroke={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
