"use client";

import { useEffect } from "react";

/** Marks the homepage so global chrome can hide via CSS :has / body dataset. */
export function MarkHomeSplit() {
  useEffect(() => {
    document.body.dataset.homeSplit = "1";
    return () => {
      delete document.body.dataset.homeSplit;
    };
  }, []);

  return null;
}
