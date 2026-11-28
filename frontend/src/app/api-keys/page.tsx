"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function ApiKeysPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/monitoring?tab=keys");
  }, [router]);

  return null;
}
