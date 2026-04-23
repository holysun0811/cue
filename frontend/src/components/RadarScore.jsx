import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function RadarScore({ scores }) {
  const { t } = useTranslation();
  const data = [
    { metric: t('review.metrics.fluency'), score: scores?.fluency || 0 },
    { metric: t('review.metrics.vocabulary'), score: scores?.vocabulary || 0 },
    { metric: t('review.metrics.pronunciation'), score: scores?.pronunciation || 0 }
  ];

  return (
    <div className="relative h-56 overflow-hidden rounded-3xl border border-white/82 bg-white/86 shadow-[0_14px_32px_rgba(91,92,126,0.09)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,106,31,0.12),transparent_56%)]" />
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(91,92,126,0.14)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(51,65,85,0.86)', fontSize: 11, fontWeight: 700 }} />
          <Radar dataKey="score" stroke="#EF4C2F" strokeWidth={2.4} fill="#F6A55E" fillOpacity={0.32} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
