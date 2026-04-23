import { AnimatePresence, motion } from 'framer-motion';
import { uiTheme } from '../../lib/uiTheme.js';

export default function GlobalLoadingOverlay({ label, show }) {
  return (
    <AnimatePresence>
      {show && (
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[300] flex items-center justify-center bg-black/36 backdrop-blur-[2px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex min-w-[132px] flex-col items-center rounded-[24px] border border-white/80 bg-white/92 px-5 py-4 shadow-[0_18px_46px_rgba(91,92,126,0.18)]"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            >
              <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#F0E4D8] border-t-[#EF4C2F]" />
              <span className={`mt-3 text-sm font-black ${uiTheme.accent.text}`}>{label}</span>
            </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
