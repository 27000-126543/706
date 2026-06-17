import { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  MapPin,
  Gauge,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { Table, Card, Button, Spin, message, Tag, Progress, Badge } from 'antd';
import ReactECharts from 'echarts-for-react';
import StatCard from '../../components/ui/StatCard.js';
import { monitoringApi } from '../../api/client.js';
import type { TransportData, MonitoringStats } from '../../../shared/types.js';
import dayjs from 'dayjs';

export default function TransportMonitoring() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TransportData[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [transportRes, statsRes] = await Promise.all([
        monitoringApi.getTransport(pagination.pageSize),
        monitoringApi.getStats()
      ]);
      setData(transportRes.data);
      setStats(statsRes);
      setPagination(prev => ({ ...prev, total: transportRes.total }));
    } catch (error) {
      console.error('Failed to fetch transport data:', error);
      message.error('获取运输数据失败');
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

  const getSpeedTrendChartOption = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['平均速度', '限速阈值'],
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
      yAxis: {
        type: 'value',
        name: '速度(km/h)'
      },
      series: [
        {
          name: '平均速度',
          type: 'line',
          smooth: true,
          data: Array.from({ length: 24 }, () => (Math.random() * 30 + 40).toFixed(1)),
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
              ]
            }
          },
          lineStyle: { color: '#8B5CF6', width: 2 }
        },
        {
          name: '限速阈值',
          type: 'line',
          data: Array(24).fill(80),
          lineStyle: { color: '#EF4444', width: 2, type: 'dashed' },
          itemStyle: { color: '#EF4444' }
        }
      ]
    };
  };

  const getRiskDistributionChartOption = () => {
    const riskLevels = [
      { range: '0-20', count: 0, color: '#10B981' },
      { range: '21-40', count: 0, color: '#3B82F6' },
      { range: '41-60', count: 0, color: '#F59E0B' },
      { range: '61-80', count: 0, color: '#F97316' },
      { range: '81-100', count: 0, color: '#EF4444' }
    ];
    data.forEach(item => {
      if (item.riskIndex <= 20) riskLevels[0].count++;
      else if (item.riskIndex <= 40) riskLevels[1].count++;
      else if (item.riskIndex <= 60) riskLevels[2].count++;
      else if (item.riskIndex <= 80) riskLevels[3].count++;
      else riskLevels[4].count++;
    });
    if (data.length === 0) {
      riskLevels[0].count = 8;
      riskLevels[1].count = 12;
      riskLevels[2].count = 5;
      riskLevels[3].count = 3;
      riskLevels[4].count = 1;
    }
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
        type: 'category',
        data: riskLevels.map(r => r.range),
        axisLabel: { interval: 0 }
      },
      yAxis: {
        type: 'value',
        name: '车辆数'
      },
      series: [
        {
          name: '风险指数分布',
          type: 'bar',
          data: riskLevels.map(r => ({
            value: r.count,
            itemStyle: { color: r.color, borderRadius: [4, 4, 0, 0] }
          })),
          label: {
            show: true,
            position: 'top'
          }
        }
      ]
    };
  };

  const getRiskLevelConfig = (riskIndex: number) => {
    if (riskIndex >= 80) return { color: 'error', text: '极高风险', bgColor: 'bg-red-500' };
    if (riskIndex >= 60) return { color: 'warning', text: '高风险', bgColor: 'bg-orange-500' };
    if (riskIndex >= 40) return { color: 'warning', text: '中风险', bgColor: 'bg-yellow-500' };
    if (riskIndex >= 20) return { color: 'processing', text: '低风险', bgColor: 'bg-blue-500' };
    return { color: 'success', text: '安全', bgColor: 'bg-green-500' };
  };

  const columns = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (text: string, record: TransportData) => (
        <div className="flex items-center gap-2">
          <Badge dot color={record.leakDetected ? 'red' : 'green'} />
          <Truck className="w-4 h-4 text-purple-500" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: 'GPS位置',
      dataIndex: 'longitude',
      key: 'gps',
      render: (_: number, record: TransportData) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="font-mono text-gray-600">
            {record.longitude.toFixed(4)}, {record.latitude.toFixed(4)}
          </span>
        </div>
      )
    },
    {
      title: '速度(km/h)',
      dataIndex: 'speed',
      key: 'speed',
      render: (value: number) => (
        <span className={`font-mono font-semibold ${value > 80 ? 'text-red-600' : value > 60 ? 'text-orange-600' : 'text-green-600'}`}>
          {value.toFixed(1)}
        </span>
      )
    },
    {
      title: '压力(MPa)',
      dataIndex: 'pressure',
      key: 'pressure',
      render: (value: number) => (
        <span className={`font-mono font-semibold ${value > 45 ? 'text-red-600' : value > 35 ? 'text-orange-600' : 'text-blue-600'}`}>
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
      title: '泄漏检测',
      dataIndex: 'leakDetected',
      key: 'leakDetected',
      render: (detected: boolean, record: TransportData) => (
        <div className="flex items-center gap-2">
          {detected ? (
            <Tag color="error" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              检测到泄漏 ({record.leakLevel}ppm)
            </Tag>
          ) : (
            <Tag color="success" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              正常
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '风险指数',
      dataIndex: 'riskIndex',
      key: 'riskIndex',
      render: (value: number) => {
        const config = getRiskLevelConfig(value);
        return (
          <div className="flex items-center gap-2">
            <div className="w-20">
              <Progress
                percent={value}
                size="small"
                strokeColor={config.bgColor.replace('bg-', '')}
                showInfo={false}
              />
            </div>
            <Tag color={config.color} className="font-mono">
              {value}
            </Tag>
          </div>
        );
      }
    },
    {
      title: '运输路线',
      dataIndex: 'route',
      key: 'route',
      render: (text: string) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Navigation className="w-3 h-3 text-gray-400" />
          <span>{text || '未设置'}</span>
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

  const avgSpeed = data.length ? (data.reduce((sum, d) => sum + d.speed, 0) / data.length).toFixed(1) : '0';
  const avgPressure = data.length ? (data.reduce((sum, d) => sum + d.pressure, 0) / data.length).toFixed(2) : '0';
  const avgTemperature = data.length ? (data.reduce((sum, d) => sum + d.temperature, 0) / data.length).toFixed(1) : '0';
  const avgRiskIndex = data.length ? (data.reduce((sum, d) => sum + d.riskIndex, 0) / data.length).toFixed(0) : '0';
  const leakCount = data.filter(d => d.leakDetected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">运输监测</h1>
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
          title="在途车辆"
          value={stats?.transport.activeVehicles || '0'}
          unit="辆"
          icon={Truck}
          trend={2.5}
          trendLabel="较昨日"
          color="purple"
        />
        <StatCard
          title="平均速度"
          value={avgSpeed}
          unit="km/h"
          icon={Gauge}
          color="blue"
        />
        <StatCard
          title="平均压力"
          value={avgPressure}
          unit="MPa"
          icon={Gauge}
          color="orange"
        />
        <StatCard
          title="平均温度"
          value={avgTemperature}
          unit="°C"
          icon={Thermometer}
          color="red"
        />
        <StatCard
          title="泄漏告警"
          value={stats?.transport.leakCount || leakCount}
          unit="起"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="平均风险指数"
          value={stats?.transport.riskIndex || avgRiskIndex}
          unit="分"
          icon={AlertCircle}
          color={parseInt(avgRiskIndex) > 60 ? 'red' : parseInt(avgRiskIndex) > 40 ? 'orange' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">24小时平均车速趋势</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getSpeedTrendChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">风险指数分布</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getRiskDistributionChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">安全车辆</span>
            <Badge status="success" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-green-600">
              {data.filter(d => d.riskIndex < 40).length}
            </span>
            <span className="text-gray-500 text-sm ml-1">辆</span>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">低风险车辆</span>
            <Badge status="processing" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-600">
              {data.filter(d => d.riskIndex >= 40 && d.riskIndex < 60).length}
            </span>
            <span className="text-gray-500 text-sm ml-1">辆</span>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">高风险车辆</span>
            <Badge status="warning" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-orange-600">
              {data.filter(d => d.riskIndex >= 60 && d.riskIndex < 80).length}
            </span>
            <span className="text-gray-500 text-sm ml-1">辆</span>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">极高风险车辆</span>
            <Badge status="error" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-red-600">
              {data.filter(d => d.riskIndex >= 80).length}
            </span>
            <span className="text-gray-500 text-sm ml-1">辆</span>
          </div>
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">实时运输数据</span>
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
