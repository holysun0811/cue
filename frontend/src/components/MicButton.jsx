import { motion } from 'framer-motion';
import { Mic, Pause } from 'lucide-react';

export default function MicButton({ active, activeText, idleText, label, onClick }) {
  return (
    <motion.button
      className="group relative flex h-44 w-44 items-center justify-center self-center"
      onClick={onClick}
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="absolute inset-0 rounded-full border border-[#EF7B37]/35 bg-[#FFE2CD]/55"
        animate={{ scale: active ? [1, 1.18, 1] : [1, 1.12, 1], opacity: active ? [0.7, 0.18, 0.7] : [0.48, 0.12, 0.48] }}
        transition={{ duration: active ? 1.05 : 2.25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute h-32 w-32 rounded-full border border-white/60 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_32%),linear-gradient(135deg,#FF8A5B,#EF4C2F_58%,#C6531A)] shadow-[0_0_28px_rgba(239,76,47,0.32),0_0_72px_rgba(239,106,31,0.22)]"
        animate={{
          boxShadow: active
            ? '0 0 36px rgba(239,76,47,0.55), 0 0 86px rgba(239,106,31,0.34)'
            : '0 0 24px rgba(239,76,47,0.34), 0 0 58px rgba(239,106,31,0.18)'
        }}
      />
      <span className="relative flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full border border-white/60 bg-white text-[#C6531A] transition group-hover:text-[#EF4C2F]">
        {active ? <Pause size={28} fill="currentColor" /> : <Mic size={30} />}
        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.18em]">{active ? activeText : idleText}</span>
      </span>
      <span className="sr-only">{label}</span>
    </motion.button>
  );
}
