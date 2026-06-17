import { useState, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Fuel,
  Gauge,
  Thermometer,
  TrendingUp,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Table, Card, Button, Spin, message, Tag, Progress } from 'antd';
import ReactECharts from 'echarts-for-react';
import StatCard from '../../components/ui/StatCard.js';
import { monitoringApi } from '../../api/client.js';
import type { RefuelingData, MonitoringStats } from '../../../shared/types.js';
import dayjs from 'dayjs';

export default function RefuelingMonitoring() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RefuelingData[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [refuelingRes, statsRes] = await Promise.all([
        monitoringApi.getRefueling(pagination.pageSize),
        monitoringApi.getStats()
      ]);
      setData(refuelingRes.data);
      setStats(statsRes);
      setPagination(prev => ({ ...prev, total: refuelingRes.total }));
    } catch (error) {
      console.error('Failed to fetch refueling data:', error);
      message.error('获取加注数据失败');
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

  const getRefuelingTrendChartOption = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['加注量', '利用率'],
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
          name: '加注量(kg)'
        },
        {
          type: 'value',
          name: '利用率(%)',
          min: 0,
          max: 100
        }
      ],
      series: [
        {
          name: '加注量',
          type: 'bar',
          data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 200 + 50)),
          itemStyle: { color: '#F97316', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '利用率',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: Array.from({ length: 24 }, () => (Math.random() * 40 + 40).toFixed(1)),
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' }
              ]
            }
          }
        }
      ]
    };
  };

  const getUtilizationRankingChartOption = () => {
    const sortedData = [...data].sort((a, b) => b.utilizationRate - a.utilizationRate).slice(0, 8);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '利用率(%)',
        max: 100
      },
      yAxis: {
        type: 'category',
        data: sortedData.length ? sortedData.map(d => d.stationName) : ['加氢站A', '加氢站B', '加氢站C', '加氢站D', '加氢站E'],
        axisLabel: { interval: 0, width: 80, overflow: 'truncate' }
      },
      series: [
        {
          name: '利用率',
          type: 'bar',
          data: sortedData.length
            ? sortedData.map(d => ({
                value: d.utilizationRate,
                itemStyle: {
                  color: d.utilizationRate > 80 ? '#10B981' : d.utilizationRate > 60 ? '#3B82F6' : d.utilizationRate > 40 ? '#F59E0B' : '#EF4444',
                  borderRadius: [0, 4, 4, 0]
                }
              }))
            : [
                { value: 85, itemStyle: { color: '#10B981', borderRadius: [0, 4, 4, 0] } },
                { value: 72, itemStyle: { color: '#3B82F6', borderRadius: [0, 4, 4, 0] } },
                { value: 65, itemStyle: { color: '#3B82F6', borderRadius: [0, 4, 4, 0] } },
                { value: 48, itemStyle: { color: '#F59E0B', borderRadius: [0, 4, 4, 0] } },
                { value: 35, itemStyle: { color: '#EF4444', borderRadius: [0, 4, 4, 0] } }
              ],
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%'
          }
        }
      ]
    };
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; text: string; icon: LucideIcon }> = {
      normal: { color: 'success', text: '正常', icon: CheckCircle },
      warning: { color: 'warning', text: '警告', icon: AlertCircle },
      fault: { color: 'error', text: '故障', icon: AlertCircle }
    };
    return configs[status] || configs.normal;
  };

  const columns = [
    {
      title: '加氢站名称',
      dataIndex: 'stationName',
      key: 'stationName',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-orange-500" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '加氢机状态',
      dataIndex: 'dispenserStatus',
      key: 'dispenserStatus',
      render: (status: string) => {
        const config = getStatusConfig(status);
        const IconComponent = config.icon;
        return (
          <Tag color={config.color} className="flex items-center gap-1">
            <IconComponent className="w-3 h-3" />
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '累计加注量(kg)',
      dataIndex: 'totalDispensed',
      key: 'totalDispensed',
      render: (value: number) => (
        <span className="font-mono font-semibold text-blue-600">{value.toLocaleString()}</span>
      )
    },
    {
      title: '今日加注量(kg)',
      dataIndex: 'dailyDispensed',
      key: 'dailyDispensed',
      render: (value: number) => (
        <span className="font-mono font-semibold text-green-600">{value.toFixed(1)}</span>
      )
    },
    {
      title: '压力(MPa)',
      dataIndex: 'pressure',
      key: 'pressure',
      render: (value: number) => (
        <span className={`font-mono font-semibold ${value > 45 ? 'text-red-600' : value > 35 ? 'text-orange-600' : 'text-gray-700'}`}>
          {value.toFixed(2)}
        </span>
      )
    },
    {
      title: '温度(°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      render: (value: number) => (
        <span className={`font-mono font-semibold ${value > 50 ? 'text-red-600' : value > 40 ? 'text-orange-600' : 'text-gray-700'}`}>
          {value.toFixed(1)}
        </span>
      )
    },
    {
      title: '利用率',
      dataIndex: 'utilizationRate',
      key: 'utilizationRate',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-24">
            <Progress
              percent={value}
              size="small"
              strokeColor={value > 80 ? '#10B981' : value > 60 ? '#3B82F6' : value > 40 ? '#F59E0B' : '#EF4444'}
              showInfo={false}
            />
          </div>
          <span className="font-mono font-semibold text-sm">{value.toFixed(1)}%</span>
        </div>
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

  const avgPressure = data.length ? (data.reduce((sum, d) => sum + d.pressure, 0) / data.length).toFixed(2) : '0';
  const avgTemperature = data.length ? (data.reduce((sum, d) => sum + d.temperature, 0) / data.length).toFixed(1) : '0';
  const avgUtilization = data.length ? (data.reduce((sum, d) => sum + d.utilizationRate, 0) / data.length).toFixed(1) : '0';
  const totalDailyDispensed = data.reduce((sum, d) => sum + d.dailyDispensed, 0).toFixed(1);
  const normalCount = data.filter(d => d.dispenserStatus === 'normal').length;
  const warningCount = data.filter(d => d.dispenserStatus === 'warning').length;
  const faultCount = data.filter(d => d.dispenserStatus === 'fault').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">加注监测</h1>
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
          title="活跃加氢站"
          value={stats?.refueling.activeStations || '0'}
          unit="座"
          icon={Fuel}
          color="orange"
        />
        <StatCard
          title="今日加注总量"
          value={stats?.refueling.dailyAmount.toLocaleString() || totalDailyDispensed}
          unit="kg"
          icon={TrendingUp}
          trend={6.8}
          trendLabel="较昨日"
          color="green"
        />
        <StatCard
          title="平均利用率"
          value={stats?.refueling.utilizationRate.toFixed(1) || avgUtilization}
          unit="%"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="平均压力"
          value={avgPressure}
          unit="MPa"
          icon={Gauge}
          color="purple"
        />
        <StatCard
          title="平均温度"
          value={avgTemperature}
          unit="°C"
          icon={Thermometer}
          color="red"
        />
        <StatCard
          title="运行中设备"
          value={normalCount}
          unit="台"
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">24小时加注量与利用率趋势</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getRefuelingTrendChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="font-semibold">加氢站利用率排名 TOP8</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getUtilizationRankingChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">设备总数</span>
            <Fuel className="w-5 h-5 text-orange-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-orange-600">{pagination.total}</span>
            <span className="text-gray-500 text-sm ml-1">台</span>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">正常运行</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-green-600">{normalCount}</span>
            <span className="text-gray-500 text-sm ml-1">台</span>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">警告状态</span>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-yellow-600">{warningCount}</span>
            <span className="text-gray-500 text-sm ml-1">台</span>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">故障设备</span>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-red-600">{faultCount}</span>
            <span className="text-gray-500 text-sm ml-1">台</span>
          </div>
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">实时加注数据</span>
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
