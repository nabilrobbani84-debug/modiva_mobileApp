import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const PADDING_X = 18;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

const buildPath = (points) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${PADDING_X} ${points[0].y} L ${CHART_WIDTH - PADDING_X} ${points[0].y}`;
  }
  return points.reduce((path, point, index) => (
    `${path}${index === 0 ? 'M' : ' L'} ${point.x} ${point.y}`
  ), '');
};

export default function HBTrendNativeChart({
  points = [],
  emptyMessage = 'Grafik perkembangan akan muncul setelah ada data HB.'
}) {
  if (!Array.isArray(points) || points.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const hasRange = rawMax > rawMin;
  const padding = hasRange ? Math.max(1, (rawMax - rawMin) * 0.25) : 1.5;
  const minValue = Math.max(0, Number((rawMin - padding).toFixed(1)));
  const maxValue = Number((rawMax + padding).toFixed(1));
  const valueRange = Math.max(maxValue - minValue, 0.5);
  const chartInnerWidth = CHART_WIDTH - (PADDING_X * 2);
  const chartInnerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const stepX = points.length > 1 ? chartInnerWidth / (points.length - 1) : 0;

  const chartPoints = points.map((point, index) => {
    const normalizedValue = (point.value - minValue) / valueRange;
    const x = points.length === 1 
      ? CHART_WIDTH / 2 
      : PADDING_X + (stepX * index);
    return {
      ...point,
      x,
      y: PADDING_TOP + ((1 - normalizedValue) * chartInnerHeight)
    };
  });

  const gridValues = [maxValue, minValue + (valueRange / 2), minValue];
  const pathData = buildPath(chartPoints);

  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        {gridValues.map((gridValue, index) => {
          const normalizedValue = (gridValue - minValue) / valueRange;
          const y = PADDING_TOP + ((1 - normalizedValue) * chartInnerHeight);

          return (
            <React.Fragment key={`grid-${index}`}>
              <Line
                x1={PADDING_X}
                x2={CHART_WIDTH - PADDING_X}
                y1={y}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="4 4"
              />
              <SvgText
                x={CHART_WIDTH - 2}
                y={y - 4}
                fontSize="10"
                fill="#9CA3AF"
                textAnchor="end"
              >
                {gridValue.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        <Path
          d={pathData}
          fill="none"
          stroke={points.length === 1 ? '#F87171' : '#DC2626'}
          strokeDasharray={points.length === 1 ? '4 4' : undefined}
          strokeWidth={points.length === 1 ? '2' : '3'}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {chartPoints.map((point) => (
          <React.Fragment key={point.id}>
            <Circle cx={point.x} cy={point.y} r="4.5" fill="#DC2626" />
            <Circle cx={point.x} cy={point.y} r="8" fill="rgba(220, 38, 38, 0.12)" />
            {/* Tampilkan nilai HB di atas titik */}
            <SvgText
              x={point.x}
              y={Math.max(12, point.y - 10)}
              fontSize="10"
              fontWeight="bold"
              fill="#B91C1C"
              textAnchor="middle"
            >
              {typeof point.value === 'number' ? point.value.toFixed(1) : point.value}
            </SvgText>
            {/* Tampilkan tanggal/tahun di bawah titik */}
            <SvgText
              x={point.x}
              y={CHART_HEIGHT - 8}
              fontSize="10"
              fill="#6B7280"
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%'
  },
  emptyState: {
    height: 150,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 13,
    paddingHorizontal: 20
  }
});
