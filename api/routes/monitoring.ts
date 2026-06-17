import { Router, Request, Response } from 'express';
import {
  generateProductionData,
  generateStorageTankData,
  generateTransportData,
  generateRefuelingData,
  generateMonitoringStats
} from '../../shared/mockData.js';
import type {
  ProductionData,
  StorageTankData,
  TransportData,
  RefuelingData,
  MonitoringStats
} from '../../shared/types.js';

const router = Router();

router.get('/production', (req: Request, res: Response<{ data: ProductionData[]; total: number }>) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const data = generateProductionData(limit);
  res.json({ data, total: limit });
});

router.get('/storage', (req: Request, res: Response<{ data: StorageTankData[]; total: number }>) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const data = generateStorageTankData(limit);
  res.json({ data, total: limit });
});

router.get('/transport', (req: Request, res: Response<{ data: TransportData[]; total: number }>) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const data = generateTransportData(limit);
  res.json({ data, total: limit });
});

router.get('/refueling', (req: Request, res: Response<{ data: RefuelingData[]; total: number }>) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const data = generateRefuelingData(limit);
  res.json({ data, total: limit });
});

router.get('/stats', (_req: Request, res: Response<MonitoringStats>) => {
  const stats = generateMonitoringStats();
  res.json(stats);
});

export default router;
