import { motion } from "framer-motion";

export function BackgroundGlow({ isRevealed }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isRevealed ? 1 : 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10"
    >
      <div className="w-[300px] h-[300px] bg-amber-500/20 blur-3xl rounded-full" />
    </motion.div>
  );
}
