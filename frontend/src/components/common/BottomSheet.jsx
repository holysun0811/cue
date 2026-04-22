import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const SIZE_CLASS = {
  default: {
    sheet: 'h-[70%]',
    body: 'px-4 pb-5 pt-4'
  },
  compact: {
    sheet: 'max-h-[38%]',
    body: 'px-4 pb-3 pt-4'
  }
};

export default function BottomSheet({ children, footer, onClose, open, portal = false, size = 'default', title }) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.default;
  const sheet = (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className={
            portal
              ? 'fixed left-1/2 top-1/2 z-[1000] flex h-[844px] max-h-[calc(100vh-16px)] w-full max-w-[390px] -translate-x-1/2 -translate-y-1/2 items-end overflow-hidden rounded-[38px] bg-black/50 pb-0'
              : 'absolute -top-[104px] bottom-0 left-0 right-0 z-[120] flex items-end bg-black/50 pb-0'
          }
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 cursor-default"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          />
          <motion.div
            animate={{ y: 0 }}
            className={`relative flex w-full flex-col overflow-hidden rounded-t-[30px] border-x-0 border-b-0 border-t border-white bg-white shadow-[0_24px_70px_rgba(79,70,229,0.24)] ${sizeClass.sheet}`}
            exit={{ y: 32 }}
            initial={{ y: 32 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          >
            <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <h3 className="text-sm font-black tracking-tight text-slate-950">{title}</h3>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500"
                onClick={onClose}
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <div className={`min-h-0 overflow-y-auto ${size === 'compact' ? 'shrink-0' : 'flex-1'} ${sizeClass.body}`}>{children}</div>
            {footer && (
              <div className="z-20 shrink-0 border-t border-slate-100 bg-white px-4 pb-4 pt-2 shadow-[0_-12px_28px_rgba(255,255,255,0.98),0_-6px_18px_rgba(148,163,184,0.08)]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (portal && typeof document !== 'undefined') {
    return createPortal(sheet, document.body);
  }

  return sheet;
}
