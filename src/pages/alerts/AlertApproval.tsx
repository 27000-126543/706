import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Calendar,
  MessageSquare,
  Send
} from 'lucide-react';
import { Card, Descriptions, Tag, Button, Spin, message, Steps, Form, Input, Space, Result } from 'antd';
import dayjs from 'dayjs';
import { alertsApi } from '../../api/client.js';
import { useAppStore } from '../../store/index.js';
import type { Alert, ApprovalFlowStep, ApprovalRequest, ApprovalAction, AlertType, AlertLevel, AlertStatus, UserRole } from '../../../shared/types.js';

const { Step } = Steps;
const { TextArea } = Input;

const roleStepMap: Record<UserRole, number> = {
  safety: 1,
  director: 2,
  national: 3,
  provincial: 2,
  municipal: 1,
  factory: 1
};

export default function AlertApproval() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [form] = Form.useForm();

  const fetchAlertDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await alertsApi.getAlert(id!);
      setAlert(data);
    } catch (error) {
      console.error('Failed to fetch alert detail:', error);
      message.error('获取预警详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchAlertDetail();
    }
  }, [id, fetchAlertDetail]);

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

  const getApprovalActionText = (action: ApprovalAction) => {
    const texts: Record<ApprovalAction, string> = {
      pending: '待处理',
      approved: '已通过',
      rejected: '已驳回'
    };
    return texts[action] || '未知';
  };

  const getApprovalActionColor = (action: ApprovalAction) => {
    const colors: Record<ApprovalAction, string> = {
      pending: 'default',
      approved: 'success',
      rejected: 'error'
    };
    return colors[action] || 'default';
  };

  const getApprovalFlowSteps = (): ApprovalFlowStep[] => {
    if (!alert) return [];
    
    if (alert.approvalFlow && alert.approvalFlow.length > 0) {
      return alert.approvalFlow;
    }

    return [
      { step: 1, role: '现场安全员', action: 'pending', comment: '' },
      { step: 2, role: '区域安全负责人', action: 'pending', comment: '' },
      { step: 3, role: '总部安全总监', action: 'pending', comment: '' }
    ];
  };

  const getCurrentStep = (): number => {
    if (!alert) return 0;
    return alert.currentStep || 0;
  };

  const canApprove = (): boolean => {
    if (!user || !alert) return false;
    
    const userStep = roleStepMap[user.role];
    const currentStep = getCurrentStep();
    
    if (currentStep === 0 && userStep === 1) return true;
    if (currentStep === userStep - 1) return true;
    
    return false;
  };

  const handleApprove = async (action: 'approved' | 'rejected') => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const approvalRequest: ApprovalRequest = {
        alertId: id!,
        step: roleStepMap[user!.role],
        action,
        comment: values.comment
      };

      await alertsApi.approveAlert(id!, approvalRequest);
      message.success(action === 'approved' ? '审批通过成功' : '审批驳回成功');
      fetchAlertDetail();
      form.resetFields();
    } catch (error) {
      console.error('Failed to submit approval:', error);
      message.error('提交审批失败');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = getApprovalFlowSteps();
  const currentStep = getCurrentStep();
  const isAllApproved = steps.every(s => s.action === 'approved');
  const isRejected = steps.some(s => s.action === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!alert) {
    return (
      <Result
        status="404"
        title="404"
        subTitle="未找到该预警信息"
        extra={<Button type="primary" onClick={() => navigate('/alerts')}>返回预警列表</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/alerts')}
        >
          返回列表
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">三级审批流程</h1>
          <p className="text-gray-500 mt-1">预警编号：{alert.id}</p>
        </div>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">预警详情</span>
          </div>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="预警类型">{getAlertTypeText(alert.type)}</Descriptions.Item>
          <Descriptions.Item label="预警级别">
            <Tag color={getAlertLevelColor(alert.level)}>
              {getAlertLevelText(alert.level)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getAlertStatusColor(alert.status)}>
              {getAlertStatusText(alert.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="位置">{alert.location}</Descriptions.Item>
          <Descriptions.Item label="来源">{alert.source}</Descriptions.Item>
          <Descriptions.Item label="触发时间">
            {dayjs(alert.triggeredAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="预警描述" span={2}>
            {alert.message}
          </Descriptions.Item>
          {alert.escalationTime && (
            <Descriptions.Item label="升级时间" span={2}>
              {dayjs(alert.escalationTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-semibold">三级审批流程</span>
          </div>
        }
      >
        <Steps
          direction="vertical"
          current={currentStep}
          status={isRejected ? 'error' : isAllApproved ? 'finish' : 'process'}
          className="max-w-3xl mx-auto"
        >
          {steps.map((step, index) => (
            <Step
              key={step.step}
              title={
                <div className="flex items-center justify-between">
                  <span className="font-medium">步骤{step.step}：{step.role}</span>
                  <Tag color={getApprovalActionColor(step.action)}>
                    {getApprovalActionText(step.action)}
                  </Tag>
                </div>
              }
              description={
                <div className="mt-4 space-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">审批人：</span>
                    <span className="font-medium">
                      {step.userName || (step.action === 'pending' ? '待处理' : '--')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">审批时间：</span>
                    <span className="font-medium">
                      {step.timestamp
                        ? dayjs(step.timestamp).format('YYYY-MM-DD HH:mm:ss')
                        : step.action === 'pending' ? '待处理' : '--'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">审批意见：</span>
                    <span className="font-medium">
                      {step.comment || (step.action === 'pending' ? '暂无意见' : '--')}
                    </span>
                  </div>
                </div>
              }
              icon={
                step.action === 'approved' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : step.action === 'rejected' ? (
                  <XCircle className="w-6 h-6 text-red-500" />
                ) : index < currentStep ? (
                  <Clock className="w-6 h-6 text-blue-500" />
                ) : (
                  <Clock className="w-6 h-6 text-gray-300" />
                )
              }
            />
          ))}
        </Steps>
      </Card>

      {canApprove() && !isAllApproved && !isRejected && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">审批操作</span>
            </div>
          }
          className="border-2 border-blue-200"
        >
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">当前角色：</span>
              {user?.role === 'safety' ? '现场安全员' :
               user?.role === 'director' ? '区域安全负责人' :
               user?.role === 'national' ? '总部安全总监' :
               user?.role === 'provincial' ? '区域安全负责人' :
               user?.role === 'municipal' ? '现场安全员' :
               user?.role === 'factory' ? '现场安全员' : user?.role}
              <span className="ml-4 font-semibold">审批步骤：</span>
              步骤{roleStepMap[user!.role]}
            </p>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={() => handleApprove('approved')}
          >
            <Form.Item
              name="comment"
              label="审批意见"
              rules={[{ required: true, message: '请输入审批意见' }]}
            >
              <TextArea
                rows={4}
                placeholder="请输入审批意见..."
                maxLength={500}
                showCount
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<CheckCircle className="w-4 h-4" />}
                  size="large"
                >
                  同意
                </Button>
                <Button
                  danger
                  onClick={() => handleApprove('rejected')}
                  loading={submitting}
                  icon={<XCircle className="w-4 h-4" />}
                  size="large"
                >
                  拒绝
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {isAllApproved && (
        <Result
          status="success"
          title="三级审批已全部通过"
          subTitle="该预警已完成所有审批流程，可以进行最终处置"
          extra={[
            <Button type="primary" key="resolve" onClick={() => navigate('/alerts')}>
              返回列表
            </Button>
          ]}
        />
      )}

      {isRejected && (
        <Result
          status="error"
          title="审批被驳回"
          subTitle="该预警在审批流程中被驳回，请查看具体审批意见"
          extra={[
            <Button type="primary" key="back" onClick={() => navigate('/alerts')}>
              返回列表
            </Button>
          ]}
        />
      )}

      {!canApprove() && !isAllApproved && !isRejected && (
        <Card>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">当前审批步骤为步骤{currentStep + 1}，请等待相关人员审批</p>
            <p className="text-sm text-gray-400 mt-2">
              您的角色权限不足以进行此步骤的审批操作
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
