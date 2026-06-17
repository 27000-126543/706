import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Factory,
  TrendingUp,
  AlertTriangle,
  Wrench,
  Lightbulb,
  Download,
  RefreshCw,
  Calendar,
  MapPin
} from 'lucide-react';
import { Card, Button, Spin, message, List, Tag, Space } from 'antd';
import ReactECharts from 'echarts-for-react';
import StatCard from '../../components/ui/StatCard.js';
import { reportsApi } from '../../api/client.js';
import type { WeeklyReport, OptimizationSuggestion } from '../../../shared/types.js';
import dayjs from 'dayjs';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await reportsApi.getReport(id);
        setReport(data);
      } catch (error) {
        console.error('Failed to fetch report:', error);
        message.error('获取报告详情失败');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  const handleDownload = async () => {
    if (!report) return;
    try {
      const blob = await reportsApi.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${report.week}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('报告下载成功');
    } catch (error) {
      console.error('Failed to download report:', error);
      message.error('下载报告失败');
    }
  };

  const getProductionTrendOption = () => {
    if (!report) return {};
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['日产量'],
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
        data: report.productionTrend.map(t => t.date),
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '产量(吨)'
      },
      series: [
        {
          name: '日产量',
          type: 'line',
          smooth: true,
          data: report.productionTrend.map(t => t.value),
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
          lineStyle: { color: '#3B82F6', width: 2 },
          itemStyle: { color: '#3B82F6' }
        }
      ]
    };
  };

  const getAccidentPieOption = () => {
    if (!report) return {};
    const colors = ['#EF4444', '#F97316', '#F59E0B', '#8B5CF6', '#10B981'];
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}起 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center'
      },
      series: [
        {
          name: '事故类型分布',
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
              fontSize: 18,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: report.accidentDistribution.map((d, i) => ({
            value: d.count,
            name: d.type,
            itemStyle: { color: colors[i % colors.length] }
          }))
        }
      ]
    };
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'red',
      medium: 'orange',
      low: 'green'
    };
    return colors[priority] || 'default';
  };

  const getPriorityText = (priority: string) => {
    const texts: Record<string, string> = {
      high: '高优先级',
      medium: '中优先级',
      low: '低优先级'
    };
    return texts[priority] || '未知';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-gray-500 mb-4">报告不存在或已被删除</p>
        <Button onClick={() => navigate('/reports')}>返回列表</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/reports')}
          >
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.week} 安全诊断报告</h1>
            <div className="flex items-center gap-4 mt-1 text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {report.region}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {dayjs(report.startDate).format('YYYY-MM-DD')} ~ {dayjs(report.endDate).format('YYYY-MM-DD')}
              </span>
            </div>
          </div>
        </div>
        <Space>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchReport}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
          >
            下载报告
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="产量同比"
          value={`${report.summary.productionYoY}%`}
          icon={TrendingUp}
          trend={report.summary.productionYoY}
          trendLabel="较去年同期"
          color="blue"
        />
        <StatCard
          title="产量环比"
          value={`${report.summary.productionMoM}%`}
          icon={TrendingUp}
          trend={report.summary.productionMoM}
          trendLabel="较上周"
          color={report.summary.productionMoM >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="预警数量"
          value={report.summary.alertCount}
          unit="条"
          icon={AlertTriangle}
          color="orange"
        />
        <StatCard
          title="设备故障率"
          value={`${report.summary.equipmentFailureRate}%`}
          icon={Wrench}
          color={report.summary.equipmentFailureRate > 2 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">本周产量趋势</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getProductionTrendOption()} style={{ height: '100%' }} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{report.summary.totalProduction.toLocaleString()}</p>
              <p className="text-xs text-gray-500">本周总产量(吨)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{report.summary.alertResolutionRate}%</p>
              <p className="text-xs text-gray-500">预警处置率</p>
            </div>
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">事故类型分布</span>
            </div>
          }
        >
          <div style={{ height: 300 }}>
            <ReactECharts option={getAccidentPieOption()} style={{ height: '100%' }} />
          </div>
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">优化建议</span>
          </div>
        }
      >
        <List
          dataSource={report.optimizationSuggestions}
          renderItem={(item: OptimizationSuggestion) => (
            <List.Item
              key={item.area + item.suggestion}
              className="flex items-start gap-4 py-4"
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                item.priority === 'high' ? 'bg-red-500' :
                item.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{item.area}</span>
                  <Tag color={getPriorityColor(item.priority)} size="small">
                    {getPriorityText(item.priority)}
                  </Tag>
                </div>
                <p className="text-gray-600">{item.suggestion}</p>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
