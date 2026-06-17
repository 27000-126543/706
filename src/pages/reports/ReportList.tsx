import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  Download,
  Plus,
  RefreshCw,
  ChevronRight,
  MapPin,
  Search
} from 'lucide-react';
import { Table, Card, Button, Spin, message, Input, Select, Space, Tag } from 'antd';
import StatCard from '../../components/ui/StatCard.js';
import { reportsApi } from '../../api/client.js';
import type { WeeklyReport } from '../../../shared/types.js';
import dayjs from 'dayjs';

export default function ReportList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [regionFilter, setRegionFilter] = useState<string | undefined>();
  const [yearFilter, setYearFilter] = useState<number | undefined>();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const result = await reportsApi.getReports({
          region: regionFilter,
          year: yearFilter
        });
        setReports(result.data);
        setTotal(result.total);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        message.error('获取报告列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [page, pageSize, regionFilter, yearFilter]);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const newReport = await reportsApi.generateReport();
      message.success('报告生成成功');
      setReports(prev => [newReport, ...prev]);
      setTotal(prev => prev + 1);
    } catch (error) {
      console.error('Failed to generate report:', error);
      message.error('生成报告失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (id: string, week: string) => {
    try {
      const blob = await reportsApi.downloadReport(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${week}.csv`;
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

  const handleViewDetail = (id: string) => {
    navigate(`/reports/${id}`);
  };

  const filteredReports = reports.filter(report =>
    report.week.includes(searchText) ||
    report.region.includes(searchText)
  );

  const columns = [
    {
      title: '周次',
      dataIndex: 'week',
      key: 'week',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{text}</span>
        </div>
      )
    },
    {
      title: '总产量',
      dataIndex: ['summary', 'totalProduction'],
      key: 'totalProduction',
      render: (value: number) => (
        <span className="font-mono">{value.toLocaleString()} 吨</span>
      )
    },
    {
      title: '预警数',
      dataIndex: ['summary', 'alertCount'],
      key: 'alertCount',
      render: (value: number) => (
        <Tag color={value > 20 ? 'red' : value > 10 ? 'orange' : 'green'}>
          {value} 条
        </Tag>
      )
    },
    {
      title: '设备故障率',
      dataIndex: ['summary', 'equipmentFailureRate'],
      key: 'equipmentFailureRate',
      render: (value: number) => (
        <span className={`font-mono ${value > 2 ? 'text-red-500' : 'text-green-500'}`}>
          {value}%
        </span>
      )
    },
    {
      title: '生成时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{dayjs(date).format('YYYY-MM-DD HH:mm')}</span>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: WeeklyReport) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Download className="w-4 h-4" />}
            onClick={() => handleDownloadReport(record.id, record.week)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ];

  const stats = {
    total: total,
    thisWeek: reports.filter(r => {
      const reportDate = dayjs(r.createdAt);
      const startOfWeek = dayjs().startOf('week');
      return reportDate.isAfter(startOfWeek);
    }).length,
    pendingReview: reports.filter(r => {
      const daysSinceCreated = dayjs().diff(dayjs(r.createdAt), 'day');
      return daysSinceCreated < 7;
    }).length
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">安全诊断报告列表</h1>
          <p className="text-gray-500 mt-1">查看和管理全产业链安全诊断周报</p>
        </div>
        <Space>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchReports}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            loading={generating}
            onClick={handleGenerateReport}
          >
            生成报告
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="报告总数"
          value={stats.total}
          unit="份"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="本周报告"
          value={stats.thisWeek}
          unit="份"
          icon={Calendar}
          color="green"
          trend={stats.thisWeek > 0 ? 100 : 0}
          trendLabel="较上周"
        />
        <StatCard
          title="待审阅报告"
          value={stats.pendingReview}
          unit="份"
          icon={Clock}
          color="orange"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Space size="middle">
            <Input
              placeholder="搜索周次或区域"
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="选择区域"
              value={regionFilter}
              onChange={setRegionFilter}
              style={{ width: 160 }}
              allowClear
              options={[
                { value: '全国', label: '全国' },
                { value: '华北', label: '华北' },
                { value: '华东', label: '华东' },
                { value: '华南', label: '华南' },
                { value: '西北', label: '西北' }
              ]}
            />
            <Select
              placeholder="选择年份"
              value={yearFilter}
              onChange={setYearFilter}
              style={{ width: 120 }}
              allowClear
              options={[
                { value: 2026, label: '2026年' },
                { value: 2025, label: '2025年' },
                { value: 2024, label: '2024年' }
              ]}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: filteredReports.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Card>
    </div>
  );
}
