import { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Clock,
  FileWarning
} from 'lucide-react';
import { Card, Table, Tag, Button, Spin, message, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import StatCard from '../../components/ui/StatCard.js';
import { forecastApi } from '../../api/client.js';
import type { ForecastResult, GapItem } from '../../../shared/types.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function GapAnalysis() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ForecastResult | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const analysisData = await forecastApi.getAnalysis();
      setData(analysisData);
    } catch (error) {
      console.error('Failed to fetch analysis data:', error);
      message.error('获取预测分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'success',
      medium: 'warning',
      high: 'error'
    };
    return colors[severity] || 'default';
  };

  const getSeverityText = (severity: string) => {
    const texts: Record<string, string> = {
      low: '低风险',
      medium: '中风险',
      high: '高风险'
    };
    return texts[severity] || '未知';
  };

  const getSupplyDemandChartOption = () => {
    if (!data) return {};
    const days = data.supplyForecast.map(item => dayjs(item.date).format('MM-DD'));
    const supplyData = data.supplyForecast.map(item => item.value);
    const demandData = data.demandForecast.map(item => item.value);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['供应量', '需求量'],
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: days,
        boundaryGap: false,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: '数量(吨)'
      },
      series: [
        {
          name: '供应量',
          type: 'line',
          smooth: true,
          data: supplyData,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
                { offset: 1, color: 'rgba(34, 197, 94, 0.05)' }
              ]
            }
          },
          lineStyle: { color: '#22C55E', width: 2 },
          itemStyle: { color: '#22C55E' }
        },
        {
          name: '需求量',
          type: 'line',
          smooth: true,
          data: demandData,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
              ]
            }
          },
          lineStyle: { color: '#EF4444', width: 2 },
          itemStyle: { color: '#EF4444' }
        }
      ]
    };
  };

  const getGapDistributionChartOption = () => {
    if (!data) return {};
    const gapData = data.gaps.map(item => ({
      date: dayjs(item.date).format('MM-DD'),
      gap: item.gap,
      severity: item.severity
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: { dataIndex: number; name: string; value: number }[]) => {
          const data = params[0];
          const item = gapData[data.dataIndex];
          return `${data.name}<br/>缺口: ${data.value} 吨<br/>风险等级: ${getSeverityText(item.severity)}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: gapData.map(item => item.date),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: '缺口量(吨)'
      },
      series: [
        {
          name: '缺口量',
          type: 'bar',
          data: gapData.map(item => ({
            value: item.gap,
            itemStyle: {
              color: item.severity === 'high' ? '#EF4444' : 
                     item.severity === 'medium' ? '#F59E0B' : '#22C55E'
            }
          })),
          barWidth: '60%'
        }
      ]
    };
  };

  const contractRiskColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="font-mono">{dayjs(date).format('YYYY-MM-DD')}</span>
        </div>
      )
    },
    {
      title: '缺口量',
      dataIndex: 'gap',
      key: 'gap',
      render: (value: number) => (
        <span className="font-mono font-bold text-red-500">
          -{value.toLocaleString()} 吨
        </span>
      )
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)} className="font-medium">
          {getSeverityText(severity)}
        </Tag>
      )
    },
    {
      title: '合同风险',
      dataIndex: 'contractRisk',
      key: 'contractRisk',
      render: (hasRisk: boolean) => (
        <div className="flex items-center gap-2">
          {hasRisk ? (
            <>
              <FileWarning className="w-4 h-4 text-red-500" />
              <span className="text-red-500 font-medium">存在风险</span>
            </>
          ) : (
            <>
              <span className="text-gray-400">无风险</span>
            </>
          )}
        </div>
      )
    },
    {
      title: '影响合同数',
      key: 'contractCount',
      render: (_: unknown, record: GapItem) => (
        <span className="font-mono">
          {record.contractRisk ? Math.ceil(record.gap / 100) : 0} 份
        </span>
      )
    }
  ];

  const getTotalSupply = () => {
    if (!data) return 0;
    return data.supplyForecast.reduce((sum, item) => sum + item.value, 0);
  };

  const getTotalDemand = () => {
    if (!data) return 0;
    return data.demandForecast.reduce((sum, item) => sum + item.value, 0);
  };

  const getTotalGap = () => {
    if (!data) return 0;
    return data.gaps.reduce((sum, item) => sum + Math.max(0, item.gap), 0);
  };

  const getHighRiskCount = () => {
    if (!data) return 0;
    return data.gaps.filter(item => item.severity === 'high').length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} style={{ margin: 0 }}>供需缺口分析</Title>
          <Text type="secondary">基于年度计划数据，预测未来{data.forecastDays}天的供需平衡情况</Text>
        </div>
        <Button
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchData}
        >
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="预测周期"
          value={data.forecastDays}
          unit="天"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="总供应量"
          value={getTotalSupply().toLocaleString()}
          unit="吨"
          icon={TrendingUp}
          trend={5.2}
          trendLabel="较上月"
          color="green"
        />
        <StatCard
          title="总需求量"
          value={getTotalDemand().toLocaleString()}
          unit="吨"
          icon={TrendingDown}
          trend={8.7}
          trendLabel="较上月"
          color="orange"
        />
        <StatCard
          title="缺口总量"
          value={getTotalGap().toLocaleString()}
          unit="吨"
          icon={AlertTriangle}
          color={getTotalGap() > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">供需趋势对比</span>
            </div>
          }
          extra={
            <Tag color="blue">未来{data.forecastDays}天</Tag>
          }
        >
          <div style={{ height: 320 }}>
            <ReactECharts option={getSupplyDemandChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">缺口分布</span>
            </div>
          }
          extra={
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-500">低风险</span>
              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full ml-2" />
              <span className="text-xs text-gray-500">中风险</span>
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-2" />
              <span className="text-xs text-gray-500">高风险</span>
            </div>
          }
        >
          <div style={{ height: 320 }}>
            <ReactECharts option={getGapDistributionChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="font-semibold">合同风险预警</span>
            <Tag color="red" className="ml-2">
              {getHighRiskCount()} 个高风险日
            </Tag>
          </div>
        }
      >
        <Table
          columns={contractRiskColumns}
          dataSource={data.gaps.filter(g => g.contractRisk)}
          rowKey="date"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条风险记录`
          }}
        />
      </Card>
    </div>
  );
}
