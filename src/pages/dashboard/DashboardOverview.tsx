import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  Database,
  Truck,
  Fuel,
  AlertTriangle,
  Shield,
  RefreshCw,
  ChevronRight,
  MapPin,
  Activity,
  TrendingUp
} from 'lucide-react';
import { Tabs, Card, Table, Tag, Button, Spin, message } from 'antd';
import ReactECharts from 'echarts-for-react';
import StatCard from '../../components/ui/StatCard.js';
import ChinaMapChart from '../../components/charts/ChinaMapChart.js';
import { dashboardApi } from '../../api/client.js';
import type { DashboardOverviewResponse, RiskRankingItem } from '../../../shared/types.js';
import dayjs from 'dayjs';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState('production');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const overviewData = await dashboardApi.getOverview();
      setData(overviewData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      message.error('获取看板数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceClick = (code: string, name: string) => {
    navigate(`/dashboard/province/${code}`, { state: { provinceName: name } });
  };

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'success',
      medium: 'warning',
      high: 'orange',
      critical: 'error'
    };
    return colors[level] || 'default';
  };

  const getRiskLevelText = (level: string) => {
    const texts: Record<string, string> = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    };
    return texts[level] || '未知';
  };

  const riskColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <span className={`font-bold ${index < 3 ? 'text-red-500' : 'text-gray-600'}`}>
          {index + 1}
        </span>
      )
    },
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '风险指数',
      dataIndex: 'riskIndex',
      key: 'riskIndex',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                value >= 80 ? 'bg-red-500' : value >= 60 ? 'bg-orange-500' : value >= 40 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="font-mono font-bold text-sm">{value}</span>
        </div>
      )
    },
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={getRiskLevelColor(level)} className="font-medium">
          {getRiskLevelText(level)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: RiskRankingItem) => (
        <Button
          type="link"
          size="small"
          icon={<ChevronRight className="w-4 h-4" />}
          onClick={() => handleProvinceClick(record.code, record.province)}
        >
          查看详情
        </Button>
      )
    }
  ];

  const getTrendChartOption = () => {
    if (!data) return {};
    const days = Array.from({ length: 7 }, (_, i) =>
      dayjs().subtract(6 - i, 'day').format('MM-DD')
    );
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['产量', '预警数量'],
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
        boundaryGap: false
      },
      yAxis: [
        {
          type: 'value',
          name: '产量(吨)'
        },
        {
          type: 'value',
          name: '预警数'
        }
      ],
      series: [
        {
          name: '产量',
          type: 'line',
          smooth: true,
          data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 7000 + 18000)),
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
          name: '预警数量',
          type: 'bar',
          yAxisIndex: 1,
          data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 8 + 2)),
          itemStyle: { color: '#F97316', borderRadius: [4, 4, 0, 0] }
        }
      ]
    };
  };

  const getSafetyScoreGauge = () => {
    if (!data) return {};
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.6, '#EF4444'],
                [0.8, '#F59E0B'],
                [1, '#10B981']
              ]
            }
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '60%',
            width: 12,
            itemStyle: { color: '#374151' }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '10%'],
            fontSize: 32,
            fontWeight: 'bold',
            formatter: '{value}',
            color: data.safetyScore >= 80 ? '#10B981' : data.safetyScore >= 60 ? '#F59E0B' : '#EF4444'
          },
          data: [{ value: data.safetyScore }]
        }
      ]
    };
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
          <h1 className="text-2xl font-bold text-gray-900">全国氢能产业总览</h1>
          <p className="text-gray-500 mt-1">
            数据更新时间：{dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
          </p>
        </div>
        <Button
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchData}
        >
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="今日产量"
          value={data.totalProduction.toLocaleString()}
          unit="吨"
          icon={Factory}
          trend={8.5}
          trendLabel="较昨日"
          color="blue"
        />
        <StatCard
          title="储氢总量"
          value={data.totalStorage.toLocaleString()}
          unit="吨"
          icon={Database}
          trend={2.3}
          trendLabel="较昨日"
          color="green"
        />
        <StatCard
          title="在途运输"
          value={data.totalTransport}
          unit="车"
          icon={Truck}
          trend={-1.2}
          trendLabel="较昨日"
          color="purple"
        />
        <StatCard
          title="今日加注"
          value={data.totalRefueling.toLocaleString()}
          unit="吨"
          icon={Fuel}
          trend={5.7}
          trendLabel="较昨日"
          color="orange"
        />
        <StatCard
          title="活跃预警"
          value={data.activeAlerts.level1 + data.activeAlerts.level2}
          unit="条"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="综合安全评分"
          value={data.safetyScore}
          unit="分"
          icon={Shield}
          color="green"
        />
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          { key: 'production', label: '产量分布' },
          { key: 'risk', label: '风险分布' }
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card
          className="xl:col-span-2"
          title={
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">
                {activeTab === 'production' ? '全国氢能产量热力图' : '全国安全风险分布图'}
              </span>
            </div>
          }
          extra={
            <span className="text-sm text-gray-500">点击省份可下钻查看详情</span>
          }
        >
          {activeTab === 'production' ? (
            <ChinaMapChart
              data={data.provinceProduction.map(p => ({
                name: p.province.replace('省', '').replace('市', '').replace('自治区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', ''),
                value: p.value,
                code: p.code
              }))}
              onProvinceClick={handleProvinceClick}
              height={480}
              colorRange={['#E0F2FE', '#0369A1']}
            />
          ) : (
            <ChinaMapChart
              data={data.riskRanking.map(r => ({
                name: r.province.replace('省', '').replace('市', '').replace('自治区', '').replace('壮族', '').replace('回族', '').replace('维吾尔', ''),
                value: r.riskIndex,
                code: r.code
              }))}
              onProvinceClick={handleProvinceClick}
              height={480}
              colorRange={['#DCFCE7', '#DC2626']}
            />
          )}
        </Card>

        <div className="space-y-6">
          <Card
            title={
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-semibold">综合安全评分</span>
              </div>
            }
          >
            <div style={{ height: 200 }}>
              <ReactECharts option={getSafetyScoreGauge()} style={{ height: '100%' }} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{data.activeAlerts.level2}</p>
                <p className="text-xs text-gray-500">二级预警</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{data.activeAlerts.level1}</p>
                <p className="text-xs text-gray-500">一级预警</p>
              </div>
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">近7天趋势</span>
              </div>
            }
          >
            <div style={{ height: 220 }}>
              <ReactECharts option={getTrendChartOption()} style={{ height: '100%' }} />
            </div>
          </Card>
        </div>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">安全风险排名 TOP10</span>
          </div>
        }
      >
        <Table
          columns={riskColumns}
          dataSource={data.riskRanking}
          rowKey="code"
          pagination={false}
        />
      </Card>
    </div>
  );
}
