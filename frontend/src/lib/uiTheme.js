export const uiTheme = {
  background: {
    app: 'bg-[#F8F1E8]',
    appWash: 'bg-[radial-gradient(circle_at_18%_14%,rgba(255,138,91,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,214,170,0.18),transparent_24%),linear-gradient(145deg,#FFFDFC,#F8F1E8_56%,#FFF7EE)]',
    frame: 'bg-[#FBF4EA]',
    frameWash: 'bg-[radial-gradient(circle_at_16%_0%,rgba(255,138,91,0.12),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(255,214,170,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(253,246,236,0.88)_48%,rgba(255,248,241,0.78))]',
    warmGlow: 'bg-orange-100/54',
    softGlow: 'bg-rose-50/72'
  },
  accent: {
    text: 'text-[#D75A1D]',
    mutedText: 'text-[#A7663D]',
    softText: 'text-[#C75F28]',
    icon: 'text-[#EF6A27]',
    iconMuted: 'text-[#D75A1D]/75',
    iconSoft: 'bg-[#FFF1E3] text-[#EF4C2F]',
    mark: 'bg-[#FFF1E3] text-[#C6531A]',
    eyebrow: 'text-[#D75A1D]',
    eyebrowMuted: 'text-[#D75A1D]/70'
  },
  surface: {
    elevated: 'border border-white/82 bg-white/84 shadow-[0_14px_32px_rgba(91,92,126,0.09)] backdrop-blur-xl',
    strong: 'border border-white/92 bg-white/94 shadow-[0_20px_46px_rgba(91,92,126,0.11)] backdrop-blur-xl',
    muted: 'border border-[#F0E4D8]/80 bg-[#FFF9F2]/78',
    subtle: 'bg-[#FFF9F2]/76',
    chip: 'border border-white/84 bg-white/74 shadow-[0_6px_14px_rgba(91,92,126,0.05)] backdrop-blur-xl'
  },
  selectable: {
    base: 'border border-white/84 bg-white/80 shadow-[0_8px_18px_rgba(91,92,126,0.06)]',
    selected: 'border border-[#F6A55E]/55 bg-[#FFF1E3]/88 shadow-[0_12px_26px_rgba(239,106,31,0.11)]',
    muted: 'border border-[#F0E4D8]/80 bg-[#FFF9F2]/76',
    disabled: 'disabled:bg-[#F0E8DF] disabled:text-[#9E9182] disabled:shadow-[0_8px_18px_rgba(128,99,70,0.08)] disabled:opacity-100'
  },
  chip: {
    base: 'border border-white/84 bg-white/74 text-slate-600',
    selected: 'border border-[#F6A55E]/55 bg-[#FFF1E3] text-[#C6531A] shadow-[0_8px_18px_rgba(239,106,31,0.09)]',
    muted: 'border border-[#F0E4D8]/80 bg-[#FFF9F2]/80 text-slate-500'
  },
  selectionMark: {
    selected: 'border-[#EF7B37] bg-[#FFF1E3] text-[#EF4C2F]',
    idle: 'border-[#E8DCCB] bg-[#FFFDF9] text-transparent'
  },
  button: {
    primary: 'bg-gradient-to-r from-[#FF8A5B] to-[#EF4C2F] text-white shadow-[0_12px_26px_rgba(239,76,47,0.22)]',
    primaryDisabled: 'disabled:from-[#E8DED1] disabled:to-[#E8DED1] disabled:bg-[#E8DED1] disabled:text-[#9F927F] disabled:shadow-[0_8px_18px_rgba(128,99,70,0.08)] disabled:opacity-100',
    secondary: 'border border-[#F0E4D8]/90 bg-white/78 text-slate-700 shadow-[0_8px_18px_rgba(91,92,126,0.06)]',
    secondaryDisabled: 'disabled:border-[#E8DED1] disabled:bg-[#F0E8DF] disabled:text-[#A89987] disabled:opacity-100'
  },
  iconButton: {
    ghost:
      'border border-white/80 bg-white/72 text-slate-700 shadow-[0_10px_24px_rgba(239,106,31,0.08)] backdrop-blur-md transition hover:border-[#F6A55E]/60 hover:bg-white/92 hover:text-[#D75A1D] active:border-[#EF7B37]/70 active:bg-[#FFF1E3] active:text-[#C6531A] active:shadow-[0_10px_22px_rgba(239,106,31,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6A55E]/55 focus-visible:ring-offset-0'
  },
  input: {
    container: 'border border-[#F0E4D8]/90 bg-[#FFF9F2]/86',
    placeholder: 'placeholder:text-[#B8AB9D]'
  },
  loading: {
    bubble: 'border border-[#F0E4D8]/80 bg-[#FFF9F2]/88 text-[#9E9182]',
    skeleton: 'bg-[#F0E8DF]'
  },
  shadow: {
    card: 'shadow-[0_10px_24px_rgba(91,92,126,0.08)]',
    cardLg: 'shadow-[0_12px_26px_rgba(91,92,126,0.1)]',
    accentSoft: 'shadow-[0_10px_24px_rgba(239,106,31,0.1)]',
    accentMd: 'shadow-[0_14px_28px_rgba(239,76,47,0.2)]'
  }
};
