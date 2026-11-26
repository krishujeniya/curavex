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
  title: "Curavex: Clinical Treatment Response and MLOps Platform",
  description:
    "Curavex is a clinical MLOps platform for treatment-response regression, precision pharmacology, and model governance built by Krish Ujeniya.",
  authors: [{ name: "Krish Ujeniya", url: "https://github.com/krishujeniya" }],
  keywords: [
    "Curavex",
    "clinical treatment response",
    "precision oncology",
    "pharmacology MLOps",
    "drug efficacy prediction",
    "biomarker regression",
    "Krish Ujeniya",
  ],
  alternates: {
    canonical: "https://curavex.pages.dev/",
  },
  icons: {
    icon: "./assets/curavex-mark.svg",
  },
  openGraph: {
    type: "website",
    url: "https://curavex.pages.dev/",
    title: "Curavex: Clinical Treatment Response and MLOps Platform",
    description:
      "Clinical MLOps platform for treatment-response regression and pharmacology governance. Built by Krish Ujeniya.",
    images: ["./assets/curavex-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@krishujeniya",
    title: "Curavex: Clinical Treatment Response and MLOps Platform",
    description:
      "Clinical MLOps platform for treatment-response regression and pharmacology governance. Built by Krish Ujeniya.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://krishujeniya.dev/#krishujeniya",
      name: "Krish Ujeniya",
      url: "https://github.com/krishujeniya",
      jobTitle: "Software Engineer & AI Systems Architect",
      sameAs: [
        "https://github.com/krishujeniya",
        "https://www.linkedin.com/in/krishujeniya",
        "https://x.com/krishujeniya",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://curavex.pages.dev/#software",
      name: "Curavex",
      applicationCategory: "MedicalBusinessApplication",
      operatingSystem: "All",
      description:
        "Clinical treatment response regression and pharmacology MLOps platform for precision oncology prediction and efficacy governance.",
      url: "https://curavex.pages.dev/",
      author: { "@id": "https://krishujeniya.dev/#krishujeniya" },
      creator: { "@id": "https://krishujeniya.dev/#krishujeniya" },
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
