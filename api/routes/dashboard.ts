import { Router, Request, Response } from 'express';
import { generateDashboardOverview, generateProvinceDetail, getProvinces } from '../../shared/mockData.js';
import type { DashboardOverviewResponse, ProvinceDetailResponse } from '../../shared/types.js';

const router = Router();

router.get('/overview', (_req: Request, res: Response<DashboardOverviewResponse>) => {
  const data = generateDashboardOverview();
  res.json(data);
});

router.get('/province/:code', (req: Request<{ code: string }>, res: Response<ProvinceDetailResponse>) => {
  const { code } = req.params;
  const data = generateProvinceDetail(code);
  res.json(data);
});

router.get('/provinces', (_req: Request, res: Response) => {
  const provinces = getProvinces();
  res.json(provinces);
});

export default router;
