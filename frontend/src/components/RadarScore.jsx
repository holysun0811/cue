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
    <div className="relative h-56 overflow-hidden rounded-3xl border border-white/5 bg-[#18181B]/72 shadow-[0_0_36px_rgba(157,78,221,0.14)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.1),transparent_52%)]" />
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(255,255,255,0.16)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(229,231,235,0.82)', fontSize: 11, fontWeight: 700 }} />
          <Radar dataKey="score" stroke="#00F0FF" strokeWidth={2.4} fill="#9D4EDD" fillOpacity={0.26} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
