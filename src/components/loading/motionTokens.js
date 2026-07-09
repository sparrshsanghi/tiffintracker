// Shared spring physics for the premium loading sequence
export const springs = {
  // Heavy, solid steel setting down or snapping into place
  heavySteel: {
    type: "spring",
    stiffness: 180,
    damping: 24,
    mass: 1.5,
  },
  
  // Sharp, fast metallic click (for latches)
  metalClick: {
    type: "spring",
    stiffness: 400,
    damping: 18,
    mass: 0.5,
  },
  
  // Smooth, satisfying opening motion
  smoothOpen: {
    type: "spring",
    stiffness: 120,
    damping: 20,
    mass: 1,
  },

  // Idle, slow breathing for anticipation
  idleBreathe: {
    ease: "easeInOut",
    duration: 2.5,
    repeat: Infinity,
    repeatType: "reverse",
  }
};
