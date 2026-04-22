import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function AudioButton({ audioUrl, label }) {
  const play = () => {
    if (!audioUrl) return;
    new Audio(audioUrl).play();
  };

  return (
    <motion.button
      className="flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-black text-sky-600 backdrop-blur-xl disabled:opacity-40"
      disabled={!audioUrl}
      onClick={play}
      type="button"
      whileTap={{ scale: 0.95 }}
    >
      <Play size={14} fill="currentColor" />
      {label}
    </motion.button>
  );
}
