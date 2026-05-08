"use client";

import { useMemo } from "react";
import { dictionaries } from "@/lib/translations";

export default function GlobalError() {
  const dictionary = useMemo(() => dictionaries.en, []);

  return (
    <div className="p-6 text-red-500">
      <h2>{dictionary.system.runtimeIssueTitle || "Something went wrong"}</h2>
    </div>
  );
}
