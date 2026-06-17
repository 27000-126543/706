import { useState, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Database,
  Gauge,
  Thermometer,
  Droplets,
  Shield,
  RefreshCw,
  Factory,
  AlertTriangle
} from 'lucide-react';
import { Table, Card, Button, Spin, message, Tag, Progress } from 'antd';
import ReactECharts from 'echarts-for-react';
import StatCard from '../../components/ui/StatCard.js';
import { monitoringApi } from '../../api/client.js';
import type { StorageTankData, MonitoringStats } from '../../../shared/types.js';
import dayjs from 'dayjs';

export default function StorageMonitoring() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StorageTankData[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [storageRes, statsRes] = await Promise.all([
        monitoringApi.getStorage(pagination.pageSize),
        monitoringApi.getStats()
      ]);
      setData(storageRes.data);
      setStats(statsRes);
      setPagination(prev => ({ ...prev, total: storageRes.total }));
    } catch (error) {
      console.error('Failed to fetch storage data:', error);
      message.error('获取储氢数据失败');
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

  const getPressureTrendChartOption = () => {
    const hours = Array.from({ length: 12 }, (_, i) => `${i * 2}h`);
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['平均压力', '设计压力阈值'],
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
        name: '压力(MPa)'
      },
      series: [
        {
          name: '平均压力',
          type: 'line',
          smooth: true,
          data: Array.from({ length: 12 }, () => (Math.random() * 5 + 30).toFixed(2)),
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
              ]
            }
          },
          lineStyle: { color: '#10B981', width: 2 }
        },
        {
          name: '设计压力阈值',
          type: 'line',
          data: Array(12).fill(45),
          lineStyle: { color: '#EF4444', width: 2, type: 'dashed' },
          itemStyle: { color: '#EF4444' }
        }
      ]
    };
  };

  const getHealthDistributionChartOption = () => {
    const healthCount = { excellent: 0, good: 0, warning: 0, danger: 0 };
    data.forEach(item => {
      if (healthCount[item.healthStatus] !== undefined) {
        healthCount[item.healthStatus]++;
      }
    });
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}个 ({d}%)'
      },
      legend: {
        bottom: '0',
        left: 'center'
      },
      series: [
        {
          name: '健康状态分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '40%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{c}个'
          },
          data: [
            { value: healthCount.excellent || 12, name: '优秀', itemStyle: { color: '#10B981' } },
            { value: healthCount.good || 8, name: '良好', itemStyle: { color: '#3B82F6' } },
            { value: healthCount.warning || 3, name: '警告', itemStyle: { color: '#F59E0B' } },
            { value: healthCount.danger || 1, name: '危险', itemStyle: { color: '#EF4444' } }
          ]
        }
      ]
    };
  };

  const getHealthStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; text: string; icon: LucideIcon }> = {
      excellent: { color: 'success', text: '优秀', icon: Shield },
      good: { color: 'processing', text: '良好', icon: Shield },
      warning: { color: 'warning', text: '警告', icon: AlertTriangle },
      danger: { color: 'error', text: '危险', icon: AlertTriangle }
    };
    return configs[status] || configs.good;
  };

  const columns = [
    {
      title: '储罐名称',
      dataIndex: 'tankName',
      key: 'tankName',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-green-500" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '所属工厂',
      dataIndex: 'factoryName',
      key: 'factoryName',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Factory className="w-4 h-4 text-blue-500" />
          <span>{text}</span>
        </div>
      )
    },
    {
      title: '当前压力(MPa)',
      dataIndex: 'pressure',
      key: 'pressure',
      render: (value: number, record: StorageTankData) => {
        const ratio = (value / record.designPressure) * 100;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-semibold ${ratio > 90 ? 'text-red-600' : ratio > 75 ? 'text-orange-600' : 'text-green-600'}`}>
              {value.toFixed(2)}
            </span>
            <span className="text-gray-400 text-sm">/ {record.designPressure}</span>
          </div>
        );
      }
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
      title: '湿度(%)',
      dataIndex: 'humidity',
      key: 'humidity',
      render: (value: number) => (
        <span className="font-mono font-semibold text-blue-600">{value.toFixed(1)}</span>
      )
    },
    {
      title: '液位(%)',
      dataIndex: 'level',
      key: 'level',
      render: (value: number) => (
        <div className="w-32">
          <Progress
            percent={value}
            size="small"
            status={value > 90 ? 'exception' : value > 75 ? 'normal' : 'active'}
            strokeColor={{
              '0%': '#10B981',
              '100%': value > 90 ? '#EF4444' : '#3B82F6'
            }}
          />
        </div>
      )
    },
    {
      title: '安全系数',
      dataIndex: 'safetyFactor',
      key: 'safetyFactor',
      render: (value: number) => (
        <span className={`font-mono font-semibold ${value < 1.2 ? 'text-red-600' : value < 1.5 ? 'text-orange-600' : 'text-green-600'}`}>
          {value.toFixed(2)}
        </span>
      )
    },
    {
      title: '健康状态',
      dataIndex: 'healthStatus',
      key: 'healthStatus',
      render: (status: string) => {
        const config = getHealthStatusConfig(status);
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
  const avgHumidity = data.length ? (data.reduce((sum, d) => sum + d.humidity, 0) / data.length).toFixed(1) : '0';
  const avgLevel = data.length ? (data.reduce((sum, d) => sum + d.level, 0) / data.length).toFixed(1) : '0';
  const avgSafetyFactor = data.length ? (data.reduce((sum, d) => sum + d.safetyFactor, 0) / data.length).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">储氢监测</h1>
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
          title="总容量"
          value={stats?.storage.totalCapacity.toLocaleString() || '0'}
          unit="吨"
          icon={Database}
          color="green"
        />
        <StatCard
          title="已用容量"
          value={stats?.storage.usedCapacity.toLocaleString() || '0'}
          unit="吨"
          icon={Droplets}
          trend={3.1}
          trendLabel="较昨日"
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
          title="平均湿度"
          value={avgHumidity}
          unit="%"
          icon={Droplets}
          color="purple"
        />
        <StatCard
          title="安全评分"
          value={stats?.storage.safetyScore || '0'}
          unit="分"
          icon={Shield}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card
          className="xl:col-span-2"
          title={
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-green-500" />
              <span className="font-semibold">12小时压力趋势</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getPressureTrendChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">健康状态分布</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getHealthDistributionChartOption()} style={{ height: '100%' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">平均液位</span>
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <Progress
            percent={parseFloat(avgLevel)}
            strokeColor={{
              '0%': '#10B981',
              '100%': '#3B82F6'
            }}
            className="mt-3"
          />
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">平均安全系数</span>
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-green-600">{avgSafetyFactor}</span>
            <span className="text-gray-500 text-sm ml-1">倍</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">安全阈值: 1.5倍</div>
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">储罐总数</span>
            <Database className="w-5 h-5 text-purple-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-600">{pagination.total}</span>
            <span className="text-gray-500 text-sm ml-1">个</span>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">异常储罐</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-red-600">
              {data.filter(d => d.healthStatus === 'warning' || d.healthStatus === 'danger').length}
            </span>
            <span className="text-gray-500 text-sm ml-1">个</span>
          </div>
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-500" />
            <span className="font-semibold">实时储氢数据</span>
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
