"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Turns clicks on [data-track] elements (phone, directions) into tracking events. */
export function TrackClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-track]");
      const name = el?.getAttribute("data-track");
      if (name) track(name.replace(/-/g, "_"));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
