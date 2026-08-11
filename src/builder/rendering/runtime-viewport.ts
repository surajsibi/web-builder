"use client";

import { useEffect, useState } from "react";

import { BREAKPOINTS, type Viewport } from "@/builder/styles/types";

export function viewportForWidth(width: number): Viewport {
  if (width <= BREAKPOINTS.mobileMaxWidth) return "mobile";
  if (width <= BREAKPOINTS.tabletMaxWidth) return "tablet";
  return "desktop";
}

export function useRuntimeViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  useEffect(() => {
    const updateViewport = () => {
      setViewport(viewportForWidth(window.innerWidth));
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  return viewport;
}
