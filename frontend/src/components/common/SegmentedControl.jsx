import { motion } from 'framer-motion';
import { cn } from '../../lib/cn.js';
import { uiTheme } from '../../lib/uiTheme.js';

export default function SegmentedControl({ options, value, onChange }) {
  const columnsClass = options.length === 3 ? 'grid-cols-3' : options.length === 2 ? 'grid-cols-2' : 'grid-cols-4';

  return (
    <div className={`grid ${columnsClass} gap-1 rounded-2xl p-1 ${uiTheme.surface.elevated}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            className={cn(
              'relative rounded-xl px-2 py-2 text-[11px] font-black text-slate-500 transition',
              selected && uiTheme.accent.text
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {selected && (
              <motion.span
                className="absolute inset-0 rounded-xl border border-[#F6A55E]/55 bg-[#FFF1E3] shadow-[0_8px_18px_rgba(239,106,31,0.1)]"
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
