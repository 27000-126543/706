import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  TrendingUp,
  PieChart,
  Eye,
  Wrench,
  ArrowUp,
  Filter
} from 'lucide-react';
import { Table, Tag, Button, Spin, message, Card, Select, DatePicker, Form, Modal, Descriptions, Space } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import StatCard from '../../components/ui/StatCard.js';
import { alertsApi } from '../../api/client.js';
import type { Alert, AlertType, AlertLevel, AlertStatus } from '../../../shared/types.js';

const { RangePicker } = DatePicker;

interface FilterFormValues {
  level?: AlertLevel;
  status?: AlertStatus;
  province?: string;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
}

export default function AlertList() {
  const navigate = useNavigate();
  const location = useLocation();
  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [form] = Form.useForm();

  const [filters, setFilters] = useState({
    level: undefined as AlertLevel | undefined,
    status: undefined as AlertStatus | undefined,
    province: undefined as string | undefined,
    dateRange: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined
  });

  const [stats, setStats] = useState({
    level1: 0,
    level2: 0,
    pending: 0,
    resolved: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await alertsApi.getStats();
      setStats(statsData as typeof stats);
    } catch (error) {
      console.error('Failed to fetch alert stats:', error);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params: { level?: number; status?: string; province?: string } = {};
      if (filters.level) params.level = filters.level;
      if (filters.status) params.status = filters.status;
      if (filters.province) params.province = filters.province;
      
      const response = await alertsApi.getAlerts(params);
      setAlerts(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      message.error('获取预警列表失败');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAlerts();
    fetchStats();
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, [pagination.pageSize, filters, fetchAlerts, fetchStats]);

  useEffect(() => {
    if (initializedRef.current) {
      fetchAlerts();
      fetchStats();
    }
  }, [location.key]);

  const getAlertTypeText = (type: AlertType) => {
    const texts: Record<AlertType, string> = {
      storage_overpressure: '储氢超压',
      transport_leak: '运输泄漏',
      equipment_failure: '设备故障',
      other: '其他'
    };
    return texts[type] || '未知';
  };

  const getAlertLevelColor = (level: AlertLevel) => {
    return level === 2 ? 'error' : 'orange';
  };

  const getAlertLevelText = (level: AlertLevel) => {
    return level === 2 ? '二级预警' : '一级预警';
  };

  const getAlertStatusColor = (status: AlertStatus) => {
    const colors: Record<AlertStatus, string> = {
      pending: 'default',
      processing: 'processing',
      approved: 'blue',
      resolved: 'success',
      escalated: 'warning',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getAlertStatusText = (status: AlertStatus) => {
    const texts: Record<AlertStatus, string> = {
      pending: '待处理',
      processing: '处理中',
      approved: '已审批',
      resolved: '已解决',
      escalated: '已升级',
      rejected: '已驳回'
    };
    return texts[status] || '未知';
  };

  const handleViewDetail = (alert: Alert) => {
    setSelectedAlert(alert);
    setDetailModalVisible(true);
  };

  const handleProcess = async (alert: Alert) => {
    try {
      await alertsApi.resolveAlert(alert.id);
      message.success('处置成功');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Failed to process alert:', error);
      message.error('处置失败');
    }
  };

  const handleEscalate = async (alert: Alert) => {
    try {
      await alertsApi.escalateAlert(alert.id);
      await fetchAlerts();
      await fetchStats();
      navigate(`/alerts/approval/${alert.id}`);
    } catch (error) {
      console.error('Failed to escalate alert:', error);
      message.error('升级失败');
    }
  };

  const handleFilterSearch = (values: FilterFormValues) => {
    setFilters({
      level: values.level,
      status: values.status,
      province: values.province,
      dateRange: values.dateRange
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterReset = () => {
    form.resetFields();
    setFilters({
      level: undefined,
      status: undefined,
      province: undefined,
      dateRange: undefined
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const trendChartOption = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) =>
      dayjs().subtract(6 - i, 'day').format('MM-DD')
    );
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['一级预警', '二级预警'],
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
      yAxis: {
        type: 'value',
        name: '预警数'
      },
      series: [
        {
          name: '一级预警',
          type: 'line',
          smooth: true,
          data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 5 + 1)),
          itemStyle: { color: '#F97316' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(249, 115, 22, 0.3)' },
                { offset: 1, color: 'rgba(249, 115, 22, 0.05)' }
              ]
            }
          }
        },
        {
          name: '二级预警',
          type: 'line',
          smooth: true,
          data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 3)),
          itemStyle: { color: '#EF4444' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
              ]
            }
          }
        }
      ]
    };
  }, []);

  const pieChartOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center'
      },
      series: [
        {
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
            { value: Math.floor(Math.random() * 10 + 5), name: '储氢超压', itemStyle: { color: '#EF4444' } },
            { value: Math.floor(Math.random() * 8 + 3), name: '运输泄漏', itemStyle: { color: '#F97316' } },
            { value: Math.floor(Math.random() * 12 + 5), name: '设备故障', itemStyle: { color: '#3B82F6' } },
            { value: Math.floor(Math.random() * 5 + 1), name: '其他', itemStyle: { color: '#8B5CF6' } }
          ]
        }
      ]
    };
  }, []);

  const columns = [
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: AlertType) => (
        <span className="font-medium">{getAlertTypeText(type)}</span>
      )
    },
    {
      title: '预警级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: AlertLevel) => (
        <Tag color={getAlertLevelColor(level)} className="font-medium">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          {getAlertLevelText(level)}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AlertStatus) => (
        <Tag color={getAlertStatusColor(status)} className="font-medium">
          {getAlertStatusText(status)}
        </Tag>
      )
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{text}</span>
        </div>
      )
    },
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      render: (time: Date) => (
        <span className="text-gray-600">
          {dayjs(time).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Alert) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Wrench className="w-4 h-4" />}
            onClick={() => handleProcess(record)}
            disabled={record.status === 'resolved'}
          >
            处置
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ArrowUp className="w-4 h-4" />}
            onClick={() => handleEscalate(record)}
            disabled={record.status === 'resolved' || record.status === 'approved' || record.status === 'rejected'}
          >
            升级
          </Button>
        </Space>
      )
    }
  ];

  const provinces = [
    '北京市', '上海市', '广东省', '江苏省', '浙江省', '山东省',
    '河北省', '河南省', '湖北省', '四川省', '陕西省', '辽宁省'
  ];

  if (loading && alerts.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">预警中心</h1>
          <p className="text-gray-500 mt-1">管理和处置所有安全预警信息</p>
        </div>
        <Button
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={() => { fetchAlerts(); fetchStats(); }}
        >
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="一级预警"
          value={stats.level1}
          unit="条"
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          title="二级预警"
          value={stats.level2}
          unit="条"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="待处理"
          value={stats.pending}
          unit="条"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="已解决"
          value={stats.resolved}
          unit="条"
          icon={CheckCircle}
          color="green"
        />
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">筛选条件</span>
          </div>
        }
      >
        <Form
          form={form}
          layout="inline"
          onFinish={handleFilterSearch}
          className="flex flex-wrap gap-4"
        >
          <Form.Item name="level" label="预警级别">
            <Select
              placeholder="全部级别"
              allowClear
              style={{ width: 150 }}
              options={[
                { value: 1, label: '一级预警' },
                { value: 2, label: '二级预警' }
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 150 }}
              options={[
                { value: 'pending', label: '待处理' },
                { value: 'processing', label: '处理中' },
                { value: 'approved', label: '已审批' },
                { value: 'resolved', label: '已解决' },
                { value: 'escalated', label: '已升级' },
                { value: 'rejected', label: '已驳回' }
              ]}
            />
          </Form.Item>
          <Form.Item name="province" label="省份">
            <Select
              placeholder="全部省份"
              allowClear
              style={{ width: 150 }}
              options={provinces.map(p => ({ value: p, label: p }))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="时间范围">
            <RangePicker style={{ width: 280 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={handleFilterReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card
          className="xl:col-span-2"
          title={
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">预警列表</span>
            </div>
          }
          extra={<span className="text-sm text-gray-500">共 {total} 条记录</span>}
        >
          <Table
            columns={columns}
            dataSource={alerts}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize })
            }}
          />
        </Card>

        <div className="space-y-6">
          <Card
            title={
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">近7天预警趋势</span>
              </div>
            }
          >
            <div style={{ height: 250 }}>
              <ReactECharts option={trendChartOption} style={{ height: '100%' }} />
            </div>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">预警类型分布</span>
              </div>
            }
          >
            <div style={{ height: 250 }}>
              <ReactECharts option={pieChartOption} style={{ height: '100%' }} />
            </div>
          </Card>
        </div>
      </div>

      <Modal
        title="预警详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedAlert && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="预警ID">{selectedAlert.id}</Descriptions.Item>
            <Descriptions.Item label="预警类型">{getAlertTypeText(selectedAlert.type)}</Descriptions.Item>
            <Descriptions.Item label="预警级别">
              <Tag color={getAlertLevelColor(selectedAlert.level)}>
                {getAlertLevelText(selectedAlert.level)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getAlertStatusColor(selectedAlert.status)}>
                {getAlertStatusText(selectedAlert.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="位置">{selectedAlert.location}</Descriptions.Item>
            <Descriptions.Item label="来源">{selectedAlert.source}</Descriptions.Item>
            <Descriptions.Item label="触发时间" span={2}>
              {dayjs(selectedAlert.triggeredAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="预警描述" span={2}>
              {selectedAlert.message}
            </Descriptions.Item>
            {selectedAlert.escalationTime && (
              <Descriptions.Item label="升级时间" span={2}>
                {dayjs(selectedAlert.escalationTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedAlert.resolvedAt && (
              <Descriptions.Item label="解决时间" span={2}>
                {dayjs(selectedAlert.resolvedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
