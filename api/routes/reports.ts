import { Router, Request, Response } from 'express';
import { generateWeeklyReports } from '../../shared/mockData.js';
import type { WeeklyReport } from '../../shared/types.js';

const router = Router();

let reportsCache: WeeklyReport[] | null = null;

function getReports(): WeeklyReport[] {
  if (!reportsCache) {
    reportsCache = generateWeeklyReports(12);
  }
  return reportsCache;
}

router.get('/', (req: Request, res: Response<{ data: WeeklyReport[]; total: number }>) => {
  const { region, year } = req.query;
  let reports = getReports();

  if (region) {
    reports = reports.filter(r => r.region === region);
  }
  if (year) {
    const yearNum = parseInt(year as string);
    reports = reports.filter(r => new Date(r.startDate).getFullYear() === yearNum);
  }

  res.json({ data: reports, total: reports.length });
});

router.get('/:id', (req: Request<{ id: string }>, res: Response<WeeklyReport | { error: string }>) => {
  const { id } = req.params;
  const reports = getReports();
  const report = reports.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ error: '报告不存在' });
  }

  res.json(report);
});

router.post('/generate', (_req: Request, res: Response<WeeklyReport>) => {
  const reports = getReports();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const newReport: WeeklyReport = {
    id: Math.random().toString(36).substring(2, 10),
    week: `${weekStart.getFullYear()}年第${Math.ceil((weekStart.getDate() + 6) / 7)}周`,
    startDate: weekStart,
    endDate: weekEnd,
    region: '全国',
    summary: {
      totalProduction: Math.floor(Math.random() * 60000) + 120000,
      productionYoY: parseFloat((Math.random() * 20 + 5).toFixed(1)),
      productionMoM: parseFloat((Math.random() * 20 - 5).toFixed(1)),
      alertCount: Math.floor(Math.random() * 27) + 8,
      alertResolutionRate: parseFloat((Math.random() * 13 + 85).toFixed(1)),
      equipmentFailureRate: parseFloat((Math.random() * 2.5 + 0.5).toFixed(2))
    },
    accidentDistribution: [
      { type: '储氢超压', count: Math.floor(Math.random() * 8) + 2, percentage: Math.floor(Math.random() * 20) + 20 },
      { type: '运输泄漏', count: Math.floor(Math.random() * 5) + 1, percentage: Math.floor(Math.random() * 15) + 10 },
      { type: '设备故障', count: Math.floor(Math.random() * 9) + 3, percentage: Math.floor(Math.random() * 15) + 30 },
      { type: '其他', count: Math.floor(Math.random() * 4), percentage: Math.floor(Math.random() * 10) + 5 }
    ],
    productionTrend: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return {
        date: `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
        value: Math.floor(Math.random() * 13000) + 15000
      };
    }),
    optimizationSuggestions: [
      { area: '生产排程', suggestion: '建议增加2号线夜班产能，填补夜间需求缺口', priority: 'high' },
      { area: '设备巡检', suggestion: '4号储氢罐已运行18个月，建议提前安排全面检测', priority: 'high' },
      { area: '运输调度', suggestion: '优化京津冀区域运输路线，预计可降低15%运输成本', priority: 'medium' },
      { area: '人员培训', suggestion: '建议开展新入职安全员专项培训，提升应急处置能力', priority: 'low' }
    ],
    generatedBy: 'admin',
    createdAt: new Date()
  };

  reports.unshift(newReport);
  res.status(201).json(newReport);
});

router.get('/:id/download', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const reports = getReports();
  const report = reports.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ error: '报告不存在' });
  }

  const csvContent = [
    ['氢能源全产业链安全诊断周报'],
    [`报告周期: ${report.week}`],
    [`统计范围: ${report.region}`],
    [],
    ['一、核心指标'],
    ['指标', '数值', '同比', '环比'],
    ['总产量(吨)', report.summary.totalProduction, `${report.summary.productionYoY}%`, `${report.summary.productionMoM}%`],
    ['预警数量', report.summary.alertCount, '-', '-'],
    ['预警处置率', `${report.summary.alertResolutionRate}%`, '-', '-'],
    ['设备故障率', `${report.summary.equipmentFailureRate}%`, '-', '-'],
    [],
    ['二、事故类型分布'],
    ['事故类型', '数量', '占比'],
    ...report.accidentDistribution.map(d => [d.type, d.count, `${d.percentage}%`]),
    [],
    ['三、优化建议'],
    ['领域', '建议内容', '优先级'],
    ...report.optimizationSuggestions.map(s => [s.area, s.suggestion, s.priority])
  ].map(row => row.join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8-sig');
  res.setHeader('Content-Disposition', `attachment; filename="report-${report.week}.csv"`);
  res.send('\uFEFF' + csvContent);
});

router.get('/trend/summary', (_req: Request, res: Response) => {
  const reports = getReports();
  const last8Weeks = reports.slice(0, 8);

  const trend = {
    weeks: last8Weeks.map(r => r.week),
    production: last8Weeks.map(r => r.summary.totalProduction),
    productionYoY: last8Weeks.map(r => r.summary.productionYoY),
    alertCount: last8Weeks.map(r => r.summary.alertCount),
    resolutionRate: last8Weeks.map(r => r.summary.alertResolutionRate),
    failureRate: last8Weeks.map(r => r.summary.equipmentFailureRate)
  };

  res.json(trend);
});

export default router;
