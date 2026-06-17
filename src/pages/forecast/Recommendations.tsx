import { useState, useEffect } from 'react';
import {
  Factory,
  ShoppingCart,
  Settings,
  CheckCircle,
  RefreshCw,
  BarChart3,
  DollarSign,
  AlertTriangle,
  Clock,
  ThumbsUp,
  ChevronRight
} from 'lucide-react';
import { Card, Button, Table, Tag, Spin, message, Typography, Tabs, Modal } from 'antd';
import ReactECharts from 'echarts-for-react';
import { forecastApi } from '../../api/client.js';
import type { Recommendation } from '../../../shared/types.js';

const { Title, Text, Paragraph } = Typography;

interface RecommendationWithIndex extends Recommendation {
  id: number;
  accepted?: boolean;
}

export default function Recommendations() {
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationWithIndex[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState<number[]>([]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const result = await forecastApi.getRecommendations();
      const data = (result.data || []).map((item, index) => ({
        ...item,
        id: index
      }));
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      message.error('获取推荐方案失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    Modal.confirm({
      title: '确认采纳方案',
      content: '确认采纳此推荐方案？采纳后将生成执行计划。',
      okText: '确认采纳',
      cancelText: '取消',
      onOk: async () => {
        try {
          setAccepting(id);
          await forecastApi.acceptRecommendation(id);
          setRecommendations(prev => 
            prev.map(item => 
              item.id === id ? { ...item, accepted: true } : item
            )
          );
          message.success('方案已采纳');
        } catch (error) {
          console.error('Failed to accept recommendation:', error);
          message.error('采纳方案失败');
        } finally {
          setAccepting(null);
        }
      }
    });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, typeof Factory> = {
      production: Factory,
      procurement: ShoppingCart,
      optimization: Settings
    };
    return icons[type] || Settings;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      production: 'blue',
      procurement: 'green',
      optimization: 'purple'
    };
    return colors[type] || 'default';
  };

  const getTypeBgColor = (type: string) => {
    const colors: Record<string, string> = {
      production: 'bg-blue-50',
      procurement: 'bg-green-50',
      optimization: 'bg-purple-50'
    };
    return colors[type] || 'bg-gray-50';
  };

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      production: '增产方案',
      procurement: '采购方案',
      optimization: '优化方案'
    };
    return texts[type] || '其他方案';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'error',
      medium: 'warning',
      low: 'success'
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

  const getFilteredRecommendations = () => {
    if (activeTab === 'all') return recommendations;
    return recommendations.filter(r => r.type === activeTab);
  };

  const getCompareChartOption = () => {
    const selected = recommendations.filter(r => selectedRecommendations.includes(r.id));
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: selected.map(r => r.title),
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['预估成本(万元)', '预期收益(万元)', '实施周期(天)', '风险指数'],
        axisLabel: {
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value'
      },
      series: selected.map(r => ({
        name: r.title,
        type: 'bar',
        data: [
          r.estimatedCost,
          r.estimatedCost * (1 + Math.random() * 0.5),
          Math.floor(7 + Math.random() * 30),
          Math.floor(20 + Math.random() * 40)
        ],
        itemStyle: {
          color: r.type === 'production' ? '#3B82F6' : 
                 r.type === 'procurement' ? '#22C55E' : '#8B5CF6'
        }
      }))
    };
  };

  const handleCompare = () => {
    if (selectedRecommendations.length < 2) {
      message.warning('请至少选择2个方案进行对比');
      return;
    }
    setCompareModalVisible(true);
  };

  const columns = [
    {
      title: '方案类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const Icon = getTypeIcon(type);
        return (
          <Tag color={getTypeColor(type)} className="font-medium">
            <Icon className="w-3 h-3 mr-1" />
            {getTypeText(type)}
          </Tag>
        );
      }
    },
    {
      title: '方案标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: RecommendationWithIndex) => (
        <div>
          <span className="font-semibold">{text}</span>
          {record.accepted && (
            <Tag color="green" className="ml-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              已采纳
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Text type="secondary" className="text-sm">{text}</Text>
      )
    },
    {
      title: '预估成本',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 140,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="font-mono font-bold">{value.toLocaleString()} 万元</span>
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)} className="font-medium">
          {getPriorityText(priority)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: RecommendationWithIndex) => (
        <div className="flex items-center gap-2">
          <Button
            type={record.accepted ? 'default' : 'primary'}
            size="small"
            icon={<ThumbsUp className="w-4 h-4" />}
            onClick={() => handleAccept(record.id)}
            loading={accepting === record.id}
            disabled={record.accepted}
          >
            {record.accepted ? '已采纳' : '采纳'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ChevronRight className="w-4 h-4" />}
          >
            详情
          </Button>
        </div>
      )
    }
  ];

  const renderCardList = () => {
    const filtered = getFilteredRecommendations();
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const Icon = getTypeIcon(item.type);
          return (
            <Card
              key={item.id}
              className={`hover:shadow-lg transition-shadow ${getTypeBgColor(item.type)}`}
              bordered={false}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.type === 'production' ? 'bg-blue-100' :
                      item.type === 'procurement' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        item.type === 'production' ? 'text-blue-600' :
                        item.type === 'procurement' ? 'text-green-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <Tag color={getTypeColor(item.type)} className="mb-1">
                        {getTypeText(item.type)}
                      </Tag>
                      <h4 className="font-semibold text-gray-800">{item.title}</h4>
                    </div>
                  </div>
                  {item.accepted && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>

                <Paragraph className="text-sm text-gray-600 mb-0" style={{ minHeight: 60 }}>
                  {item.description}
                </Paragraph>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-mono font-bold text-sm">
                        {item.estimatedCost.toLocaleString()}万
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        {Math.floor(7 + Math.random() * 30)}天
                      </span>
                    </div>
                  </div>
                  <Tag color={getPriorityColor(item.priority)}>
                    {getPriorityText(item.priority)}
                  </Tag>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type={item.accepted ? 'default' : 'primary'}
                    block
                    icon={<ThumbsUp className="w-4 h-4" />}
                    onClick={() => handleAccept(item.id)}
                    loading={accepting === item.id}
                    disabled={item.accepted}
                  >
                    {item.accepted ? '已采纳' : '采纳方案'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
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
          <Title level={3} style={{ margin: 0 }}>方案推荐</Title>
          <Text type="secondary">基于供需缺口分析，智能生成最优解决方案</Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCompare}
            disabled={selectedRecommendations.length < 2}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            方案对比 ({selectedRecommendations.length})
          </Button>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchRecommendations}
          >
            刷新数据
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Factory className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">增产方案</p>
              <p className="text-2xl font-bold text-blue-700">
                {recommendations.filter(r => r.type === 'production').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">采购方案</p>
              <p className="text-2xl font-bold text-green-700">
                {recommendations.filter(r => r.type === 'procurement').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">优化方案</p>
              <p className="text-2xl font-bold text-purple-700">
                {recommendations.filter(r => r.type === 'optimization').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          items={[
            { key: 'all', label: `全部方案 (${recommendations.length})` },
            { key: 'production', label: `增产方案 (${recommendations.filter(r => r.type === 'production').length})` },
            { key: 'procurement', label: `采购方案 (${recommendations.filter(r => r.type === 'procurement').length})` },
            { key: 'optimization', label: `优化方案 (${recommendations.filter(r => r.type === 'optimization').length})` }
          ]}
        />

        <div className="mt-4">
          {renderCardList()}
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">所有方案列表</span>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={recommendations}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedRecommendations,
            onChange: (keys) => setSelectedRecommendations(keys as number[])
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条方案`
          }}
        />
      </Card>

      <Modal
        title="方案对比分析"
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setCompareModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <div style={{ height: 400 }}>
          <ReactECharts option={getCompareChartOption()} style={{ height: '100%' }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {recommendations.filter(r => selectedRecommendations.includes(r.id)).map(item => (
            <Card key={item.id} size="small" className={getTypeBgColor(item.type)}>
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = getTypeIcon(item.type);
                  return <Icon className={`w-5 h-5 ${
                    item.type === 'production' ? 'text-blue-600' :
                    item.type === 'procurement' ? 'text-green-600' : 'text-purple-600'
                  }`} />;
                })()}
                <span className="font-semibold">{item.title}</span>
                <Tag color={getPriorityColor(item.priority)}>{getPriorityText(item.priority)}</Tag>
              </div>
              <Text type="secondary" className="text-sm">{item.description}</Text>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span>预估成本：<span className="font-mono font-bold">{item.estimatedCost.toLocaleString()}万元</span></span>
                  <span>实施周期：<span className="font-mono">{Math.floor(7 + Math.random() * 30)}天</span></span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}
