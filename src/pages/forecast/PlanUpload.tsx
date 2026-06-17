import { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import { Card, Button, Table, Spin, message, Typography, Tag, Divider } from 'antd';
import type { UploadProps } from 'antd';
import { forecastApi } from '../../api/client.js';
import type { PlanData, PlanTarget } from '../../../shared/types.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PlanUpload() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [previewData, setPreviewData] = useState<PlanTarget[]>([]);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const data = await forecastApi.getPlan();
      setPlanData(data);
      setPreviewData(data.targets || []);
    } catch (error) {
      console.error('Failed to fetch plan:', error);
      message.error('获取计划数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent = [
      ['省份', '产量目标(吨)', '运输能力(吨)', '加注目标(吨)'],
      ['北京市', '10000', '8000', '6000'],
      ['上海市', '12000', '9000', '7000'],
      ['广东省', '15000', '11000', '9000']
    ];
    
    const csvContent = templateContent.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `年度计划模板_${dayjs().format('YYYYMMDD')}.csv`;
    link.click();
    message.success('模板下载成功');
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls,.csv',
    showUploadList: true,
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel' ||
                     file.type === 'text/csv' ||
                     file.name.endsWith('.xlsx') ||
                     file.name.endsWith('.xls') ||
                     file.name.endsWith('.csv');
      if (!isExcel) {
        message.error('只能上传 Excel 或 CSV 文件!');
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB!');
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploading(true);
        const result = await forecastApi.uploadPlan(file as File);
        setPlanData(result);
        setPreviewData(result.targets || []);
        message.success('文件上传成功，数据已解析');
        onSuccess?.(result);
      } catch (error) {
        console.error('Upload failed:', error);
        message.error('文件上传失败，请检查格式');
        onError?.(error as Error);
      } finally {
        setUploading(false);
      }
    }
  };

  const previewColumns = [
    {
      title: '省份',
      dataIndex: 'province',
      key: 'province',
      render: (text: string) => (
        <span className="font-medium">{text}</span>
      )
    },
    {
      title: '产量目标',
      dataIndex: 'productionTarget',
      key: 'productionTarget',
      render: (value: number) => (
        <span className="font-mono">{value.toLocaleString()} 吨</span>
      )
    },
    {
      title: '运输能力',
      dataIndex: 'transportCapacity',
      key: 'transportCapacity',
      render: (value: number) => (
        <span className="font-mono">{value.toLocaleString()} 吨</span>
      )
    },
    {
      title: '加注目标',
      dataIndex: 'refuelingTarget',
      key: 'refuelingTarget',
      render: (value: number) => (
        <span className="font-mono">{value.toLocaleString()} 吨</span>
      )
    },
    {
      title: '产能利用率',
      key: 'utilization',
      render: (_: unknown, record: PlanTarget) => {
        const utilization = record.transportCapacity > 0 
          ? Math.round((record.productionTarget / record.transportCapacity) * 100) 
          : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  utilization >= 90 ? 'bg-green-500' : utilization >= 70 ? 'bg-blue-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <span className="font-mono text-sm">{utilization}%</span>
          </div>
        );
      }
    }
  ];

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
          <Title level={3} style={{ margin: 0 }}>年度计划上传</Title>
          <Text type="secondary">上传年度生产计划Excel文件，系统将自动解析并进行供需预测分析</Text>
        </div>
        <Button
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchPlan}
        >
          刷新数据
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lg:col-span-2"
          title={
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">上传年度计划</span>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Upload {...uploadProps}>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<Upload className="w-4 h-4" />}
                  loading={uploading}
                >
                  {uploading ? '上传中...' : '选择文件上传'}
                </Button>
              </Upload>
              <Button
                size="large"
                icon={<Download className="w-4 h-4" />}
                onClick={handleDownloadTemplate}
              >
                下载模板
              </Button>
            </div>

            <Text type="secondary">
              支持格式：.xlsx, .xls, .csv | 最大文件大小：10MB
            </Text>

            <Divider />

            <div className="bg-gray-50 rounded-lg p-4">
              <Text strong className="block mb-2">文件格式说明：</Text>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>第一行为表头：省份、产量目标(吨)、运输能力(吨)、加注目标(吨)</li>
                <li>每个省份一行数据，数据必须为数字</li>
                <li>省份名称需与系统中标准名称一致</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-semibold">已上传计划</span>
            </div>
          }
        >
          {planData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-700">计划已上传</p>
                  <p className="text-sm text-green-600">数据解析完成</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">计划年度</p>
                    <p className="font-semibold">{planData.year} 年</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">上传人</p>
                    <p className="font-semibold">{planData.uploadedBy || '系统管理员'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">上传时间</p>
                    <p className="font-semibold">
                      {planData.uploadedAt ? dayjs(planData.uploadedAt).format('YYYY-MM-DD HH:mm') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {(planData.targets || []).length}
                  </p>
                  <p className="text-xs text-blue-500">覆盖省份</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {(planData.targets || []).reduce((sum, t) => sum + t.productionTarget, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-500">总产量目标(吨)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无已上传计划</p>
              <p className="text-sm text-gray-400 mt-1">请上传年度计划文件</p>
            </div>
          )}
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">数据预览</span>
            <Tag color="blue" className="ml-2">
              共 {previewData.length} 条记录
            </Tag>
          </div>
        }
      >
        <Table
          columns={previewColumns}
          dataSource={previewData}
          rowKey="province"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  );
}
