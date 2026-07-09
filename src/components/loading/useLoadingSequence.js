import { useState, useEffect } from "react";

export function useLoadingSequence(isLoaded) {
  // states: "enter" | "idle" | "unlock" | "anticipate" | "openLid" | "openTop" | "openMid" | "openBot" | "morph"
  const [stage, setStage] = useState("enter");

  useEffect(() => {
    const reducedMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      if (isLoaded) {
        setStage("openBot"); // Jump straight to food reveal
        const t = setTimeout(() => {
          setStage("morph");
        }, 1000);
        return () => clearTimeout(t);
      }
      return; // wait for load
    }

    let t;
    
    switch (stage) {
      case "enter":
        t = setTimeout(() => setStage("idle"), 800);
        break;
      case "idle":
        if (isLoaded) {
          setStage("unlock");
        }
        break;
      case "unlock":
        t = setTimeout(() => setStage("anticipate"), 400);
        break;
      case "anticipate":
        t = setTimeout(() => setStage("openLid"), 300);
        break;
      case "openLid":
        t = setTimeout(() => setStage("openTop"), 500);
        break;
      case "openTop":
        t = setTimeout(() => setStage("openMid"), 400);
        break;
      case "openMid":
        t = setTimeout(() => setStage("openBot"), 400);
        break;
      case "openBot":
        t = setTimeout(() => setStage("morph"), 1200);
        break;
      default:
        break;
    }

    return () => clearTimeout(t);
  }, [stage, isLoaded]);

  return { stage };
}
