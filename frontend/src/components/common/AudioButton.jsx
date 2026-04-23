import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { uiTheme } from '../../lib/uiTheme.js';

export default function AudioButton({ audioUrl, label }) {
  const play = () => {
    if (!audioUrl) return;
    new Audio(audioUrl).play();
  };

  return (
    <motion.button
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black backdrop-blur-xl ${uiTheme.chip.selected} ${uiTheme.button.secondaryDisabled}`}
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
