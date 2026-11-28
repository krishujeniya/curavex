"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function ModelsPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/scoring?tab=models");
  }, [router]);

  return null;
}
