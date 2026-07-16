import { useEffect, useState } from "react";

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

function readSaveData(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return false;
  return (
    connection.saveData === true ||
    connection.effectiveType === "2g" ||
    connection.effectiveType === "slow-2g"
  );
}

export interface MediaFlags {
  isMobile: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** Master gate for the heavy 3D hero — 2D fallback art otherwise. */
  allow3D: boolean;
}

export function useMediaFlags(): MediaFlags {
  const [flags, setFlags] = useState<MediaFlags>(() => compute());

  function compute(): MediaFlags {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = readSaveData();
    return { isMobile, reducedMotion, saveData, allow3D: !isMobile && !reducedMotion && !saveData };
  }

  useEffect(() => {
    const queries = [
      window.matchMedia("(max-width: 767px)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
    ];
    const update = () => setFlags(compute());
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);

  return flags;
}
