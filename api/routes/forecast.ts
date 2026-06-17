import { Router, Request, Response } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { generateForecastResult, generatePlanData } from '../../shared/mockData.js';
import type { ForecastResult, PlanData } from '../../shared/types.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ExcelRow = {
  '省份'?: string;
  'province'?: string;
  '目标产量(吨)'?: string | number;
  'productionTarget'?: string | number;
  '运输能力(吨)'?: string | number;
  'transportCapacity'?: string | number;
  '加注目标(吨)'?: string | number;
  'refuelingTarget'?: string | number;
  [key: string]: string | number | undefined;
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

let planDataCache: PlanData | null = null;
let forecastCache: ForecastResult | null = null;

router.get('/plan', (_req: Request, res: Response<PlanData | { error: string }>) => {
  if (!planDataCache) {
    planDataCache = generatePlanData();
  }
  res.json(planDataCache);
});

router.post('/upload', upload.single('file'), (req: Request, res: Response<PlanData | { error: string }>) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传Excel文件' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const year = new Date().getFullYear();
    const targets = data.map((row: Record<string, unknown>) => ({
      province: String(row['省份'] || row['province'] || ''),
      productionTarget: parseFloat(String(row['目标产量(吨)'] || row['productionTarget'] || '0')),
      transportCapacity: parseFloat(String(row['运输能力(吨)'] || row['transportCapacity'] || '0')),
      refuelingTarget: parseFloat(String(row['加注目标(吨)'] || row['refuelingTarget'] || '0'))
    })).filter(t => t.province);

    planDataCache = {
      id: Math.random().toString(36).substring(2, 10),
      year,
      targets,
      uploadedBy: 'admin',
      uploadedAt: new Date()
    };

    forecastCache = null;

    res.json(planDataCache);
  } catch (error) {
    console.error('Excel解析错误:', error);
    res.status(500).json({ error: 'Excel文件解析失败，请检查文件格式' });
  }
});

router.get('/analysis', (_req: Request, res: Response<ForecastResult>) => {
  if (!forecastCache) {
    forecastCache = generateForecastResult();
  }
  res.json(forecastCache);
});

router.get('/recommendations', (_req: Request, res: Response) => {
  if (!forecastCache) {
    forecastCache = generateForecastResult();
  }
  res.json({ data: forecastCache.recommendations });
});

router.post('/recommendations/:index/accept', (req: Request<{ index: string }>, res: Response) => {
  const { index } = req.params;
  const idx = parseInt(index);

  if (!forecastCache || idx < 0 || idx >= forecastCache.recommendations.length) {
    return res.status(404).json({ error: '推荐方案不存在' });
  }

  res.json({
    success: true,
    message: '已采纳该方案',
    recommendation: forecastCache.recommendations[idx]
  });
});

export default router;
