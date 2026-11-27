"use client";

import * as React from "react";
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
    const el = wordmarkRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
          }
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className={`site-footer ${hasMotion ? "footer-motion" : ""}`}>
      <div className="footer-shell">
        <div className="footer-top">
          <div className="footer-tagline">
            © 2026 Curavex — Clinical treatment-response regression and MLOps
          </div>
          <nav className="footer-links" aria-label="Footer">
            <a href="#workspace">Workspace</a>
            <a href="#architecture">Architecture</a>
            <a href="#methodology">Methodology</a>
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
            <span className="footer-sep">/</span>
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
