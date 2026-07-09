import { motion } from "framer-motion";
import { springs } from "./motionTokens";
import { Lid } from "./Lid";
import { Tier } from "./Tier";
import { FoodLayer } from "./FoodLayer";
import { Steam } from "./Steam";
import { BackgroundGlow } from "./BackgroundGlow";

export function TiffinScene({ stage }) {
  // Translate stages to specific variant states
  const tiffinVariants = {
    enter: { opacity: 0, y: 30, scale: 0.95 },
    idle: { opacity: 1, y: 0, scale: 1 },
    breathe: { opacity: 1, y: [0, -2, 0], scale: [1, 1.005, 1] },
    unlock: { opacity: 1, y: 0, scale: 1, x: [0, -1, 1, -1, 0] }, // micro vibration
    anticipate: { opacity: 1, y: 2, scale: 0.98 },
    openLid: { opacity: 1, y: 0, scale: 1 },
    openTop: { opacity: 1, y: 0, scale: 1 },
    openMid: { opacity: 1, y: 0, scale: 1 },
    openBot: { opacity: 1, y: 0, scale: 1 },
    morph: { opacity: 0, scale: 1.05 }, // Handled partly by layoutId morphing, but fade out as fallback
  };

  const lidVariants = {
    closed: { y: 0, rotate: 0 },
    anticipate: { y: -2, rotate: 1 },
    open: { y: -120, x: 80, rotate: 45, opacity: 0 }, // Lid flies off
  };

  const topTierVariants = {
    closed: { y: 0, rotate: 0 },
    open: { y: -100, x: -80, rotate: -20, opacity: 0 },
  };

  const midTierVariants = {
    closed: { y: 0, rotate: 0 },
    open: { y: -60, x: 80, rotate: 15, opacity: 0 },
  };

  const botTierVariants = {
    closed: { y: 0, scale: 1 },
    open: { y: 20, scale: 1.1 }, // Reveal bottom tier
  };

  const getTiffinAnimate = () => {
    if (stage === "enter") return "enter";
    if (stage === "idle") return "breathe";
    if (stage === "unlock") return "unlock";
    if (stage === "anticipate") return "anticipate";
    if (stage === "morph") return "morph";
    return "openLid"; // Base state for all open stages
  };

  return (
    <div className="relative flex items-center justify-center w-full h-[400px]">
      <BackgroundGlow isRevealed={stage === "openBot"} />
      
      <motion.div
        className="relative flex flex-col items-center z-10"
        initial="enter"
        animate={getTiffinAnimate()}
        variants={tiffinVariants}
        transition={
          stage === "idle"
            ? springs.idleBreathe
            : stage === "unlock"
            ? { duration: 0.2, ease: "linear" }
            : springs.heavySteel
        }
      >
        {/* Steam emerges when lid opens or fully revealed */}
        <Steam isActive={["openLid", "openTop", "openMid", "openBot"].includes(stage)} />

        <motion.div
          variants={lidVariants}
          initial="closed"
          animate={
            ["openLid", "openTop", "openMid", "openBot"].includes(stage)
              ? "open"
              : stage === "anticipate"
              ? "anticipate"
              : "closed"
          }
          transition={springs.smoothOpen}
          className="relative z-40"
        >
          <Lid />
        </motion.div>

        <motion.div
          variants={topTierVariants}
          initial="closed"
          animate={["openTop", "openMid", "openBot"].includes(stage) ? "open" : "closed"}
          transition={springs.smoothOpen}
          className="relative z-30"
        >
          <Tier />
        </motion.div>

        <motion.div
          variants={midTierVariants}
          initial="closed"
          animate={["openMid", "openBot"].includes(stage) ? "open" : "closed"}
          transition={springs.smoothOpen}
          className="relative z-20"
        >
          <Tier />
        </motion.div>

        <motion.div
          variants={botTierVariants}
          initial="closed"
          animate={stage === "openBot" ? "open" : "closed"}
          transition={springs.heavySteel}
          className="relative z-10"
        >
          <Tier />
          {/* Food revealed only when bottom tier expands */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: stage === "openBot" ? 1 : 0, scale: stage === "openBot" ? 1 : 0.8 }}
            transition={{ delay: 0.3, ...springs.smoothOpen }}
            className="absolute inset-0"
          >
            <FoodLayer />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
