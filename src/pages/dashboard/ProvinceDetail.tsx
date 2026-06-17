import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Factory,
  Database,
  Fuel,
  TrendingUp,
  Shield,
  RefreshCw,
  MapPin
} from 'lucide-react';
import { Card, Table, Tag, Button, Spin, message, Progress } from 'antd';
import ReactECharts from 'echarts-for-react';
import StatCard from '../../components/ui/StatCard.js';
import { dashboardApi } from '../../api/client.js';
import type { ProvinceDetailResponse, Factory } from '../../../shared/types.js';

interface LocationState {
  provinceName?: string;
}

export default function ProvinceDetail() {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const provinceName = (location.state as LocationState)?.provinceName || code;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProvinceDetailResponse | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const detailData = await dashboardApi.getProvinceDetail(code!);
      setData(detailData);
    } catch (error) {
      console.error('Failed to fetch province detail:', error);
      message.error('获取省份详情失败');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      fetchData();
    }
  }, [code, fetchData]);

  const getProductionTrendOption = () => {
    if (!data) return {};
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
        data: data.productionTrend.map(item => item.date),
        boundaryGap: false
      },
      yAxis: [
        {
          type: 'value',
          name: '产量(吨)',
          position: 'left'
        },
        {
          type: 'value',
          name: '纯度(%)',
          position: 'right',
          min: 95,
          max: 100
        }
      ],
      series: [
        {
          name: '产量',
          type: 'line',
          smooth: true,
          data: data.productionTrend.map(item => item.production),
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
          smooth: true,
          yAxisIndex: 1,
          data: data.productionTrend.map(item => item.purity),
          lineStyle: { color: '#10B981', width: 2 },
          itemStyle: { color: '#10B981' }
        }
      ]
    };
  };

  const getStorageHealthOption = () => {
    if (!data) return {};
    const colorMap: Record<string, string> = {
      excellent: '#10B981',
      good: '#3B82F6',
      warning: '#F59E0B',
      danger: '#EF4444'
    };
    const textMap: Record<string, string> = {
      excellent: '优秀',
      good: '良好',
      warning: '警告',
      danger: '危险'
    };
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}个 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        formatter: (name: string) => textMap[name] || name
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
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
              fontSize: 16,
              fontWeight: 'bold',
              formatter: (params: { name: string; value: number }) => `${textMap[params.name]}\n${params.value}个`
            }
          },
          labelLine: {
            show: false
          },
          data: data.storageHealth.map(item => ({
            value: item.count,
            name: item.level,
            itemStyle: { color: colorMap[item.level] }
          }))
        }
      ]
    };
  };

  const getRefuelingStatOption = () => {
    if (!data) return {};
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
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
        data: data.refuelingStats.map(item => item.station),
        axisLabel: {
          rotate: 30,
          interval: 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '日均加注量(吨)',
          position: 'left'
        },
        {
          type: 'value',
          name: '利用率(%)',
          position: 'right',
          max: 100
        }
      ],
      series: [
        {
          name: '日均加注量',
          type: 'bar',
          data: data.refuelingStats.map(item => item.dailyAmount),
          itemStyle: {
            color: '#3B82F6',
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '利用率',
          type: 'line',
          yAxisIndex: 1,
          data: data.refuelingStats.map(item => item.utilization),
          lineStyle: { color: '#F97316', width: 2 },
          itemStyle: { color: '#F97316' }
        }
      ]
    };
  };

  const factoryColumns = [
    {
      title: '工厂名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Factory className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => (
        <Tag color="blue">{text}</Tag>
      )
    },
    {
      title: '位置',
      dataIndex: 'city',
      key: 'city',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{text}</span>
        </div>
      )
    },
    {
      title: '日产量(吨)',
      dataIndex: 'dailyProduction',
      key: 'dailyProduction',
      render: (value: number) => (
        <span className="font-mono font-medium">{value.toLocaleString()}</span>
      )
    },
    {
      title: '安全评分',
      dataIndex: 'safetyScore',
      key: 'safetyScore',
      render: (value: number) => (
        <Progress
          percent={value}
          size="small"
          status={value >= 80 ? 'success' : value >= 60 ? 'normal' : 'exception'}
        />
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!data) return null;

  const totalProduction = data.productionTrend.reduce((sum, item) => sum + item.production, 0);
  const avgPurity = data.productionTrend.reduce((sum, item) => sum + item.purity, 0) / data.productionTrend.length;
  const totalTanks = data.storageHealth.reduce((sum, item) => sum + item.count, 0);
  const totalRefueling = data.refuelingStats.reduce((sum, item) => sum + item.dailyAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
          >
            返回总览
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{provinceName} - 氢能产业详情</h1>
            <p className="text-gray-500 mt-1">
              近7天数据分析
            </p>
          </div>
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
          title="7天总产量"
          value={totalProduction.toLocaleString()}
          unit="吨"
          icon={Factory}
          trend={5.2}
          trendLabel="较上周"
          color="blue"
        />
        <StatCard
          title="平均纯度"
          value={avgPurity.toFixed(2)}
          unit="%"
          icon={Shield}
          color="green"
        />
        <StatCard
          title="储氢罐总数"
          value={totalTanks}
          unit="个"
          icon={Database}
          color="purple"
        />
        <StatCard
          title="日均加注总量"
          value={totalRefueling.toFixed(1)}
          unit="吨"
          icon={Fuel}
          trend={3.8}
          trendLabel="较上周"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">近7天生产趋势</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getProductionTrendOption()} style={{ height: '100%' }} />
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <span className="font-semibold">储氢罐健康度分布</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getStorageHealthOption()} style={{ height: '100%' }} />
          </div>
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">加氢站日均加注量</span>
          </div>
        }
      >
        <div style={{ height: 350 }}>
          <ReactECharts option={getRefuelingStatOption()} style={{ height: '100%' }} />
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">工厂列表</span>
          </div>
        }
        extra={
          <span className="text-sm text-gray-500">共 {data.factories.length} 家工厂</span>
        }
      >
        <Table
          columns={factoryColumns}
          dataSource={data.factories}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 家工厂`
          }}
        />
      </Card>
    </div>
  );
}
