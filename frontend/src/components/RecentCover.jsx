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
      <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-[16px] bg-slate-100">
        <img alt={payload.label || ''} className="h-full w-full object-cover" src={payload.imageUrl} />
      </span>
    );
  }

  return (
    <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-gradient-to-br ${payload.gradient || FALLBACK_COVER.gradient} text-[25px] shadow-[0_10px_20px_rgba(15,23,42,0.10)]`}>
      <CoverPattern />
      <span className="relative leading-none">{payload.emoji || FALLBACK_COVER.emoji}</span>
    </span>
  );
}
