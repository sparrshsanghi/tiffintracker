import { motion } from "framer-motion";

export function Steam({ isActive }) {
  // Deterministic variants (no Math.random in render)
  // We use fixed arrays to simulate randomness
  const steamPaths = [
    { x: -20, delay: 0.2, duration: 2.5, scale: 1.2 },
    { x: 10, delay: 0.5, duration: 2.8, scale: 0.9 },
    { x: 25, delay: 0.8, duration: 2.2, scale: 1.1 },
    { x: -5, delay: 1.2, duration: 2.6, scale: 1.0 },
  ];

  return (
    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[100px] h-[100px] pointer-events-none flex justify-center items-end">
      {steamPaths.map((steam, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 0, x: steam.x, scale: 0.5 }}
          animate={
            isActive
              ? {
                  opacity: [0, 0.4, 0],
                  y: -60,
                  x: steam.x + (i % 2 === 0 ? 15 : -15), // drift
                  scale: steam.scale,
                }
              : { opacity: 0, y: 0, x: steam.x }
          }
          transition={{
            duration: steam.duration,
            repeat: isActive ? Infinity : 0,
            delay: isActive ? steam.delay : 0,
            ease: "easeOut",
          }}
          className="absolute w-8 h-8 rounded-full bg-white/40 blur-xl"
        />
      ))}
    </div>
  );
}
