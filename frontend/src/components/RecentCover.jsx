const FALLBACK_COVER = {
  type: 'mode_default',
  emoji: '🎯',
  gradient: 'from-[#FF7C5A] via-[#F25A3A] to-[#E0432A]',
  label: 'Practice'
};

function coverOrFallback(cover) {
  return cover?.type ? cover : FALLBACK_COVER;
}

function CoverPattern() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.18]"
      style={{
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.48) 0 1px, transparent 1px 12px)'
      }}
    />
  );
}

export function RecentCoverBackdrop({ cover }) {
  const payload = coverOrFallback(cover);

  if (payload.type === 'image' && payload.imageUrl) {
    return (
      <>
        <img alt="" className="absolute inset-0 h-full w-full object-cover" src={payload.imageUrl} />
        <span className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/10 to-black/32" />
      </>
    );
  }

  return (
    <>
      <span className={`absolute inset-0 bg-gradient-to-br ${payload.gradient || FALLBACK_COVER.gradient}`} />
      <CoverPattern />
    </>
  );
}

export function RecentCoverThumb({ cover }) {
  const payload = coverOrFallback(cover);

  if (payload.type === 'image' && payload.imageUrl) {
    return (
      <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-[16px] border border-[#F0E4D8]/80 bg-white shadow-[0_8px_16px_rgba(91,92,126,0.07)]">
        <img alt={payload.label || ''} className="h-full w-full object-cover" src={payload.imageUrl} />
      </span>
    );
  }

  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-[#F0E4D8]/80 bg-[#FFF7EE] text-[24px] shadow-[0_8px_16px_rgba(91,92,126,0.07)]">
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/72 via-transparent to-[#FFF1E3]/72" />
      <span className="relative leading-none">{payload.emoji || FALLBACK_COVER.emoji}</span>
    </span>
  );
}
