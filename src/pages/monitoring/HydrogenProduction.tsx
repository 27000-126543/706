import { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Thermometer,
  Gauge,
  Droplets,
  Activity,
  RefreshCw,
  Factory,
  Percent
} from 'lucide-react';
import { Table, Card, Button, Spin, message, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import StatCard from '../../components/ui/StatCard.js';
import { monitoringApi } from '../../api/client.js';
import type { ProductionData, MonitoringStats } from '../../../shared/types.js';
import dayjs from 'dayjs';

export default function HydrogenProduction() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductionData[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productionRes, statsRes] = await Promise.all([
        monitoringApi.getProduction(pagination.pageSize),
        monitoringApi.getStats()
      ]);
      setData(productionRes.data);
      setStats(statsRes);
      setPagination(prev => ({ ...prev, total: productionRes.total }));
    } catch (error) {
      console.error('Failed to fetch production data:', error);
      message.error('获取制氢数据失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }));
  };

  const getTrendChartOption = () => {
    if (!stats) return {};
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['产量', '纯度'],
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
        data: hours,
        boundaryGap: false
      },
      yAxis: [
        {
          type: 'value',
          name: '产量(kg)'
        },
        {
          type: 'value',
          name: '纯度(%)',
          min: 95,
          max: 100
        }
      ],
      series: [
        {
          name: '产量',
          type: 'line',
          smooth: true,
          data: stats.production.trend,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
              ]
            }
          },
          lineStyle: { color: '#3B82F6', width: 2 }
        },
        {
          name: '纯度',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: Array.from({ length: 24 }, () => (Math.random() * 2 + 98).toFixed(2)),
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' }
        }
      ]
    };
  };

  const getEfficiencyChartOption = () => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}A ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center'
      },
      series: [
        {
          name: '电解槽电流分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 1250, name: '1#电解槽', itemStyle: { color: '#3B82F6' } },
            { value: 1180, name: '2#电解槽', itemStyle: { color: '#10B981' } },
            { value: 1320, name: '3#电解槽', itemStyle: { color: '#F59E0B' } },
            { value: 1150, name: '4#电解槽', itemStyle: { color: '#8B5CF6' } },
            { value: 1280, name: '5#电解槽', itemStyle: { color: '#EF4444' } }
          ]
        }
      ]
    };
  };

  const getPurityStatus = (purity: number) => {
    if (purity >= 99.9) return { color: 'success', text: '优' };
    if (purity >= 99.5) return { color: 'processing', text: '良' };
    if (purity >= 99) return { color: 'warning', text: '中' };
    return { color: 'error', text: '差' };
  };

  const columns = [
    {
      title: '工厂名称',
      dataIndex: 'factoryName',
      key: 'factoryName',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Factory className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '电解槽电流(A)',
      dataIndex: 'electrolyzerCurrent',
      key: 'electrolyzerCurrent',
      render: (value: number) => (
        <span className="font-mono font-semibold text-blue-600">{value}</span>
      )
    },
    {
      title: '电解槽电压(V)',
      dataIndex: 'electrolyzerVoltage',
      key: 'electrolyzerVoltage',
      render: (value: number) => (
        <span className="font-mono font-semibold text-purple-600">{value.toFixed(1)}</span>
      )
    },
    {
      title: '氢气产量(kg/h)',
      dataIndex: 'hydrogenProduction',
      key: 'hydrogenProduction',
      render: (value: number) => (
        <span className="font-mono font-semibold text-green-600">{value.toFixed(2)}</span>
      )
    },
    {
      title: '氢气纯度(%)',
      dataIndex: 'hydrogenPurity',
      key: 'hydrogenPurity',
      render: (value: number) => {
        const status = getPurityStatus(value);
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{value.toFixed(3)}</span>
            <Tag color={status.color}>{status.text}</Tag>
          </div>
        );
      }
    },
    {
      title: '温度(°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (value: number) => (
        <span className={`font-mono font-semibold ${value > 85 ? 'text-red-600' : value > 75 ? 'text-orange-600' : 'text-gray-700'}`}>
          {value.toFixed(1)}
        </span>
      )
    },
    {
      title: '压力(MPa)',
      dataIndex: 'pressure',
      key: 'pressure',
      render: (value: number) => (
        <span className="font-mono font-semibold text-gray-700">{value.toFixed(2)}</span>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: Date) => (
        <span className="text-gray-500 text-sm">{dayjs(time).format('HH:mm:ss')}</span>
      )
    }
  ];

  if (loading && !data.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">制氢监测</h1>
          <p className="text-gray-500 mt-1">
            数据更新时间：{dayjs().format('YYYY-MM-DD HH:mm:ss')}
          </p>
        </div>
        <Button
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchData}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="今日总产量"
          value={stats?.production.total.toLocaleString() || '0'}
          unit="kg"
          icon={Droplets}
          trend={5.2}
          trendLabel="较昨日"
          color="blue"
        />
        <StatCard
          title="平均纯度"
          value={stats?.production.purity.toFixed(3) || '0'}
          unit="%"
          icon={Percent}
          color="green"
        />
        <StatCard
          title="平均电流"
          value={data.length ? (data.reduce((sum, d) => sum + d.electrolyzerCurrent, 0) / data.length).toFixed(0) : '0'}
          unit="A"
          icon={Zap}
          color="orange"
        />
        <StatCard
          title="平均电压"
          value={data.length ? (data.reduce((sum, d) => sum + d.electrolyzerVoltage, 0) / data.length).toFixed(1) : '0'}
          unit="V"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="平均温度"
          value={data.length ? (data.reduce((sum, d) => sum + d.temperature, 0) / data.length).toFixed(1) : '0'}
          unit="°C"
          icon={Thermometer}
          color="red"
        />
        <StatCard
          title="平均压力"
          value={data.length ? (data.reduce((sum, d) => sum + d.pressure, 0) / data.length).toFixed(2) : '0'}
          unit="MPa"
          icon={Gauge}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">24小时产量与纯度趋势</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getTrendChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">电解槽电流分布</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getEfficiencyChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">实时制氢数据</span>
          </div>
        }
        extra={
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            实时更新中
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange
          }}
        />
      </Card>
    </div>
  );
}
