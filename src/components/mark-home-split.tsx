"use client";

import { useEffect } from "react";

/** Hides the global site chrome while the split homepage owns header/footer. */
export function MarkHomeSplit() {
  useEffect(() => {
    document.body.dataset.homeSplit = "1";
    return () => {
      delete document.body.dataset.homeSplit;
    };
  }, []);

  return null;
}
