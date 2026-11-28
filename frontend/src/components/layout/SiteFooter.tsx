"use client";

import * as React from "react";
import Link from "next/link";
import { IconArrowUp } from "@tabler/icons-react";

export function SiteFooter({ docsUrl }: { docsUrl: string }) {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="site-footer">
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
            <Link href="/pricing">Pricing</Link>
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
