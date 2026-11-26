import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://curavex.pages.dev"),
  title: "Curavex by Krish Ujeniya | Clinical Treatment Response & MLOps",
  description:
    "Curavex is a clinical treatment-response regression and MLOps governance platform built by Krish Ujeniya (krishujeniya) with Next.js, FastAPI, and scikit-learn.",
  authors: [{ name: "Krish Ujeniya", url: "https://github.com/krishujeniya" }],
  creator: "Krish Ujeniya",
  publisher: "Krish Ujeniya",
  keywords: [
    "Curavex",
    "Krish Ujeniya",
    "krishujeniya",
    "Curavex Krish Ujeniya",
    "clinical treatment response",
    "pharmacology MLOps",
    "drug efficacy prediction",
    "model drift detection",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://curavex.pages.dev/",
  },
  icons: {
    icon: "./assets/curavex-logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://curavex.pages.dev/",
    siteName: "Curavex",
    title: "Curavex by Krish Ujeniya | Clinical Treatment Response & MLOps",
    description:
      "Clinical treatment-response regression, batch cohort scoring, and drift observability platform built by Krish Ujeniya (krishujeniya).",
    images: [
      {
        url: "/assets/curavex-logo.png",
        width: 1024,
        height: 1024,
        alt: "Curavex logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@krishujeniya",
    title: "Curavex by Krish Ujeniya | Clinical Treatment Response & MLOps",
    description:
      "Clinical treatment-response regression and MLOps platform built by Krish Ujeniya (krishujeniya).",
    images: ["/assets/curavex-logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://krishujeniya.dev/#krishujeniya",
      name: "Krish Ujeniya",
      alternateName: ["krishujeniya", "@krishujeniya"],
      url: "https://github.com/krishujeniya",
      jobTitle: "Software Engineer & AI Systems Architect",
      sameAs: [
        "https://github.com/krishujeniya",
        "https://www.linkedin.com/in/krishujeniya",
        "https://x.com/krishujeniya",
        "https://krishujeniya.pages.dev",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://curavex.pages.dev/#website",
      name: "Curavex",
      alternateName: "Curavex by Krish Ujeniya",
      url: "https://curavex.pages.dev/",
      author: { "@id": "https://krishujeniya.dev/#krishujeniya" },
      publisher: { "@id": "https://krishujeniya.dev/#krishujeniya" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://curavex.pages.dev/#software",
      name: "Curavex",
      applicationCategory: "MedicalBusinessApplication",
      operatingSystem: "All",
      description:
        "Clinical treatment-response regression and pharmacology MLOps platform for single/batch efficacy prediction, model governance, and KS/PSI drift monitoring.",
      url: "https://curavex.pages.dev/",
      codeRepository: "https://github.com/krishujeniya/curavex",
      programmingLanguage: ["TypeScript", "Python"],
      keywords:
        "Curavex, Krish Ujeniya, krishujeniya, clinical MLOps, treatment response regression",
      author: { "@id": "https://krishujeniya.dev/#krishujeniya" },
      creator: { "@id": "https://krishujeniya.dev/#krishujeniya" },
      publisher: { "@id": "https://krishujeniya.dev/#krishujeniya" },
    },
    {
      "@type": "FAQPage",
      "@id": "https://curavex.pages.dev/#faq",
      mainEntity: [
        {
          "@type": "Question",
          "name": "What is Curavex?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Curavex is a clinical treatment-response regression and MLOps governance platform built by Krish Ujeniya (krishujeniya). It predicts patient improvement scores from demographics and compound dosing, scores CSV cohorts, and monitors Kolmogorov-Smirnov and PSI drift.",
          },
        },
        {
          "@type": "Question",
          "name": "Who built Curavex?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Curavex was engineered and developed by Krish Ujeniya (@krishujeniya), and is open-source at https://github.com/krishujeniya/curavex.",
          },
        },
        {
          "@type": "Question",
          "name": "What stack powers Curavex?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Curavex uses a Next.js 15 App Router static frontend with Tailwind CSS v4 and Wensity UI components on Cloudflare Pages, backed by a FastAPI and scikit-learn MLOps service and Cloudflare Workers edge caching.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-[var(--cv-canvas)] text-[var(--cv-text-primary)] font-sans antialiased selection:bg-[var(--cv-text-primary)] selection:text-[var(--cv-canvas)]">
        <a className="skip-link" href="#main-content">
          Skip to workspace
        </a>
        {children}
      </body>
    </html>
  );
}
