import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, ECElementEvent, CallbackDataParams } from 'echarts';

interface ChinaMapChartProps {
  data: Array<{ name: string; value: number; code: string }>;
  onProvinceClick?: (code: string, name: string) => void;
  height?: number;
  title?: string;
  colorRange?: [string, string];
}

const provinceGeoJSON: Record<string, [number, number][]> = {
  '黑龙江': [[121, 53], [135, 53], [135, 43], [121, 43]],
  '吉林': [[121, 46], [131, 46], [131, 41], [121, 41]],
  '辽宁': [[119, 43], [125, 43], [125, 38], [119, 38]],
  '内蒙古': [[97, 50], [126, 50], [126, 37], [97, 37]],
  '新疆': [[73, 49], [97, 49], [97, 34], [73, 34]],
  '西藏': [[78, 36], [99, 36], [99, 26], [78, 26]],
  '青海': [[89, 39], [103, 39], [103, 31], [89, 31]],
  '甘肃': [[92, 42], [108, 42], [108, 32], [92, 32]],
  '宁夏': [[104, 39], [107, 39], [107, 35], [104, 35]],
  '陕西': [[105, 39], [111, 39], [111, 31], [105, 31]],
  '山西': [[110, 40], [114, 40], [114, 34], [110, 34]],
  '河北': [[113, 42], [119, 42], [119, 36], [113, 36]],
  '北京': [[115.4, 41.1], [117.5, 41.1], [117.5, 39.4], [115.4, 39.4]],
  '天津': [[116.7, 40.2], [118.0, 40.2], [118.0, 38.8], [116.7, 38.8]],
  '山东': [[114, 38], [122, 38], [122, 34], [114, 34]],
  '河南': [[110, 36], [116, 36], [116, 31], [110, 31]],
  '江苏': [[116, 35], [122, 35], [122, 31], [116, 31]],
  '安徽': [[114, 34], [119, 34], [119, 29], [114, 29]],
  '浙江': [[118, 31], [123, 31], [123, 27], [118, 27]],
  '上海': [[121.0, 31.8], [122.2, 31.8], [122.2, 30.7], [121.0, 30.7]],
  '湖北': [[108, 33], [116, 33], [116, 29], [108, 29]],
  '湖南': [[108, 30], [114, 30], [114, 24], [108, 24]],
  '江西': [[113, 30], [118, 30], [118, 24], [113, 24]],
  '福建': [[116, 28], [120, 28], [120, 23], [116, 23]],
  '台湾': [[120, 25], [122, 25], [122, 21], [120, 21]],
  '广东': [[109, 25], [117, 25], [117, 20], [109, 20]],
  '广西': [[104, 26], [111, 26], [111, 20], [104, 20]],
  '海南': [[108, 20], [111, 20], [111, 18], [108, 18]],
  '四川': [[97, 34], [108, 34], [108, 26], [97, 26]],
  '重庆': [[105, 32], [110, 32], [110, 28], [105, 28]],
  '贵州': [[103, 29], [109, 29], [109, 24], [103, 24]],
  '云南': [[97, 29], [106, 29], [106, 21], [97, 21]],
  '香港': [[113.8, 22.6], [114.4, 22.6], [114.4, 22.1], [113.8, 22.1]],
  '澳门': [[113.5, 22.2], [113.6, 22.2], [113.6, 22.0], [113.5, 22.0]]
};

export default function ChinaMapChart({
  data,
  onProvinceClick,
  height = 500,
  title,
  colorRange = ['#E0F2FE', '#0369A1']
}: ChinaMapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const geoData = Object.entries(provinceGeoJSON).map(([name]) => ({
      name,
      value: data.find(d => d.name === name)?.value || 0,
      itemStyle: {
        areaColor: 'transparent',
        borderColor: '#CBD5E1',
        borderWidth: 1
      }
    }));

    const maxValue = Math.max(...data.map(d => d.value), 1);

    const option: EChartsOption = {
      title: title ? {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: '#1E293B'
        }
      } : undefined,
      tooltip: {
        trigger: 'item',
        formatter: (params: CallbackDataParams) => {
          const value = params.value || 0;
          return `<div class="font-medium">${params.name}</div>
                  <div class="text-blue-600">产量: <span class="font-bold">${value.toLocaleString()}</span> 吨/日</div>`;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#1E293B'
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: colorRange
        },
        textStyle: {
          color: '#64748B'
        }
      },
      geo: {
        map: 'china',
        roam: false,
        zoom: 1.2,
        label: {
          show: true,
          fontSize: 10,
          color: '#475569'
        },
        itemStyle: {
          areaColor: '#F8FAFC',
          borderColor: '#CBD5E1',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            areaColor: '#BAE6FD',
            borderColor: '#0EA5E9',
            borderWidth: 2
          },
          label: {
            show: true,
            color: '#0369A1',
            fontWeight: 'bold'
          }
        },
        select: {
          itemStyle: {
            areaColor: '#7DD3FC',
            borderColor: '#0284C7'
          }
        },
        regions: geoData.map(d => ({
          name: d.name,
          value: d.value,
          itemStyle: {
            areaColor: getColor(d.value, maxValue, colorRange)
          }
        }))
      },
      series: [
        {
          name: '产量',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: data
            .filter(d => provinceGeoJSON[d.name])
            .map(d => {
              const coords = provinceGeoJSON[d.name];
              const centerLng = (coords[0][0] + coords[1][0]) / 2;
              const centerLat = (coords[0][1] + coords[2][1]) / 2;
              return {
                name: d.name,
                value: [centerLng, centerLat, d.value],
                symbolSize: Math.max(8, Math.min(25, (d.value / maxValue) * 25)),
                itemStyle: {
                  color: '#0EA5E9'
                }
              };
            }),
          rippleEffect: {
            brushType: 'stroke',
            scale: 3
          },
          label: {
            show: false
          }
        }
      ]
    };

    chart.setOption(option);
    setLoading(false);

    chart.on('click', (params: ECElementEvent) => {
      if (params.componentType === 'geo' || params.componentType === 'series') {
        const provinceData = data.find(d => d.name === params.name);
        if (provinceData && onProvinceClick) {
          onProvinceClick(provinceData.code, provinceData.name);
        }
      }
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data, onProvinceClick, title, colorRange]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
      <div ref={chartRef} style={{ height }} />
    </div>
  );
}

function getColor(value: number, max: number, colorRange: [string, string]): string {
  if (max === 0) return colorRange[0];
  const ratio = value / max;
  return interpolateColor(colorRange[0], colorRange[1], ratio);
}

function interpolateColor(color1: string, color2: string, ratio: number): string {
  const hex = (x: string) => parseInt(x, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));
  
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
}
