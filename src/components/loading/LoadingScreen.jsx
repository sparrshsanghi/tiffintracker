import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLoadingSequence } from "./useLoadingSequence";
import { TiffinScene } from "./TiffinScene";

export function LoadingScreen({ isLoaded, onSequenceComplete }) {
  const { stage } = useLoadingSequence(isLoaded);

  useEffect(() => {
    if (stage === "morph") {
      onSequenceComplete();
    }
  }, [stage, onSequenceComplete]);

  return (
    <motion.div
      key="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeOut" } }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      <div className="w-full max-w-md mx-auto px-6">
        <motion.div layoutId="tiffin-morph" className="relative w-full flex flex-col items-center justify-center">
          <TiffinScene stage={stage} />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: stage === "openBot" ? 1 : 0, y: stage === "openBot" ? 0 : 10 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="font-serif text-2xl font-semibold text-foreground">Preparing your meal</p>
            <p className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-widest">Maa Sharda Kitchen</p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
