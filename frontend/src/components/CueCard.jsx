import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { springPop } from '../lib/motion.js';

export default function CueCard({ card, mode = 'full', index = 0 }) {
  const showFrame = mode === 'full';
  const compact = mode === 'compact';
  const showLogic = mode === 'full';

  return (
    <motion.article
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#18181B]/78 p-3.5 shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      initial="hidden"
      animate="show"
      variants={springPop}
      transition={{ delay: index * 0.03 }}
      layout
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cue-cyan/70 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-black text-cue-cyan">
          0{index + 1}
        </span>
        <div className="min-w-0 flex-1">
          {showFrame && <p className="text-sm leading-snug tracking-tight text-gray-100">{card.frame}</p>}
          <p className={cn('break-words font-black tracking-tight text-cue-cyan drop-shadow-[0_0_14px_rgba(0,240,255,0.45)]', compact ? 'text-sm' : 'mt-1 text-lg')}>
            <Zap className="mr-1 inline-block align-[-2px]" size={compact ? 12 : 15} fill="currentColor" />
            {card.keyword}
          </p>
          {showLogic && card.nativeLogic && <p className="mt-1 text-xs leading-snug text-gray-400">{card.nativeLogic}</p>}
        </div>
      </div>
    </motion.article>
  );
}
