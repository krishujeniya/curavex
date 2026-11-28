"use client";

import * as React from "react";
import { ArchitectureSection } from "@/components/sections/ArchitectureSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PlatformSection } from "@/components/sections/PlatformSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { SectionNav } from "@/components/sections/SectionNav";

export default function OverviewPage() {
  return (
    <>
      <HeroSection />
      <SectionNav />
      <PlatformSection />
      <ArchitectureSection />
      <PricingSection />
    </>
  );
}
