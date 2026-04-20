export const pageTransition = {
  initial: { opacity: 0, x: 20, filter: 'blur(8px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: -16, filter: 'blur(8px)' },
  transition: { type: 'spring', stiffness: 280, damping: 30, mass: 0.72 }
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04
    }
  }
};

export const springPop = {
  hidden: { opacity: 0, y: 16, scale: 0.94, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 430, damping: 28 }
  }
};
