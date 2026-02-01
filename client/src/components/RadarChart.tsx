import { ResponsiveContainer, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';

interface RadarChartProps {
  data: Record<string, number>;
  color?: string;
}

export function RadarChart({ data, color = "var(--primary)" }: RadarChartProps) {
  // Transform object data { harmony: 8, trend: 7 } to array for Recharts
  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: value,
    fullMark: 10,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'var(--font-sans)' }} 
          />
          <Radar
            name="Score"
            dataKey="A"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.3}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--background)', 
              borderColor: 'var(--border)', 
              borderRadius: '8px',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
