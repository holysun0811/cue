import { motion } from 'framer-motion';
import { uiTheme } from '../../lib/uiTheme.js';

export default function StickyCTA({ children, disabled, helper, onClick, onPointerDown }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/70 bg-white/82 px-5 pb-5 pt-3 backdrop-blur-xl">
      {helper && <p className={`mb-2 text-center text-xs font-bold ${uiTheme.accent.text}`}>{helper}</p>}
      <motion.button
        className={`flex w-full items-center justify-center rounded-[22px] py-4 text-base font-black tracking-tight transition ${uiTheme.button.primary} ${uiTheme.button.primaryDisabled}`}
        disabled={disabled}
        onClick={onClick}
        onMouseDown={disabled ? undefined : onPointerDown}
        onPointerDown={disabled ? undefined : onPointerDown}
        onTouchStart={disabled ? undefined : onPointerDown}
        type="button"
        whileTap={{ scale: disabled ? 1 : 0.97 }}
      >
        {children}
      </motion.button>
    </div>
  );
}
