import { Router, Request, Response } from 'express';
import { generateAlerts } from '../../shared/mockData.js';
import type { Alert, ApprovalRequest, ApprovalAction } from '../../shared/types.js';

const router = Router();

let alertsCache: Alert[] | null = null;

function getAlerts(): Alert[] {
  if (!alertsCache) {
    alertsCache = generateAlerts(20);
  }
  return alertsCache;
}

router.get('/', (req: Request, res: Response<{ data: Alert[]; total: number }>) => {
  const { level, status, province, startDate, endDate } = req.query;
  let alerts = getAlerts();

  if (level) {
    alerts = alerts.filter(a => a.level === parseInt(level as string));
  }
  if (status) {
    alerts = alerts.filter(a => a.status === status);
  }
  if (province) {
    alerts = alerts.filter(a => a.province === province);
  }
  if (startDate) {
    const start = new Date(startDate as string);
    alerts = alerts.filter(a => new Date(a.triggeredAt) >= start);
  }
  if (endDate) {
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    alerts = alerts.filter(a => new Date(a.triggeredAt) <= end);
  }

  res.json({ data: alerts, total: alerts.length });
});

router.get('/stats/summary', (_req: Request, res: Response) => {
  const alerts = getAlerts();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingStatuses = ['pending', 'processing', 'escalated'];
  const resolvedStatuses = ['resolved', 'approved', 'rejected'];

  const stats = {
    total: alerts.length,
    pending: alerts.filter(a => pendingStatuses.includes(a.status)).length,
    processing: alerts.filter(a => a.status === 'processing').length,
    resolved: alerts.filter(a => resolvedStatuses.includes(a.status)).length,
    level1: alerts.filter(a => a.level === 1).length,
    level2: alerts.filter(a => a.level === 2).length,
    todayCount: alerts.filter(a => new Date(a.triggeredAt) >= today).length
  };

  res.json(stats);
});

router.get('/:id', (req: Request<{ id: string }>, res: Response<Alert | { error: string }>) => {
  const { id } = req.params;
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === id);

  if (!alert) {
    return res.status(404).json({ error: '预警不存在' });
  }

  res.json(alert);
});

router.post('/', (req: Request<unknown, unknown, Partial<Alert>>, res: Response<Alert>) => {
  const alerts = getAlerts();
  const newAlert: Alert = {
    id: Math.random().toString(36).substring(2, 10),
    type: req.body.type || 'other',
    level: req.body.level || 1,
    status: 'pending',
    source: req.body.source || 'manual',
    sourceId: req.body.sourceId || '',
    location: req.body.location || '',
    province: req.body.province || '',
    city: req.body.city || '',
    message: req.body.message || '',
    triggeredAt: new Date()
  };

  alerts.unshift(newAlert);
  res.status(201).json(newAlert);
});

router.post('/:id/escalate', (req: Request<{ id: string }>, res: Response<Alert | { error: string }>) => {
  const { id } = req.params;
  const alerts = getAlerts();
  const alertIndex = alerts.findIndex(a => a.id === id);

  if (alertIndex === -1) {
    return res.status(404).json({ error: '预警不存在' });
  }

  const alert = alerts[alertIndex];

  if (alert.status !== 'escalated' || !alert.approvalFlow) {
    alert.status = 'escalated';
    alert.level = 2;
    alert.escalationTime = new Date();
    alert.approvalFlow = [
      { step: 1, role: '现场安全员', action: 'pending' as ApprovalAction, comment: '', userName: '' },
      { step: 2, role: '区域安全负责人', action: 'pending' as ApprovalAction, comment: '', userName: '' },
      { step: 3, role: '总部安全总监', action: 'pending' as ApprovalAction, comment: '', userName: '' }
    ];
    alert.currentStep = 0;
  }

  alerts[alertIndex] = alert;
  res.json(alert);
});

router.post('/:id/approve', (req: Request<{ id: string }, unknown, ApprovalRequest>, res: Response<Alert | { error: string }>) => {
  const { id } = req.params;
  const { step, action, comment } = req.body;

  const alerts = getAlerts();
  const alertIndex = alerts.findIndex(a => a.id === id);

  if (alertIndex === -1) {
    return res.status(404).json({ error: '预警不存在' });
  }

  const alert = alerts[alertIndex];

  if (!alert.approvalFlow) {
    alert.approvalFlow = [
      { step: 1, role: '现场安全员', action: 'pending' as ApprovalAction, comment: '', userName: '' },
      { step: 2, role: '区域安全负责人', action: 'pending' as ApprovalAction, comment: '', userName: '' },
      { step: 3, role: '总部安全总监', action: 'pending' as ApprovalAction, comment: '', userName: '' }
    ];
  }

  const userNameMap: Record<number, string> = {
    1: '张安全员',
    2: '李负责人',
    3: '王总监'
  };

  const flowStep = alert.approvalFlow.find(s => s.step === step);
  if (flowStep) {
    flowStep.action = action;
    flowStep.comment = comment || '';
    flowStep.timestamp = new Date();
    flowStep.userName = userNameMap[step] || '系统管理员';
  }

  const isRejected = alert.approvalFlow.some(s => s.action === 'rejected');
  const allApproved = alert.approvalFlow.every(s => s.action === 'approved');

  if (isRejected) {
    alert.status = 'rejected';
  } else if (allApproved) {
    alert.status = 'approved';
  } else if (action === 'approved') {
    alert.currentStep = step;
  } else {
    alert.currentStep = step - 1;
  }

  if (action === 'rejected') {
    alert.rejectionTime = new Date();
  }

  alerts[alertIndex] = alert;

  res.json(alert);
});

router.post('/:id/resolve', (req: Request<{ id: string }>, res: Response<Alert | { error: string }>) => {
  const { id } = req.params;
  const alerts = getAlerts();
  const alertIndex = alerts.findIndex(a => a.id === id);

  if (alertIndex === -1) {
    return res.status(404).json({ error: '预警不存在' });
  }

  alerts[alertIndex].status = 'resolved';
  alerts[alertIndex].resolvedAt = new Date();

  res.json(alerts[alertIndex]);
});

router.get('/:id/history', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === id);

  if (!alert) {
    return res.status(404).json({ error: '预警不存在' });
  }

  const history = [
    { time: alert.triggeredAt, event: '预警触发', operator: '系统', description: alert.message }
  ];

  if (alert.escalationTime) {
    history.push({ time: alert.escalationTime, event: '预警升级', operator: '系统', description: '15分钟内未处置，自动升级为二级预警' });
  }

  if (alert.approvalFlow) {
    alert.approvalFlow.forEach(step => {
      if (step.timestamp) {
        history.push({
          time: step.timestamp,
          event: `审批步骤${step.step}`,
          operator: step.userName || step.role,
          description: `${step.action === 'approved' ? '通过' : '拒绝'}: ${step.comment}`
        });
      }
    });
  }

  if (alert.resolvedAt) {
    history.push({ time: alert.resolvedAt, event: '预警解除', operator: '操作员', description: '已完成现场处置，预警解除' });
  }

  res.json({ data: history.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()) });
});

export default router;
