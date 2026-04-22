import { motion } from 'framer-motion';
import { cn } from '../../lib/cn.js';

export default function SegmentedControl({ options, value, onChange }) {
  const columnsClass = options.length === 3 ? 'grid-cols-3' : options.length === 2 ? 'grid-cols-2' : 'grid-cols-4';

  return (
    <div className={`grid ${columnsClass} gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-[0_10px_24px_rgba(99,102,241,0.08)] backdrop-blur-xl`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            className={cn(
              'relative rounded-xl px-2 py-2 text-[11px] font-black text-slate-500 transition',
              selected && 'text-white'
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {selected && (
              <motion.span
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500 to-sky-400 shadow-[0_8px_18px_rgba(99,102,241,0.2)]"
                layoutId="hintLevel"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
