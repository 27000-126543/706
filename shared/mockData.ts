import dayjs from 'dayjs';
import type {
  DashboardOverviewResponse,
  ProvinceDetailResponse,
  ProductionData,
  StorageTankData,
  TransportData,
  RefuelingData,
  Alert,
  ForecastResult,
  WeeklyReport,
  User,
  Factory,
  PlanData,
  MonitoringStats
} from './types';

const provinces = [
  { name: '北京市', code: '110000' },
  { name: '上海市', code: '310000' },
  { name: '广东省', code: '440000' },
  { name: '江苏省', code: '320000' },
  { name: '浙江省', code: '330000' },
  { name: '山东省', code: '370000' },
  { name: '河北省', code: '130000' },
  { name: '河南省', code: '410000' },
  { name: '湖北省', code: '420000' },
  { name: '四川省', code: '510000' },
  { name: '陕西省', code: '610000' },
  { name: '辽宁省', code: '210000' },
  { name: '湖南省', code: '430000' },
  { name: '福建省', code: '350000' },
  { name: '安徽省', code: '340000' },
  { name: '内蒙古', code: '150000' },
  { name: '山西省', code: '140000' },
  { name: '黑龙江', code: '230000' },
  { name: '吉林省', code: '220000' },
  { name: '江西省', code: '360000' },
  { name: '广西', code: '450000' },
  { name: '云南省', code: '530000' },
  { name: '贵州省', code: '520000' },
  { name: '甘肃省', code: '620000' },
  { name: '新疆', code: '650000' },
  { name: '海南省', code: '460000' },
  { name: '宁夏', code: '640000' },
  { name: '青海省', code: '630000' },
  { name: '西藏', code: '540000' },
  { name: '天津市', code: '120000' },
  { name: '重庆市', code: '500000' },
];

const factories = [
  { id: 'f001', name: '北京氢能科技有限公司', type: '制氢', province: '北京市', city: '北京市', dailyProduction: 1250, safetyScore: 92 },
  { id: 'f002', name: '上海浦江氢能集团', type: '综合', province: '上海市', city: '上海市', dailyProduction: 1580, safetyScore: 88 },
  { id: 'f003', name: '广州华南氢能产业园', type: '制氢', province: '广东省', city: '广州市', dailyProduction: 2100, safetyScore: 85 },
  { id: 'f004', name: '苏州工业园区制氢厂', type: '制氢', province: '江苏省', city: '苏州市', dailyProduction: 1850, safetyScore: 90 },
  { id: 'f005', name: '杭州绿能氢能有限公司', type: '综合', province: '浙江省', city: '杭州市', dailyProduction: 1620, safetyScore: 94 },
  { id: 'f006', name: '济南氢能产业基地', type: '制氢', province: '山东省', city: '济南市', dailyProduction: 1950, safetyScore: 87 },
  { id: 'f007', name: '天津滨海氢能示范园', type: '综合', province: '天津市', city: '天津市', dailyProduction: 1420, safetyScore: 91 },
  { id: 'f008', name: '重庆两江氢能产业园', type: '制氢', province: '重庆市', city: '重庆市', dailyProduction: 1380, safetyScore: 89 },
  { id: 'f009', name: '武汉光谷氢能科技', type: '综合', province: '湖北省', city: '武汉市', dailyProduction: 1150, safetyScore: 93 },
  { id: 'f010', name: '成都西部氢能中心', type: '制氢', province: '四川省', city: '成都市', dailyProduction: 1480, safetyScore: 86 },
  { id: 'f011', name: '西安氢能产业研究院', type: '综合', province: '陕西省', city: '西安市', dailyProduction: 980, safetyScore: 95 },
  { id: 'f012', name: '沈阳东北氢能基地', type: '制氢', province: '辽宁省', city: '沈阳市', dailyProduction: 1200, safetyScore: 84 },
];

const tankNames = ['1号储氢罐', '2号储氢罐', '3号储氢罐', '4号储氢罐', 'A罐', 'B罐', 'C罐', 'D罐'];
const plateNumbers = ['京A·12345', '沪B·67890', '粤C·11111', '苏D·22222', '浙E·33333', '鲁F·44444', '津G·55555', '渝H·66666'];
const stationNames = ['中关村加氢站', '浦东加氢站', '天河加氢站', '工业园区加氢站', '西湖加氢站', '奥体中心加氢站', '滨海新区加氢站', '两江新区加氢站'];

function random(min: number, max: number, decimals = 0): number {
  const value = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function generateDashboardOverview(): DashboardOverviewResponse {
  const provinceProduction = provinces.map(p => ({
    province: p.name,
    code: p.code,
    value: random(500, 3500)
  })).sort((a, b) => b.value - a.value);

  const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'low', 'low', 'medium', 'medium', 'high', 'critical'];
  const riskRanking = provinces
    .map(p => ({
      province: p.name,
      code: p.code,
      riskIndex: random(10, 95),
      level: riskLevels[random(0, 6)] as 'low' | 'medium' | 'high' | 'critical'
    }))
    .sort((a, b) => b.riskIndex - a.riskIndex)
    .slice(0, 10);

  return {
    totalProduction: random(18000, 25000),
    totalStorage: random(85000, 120000),
    totalTransport: random(120, 180),
    totalRefueling: random(8500, 12000),
    activeAlerts: {
      level1: random(3, 8),
      level2: random(0, 3)
    },
    safetyScore: random(75, 95, 1),
    provinceProduction,
    riskRanking,
    updatedAt: new Date()
  };
}

export function generateProvinceDetail(provinceCode: string): ProvinceDetailResponse {
  const province = provinces.find(p => p.code === provinceCode) || provinces[0];
  const provinceFactories = factories.filter(f => f.province === province.name);
  const factoriesToUse = provinceFactories.length > 0 ? provinceFactories : factories.slice(0, 3);

  const productionTrend = Array.from({ length: 7 }, (_, i) => ({
    date: dayjs().subtract(6 - i, 'day').format('MM-DD'),
    production: random(800, 2500),
    purity: random(99.5, 99.99, 2)
  }));

  const storageHealth = [
    { level: 'excellent' as const, count: random(15, 30), percentage: random(45, 60) },
    { level: 'good' as const, count: random(8, 20), percentage: random(25, 35) },
    { level: 'warning' as const, count: random(2, 8), percentage: random(5, 15) },
    { level: 'danger' as const, count: random(0, 3), percentage: random(0, 5) }
  ];

  const refuelingStats = Array.from({ length: 5 }, (_, i) => ({
    station: `${province.name.slice(0, 2)}加氢${i + 1}号站`,
    dailyAmount: random(200, 800),
    utilization: random(55, 95, 1)
  }));

  return {
    province: province.name,
    code: province.code,
    productionTrend,
    storageHealth,
    refuelingStats,
    factories: factoriesToUse
  };
}

export function generateProductionData(count = 10): ProductionData[] {
  return Array.from({ length: count }, () => {
    const factory = factories[random(0, factories.length - 1)];
    return {
      id: generateId(),
      factoryId: factory.id,
      factoryName: factory.name,
      timestamp: new Date(),
      electrolyzerCurrent: random(400, 800, 1),
      electrolyzerVoltage: random(1.8, 2.4, 2),
      hydrogenProduction: random(50, 200, 1),
      hydrogenPurity: random(99.5, 99.99, 2),
      temperature: random(60, 90, 1),
      pressure: random(1.2, 3.5, 2)
    };
  });
}

export function generateStorageTankData(count = 10): StorageTankData[] {
  return Array.from({ length: count }, () => {
    const factory = factories[random(0, factories.length - 1)];
    const designPressure = random(30, 50, 1);
    const pressure = random(15, designPressure * 1.1, 1);
    const safetyFactor = (designPressure / Math.max(pressure, 1)) * 100;
    let healthStatus: 'excellent' | 'good' | 'warning' | 'danger';
    if (safetyFactor >= 200) healthStatus = 'excellent';
    else if (safetyFactor >= 150) healthStatus = 'good';
    else if (safetyFactor >= 110) healthStatus = 'warning';
    else healthStatus = 'danger';

    return {
      id: generateId(),
      tankId: `tank-${generateId()}`,
      tankName: tankNames[random(0, tankNames.length - 1)],
      factoryId: factory.id,
      factoryName: factory.name,
      timestamp: new Date(),
      pressure,
      designPressure,
      temperature: random(-10, 45, 1),
      humidity: random(20, 80, 1),
      level: random(20, 95, 1),
      safetyFactor: parseFloat(safetyFactor.toFixed(1)),
      healthStatus
    };
  });
}

export function generateTransportData(count = 8): TransportData[] {
  const cities = [
    { name: '北京', lng: 116.4074, lat: 39.9042 },
    { name: '上海', lng: 121.4737, lat: 31.2304 },
    { name: '广州', lng: 113.2644, lat: 23.1291 },
    { name: '深圳', lng: 114.0579, lat: 22.5431 },
    { name: '杭州', lng: 120.1551, lat: 30.2741 },
    { name: '南京', lng: 118.7969, lat: 32.0603 },
    { name: '武汉', lng: 114.3055, lat: 30.5931 },
    { name: '成都', lng: 104.0668, lat: 30.5728 },
  ];

  return Array.from({ length: count }, () => {
    const factory = factories[random(0, factories.length - 1)];
    const city = cities[random(0, cities.length - 1)];
    const leakDetected = Math.random() < 0.15;
    const leakLevel = leakDetected ? random(1, 5) : 0;
    const riskIndex = leakDetected ? random(60, 95) : random(5, 40);

    return {
      id: generateId(),
      vehicleId: `veh-${generateId()}`,
      plateNumber: plateNumbers[random(0, plateNumbers.length - 1)],
      factoryId: factory.id,
      timestamp: new Date(),
      longitude: city.lng + random(-0.5, 0.5, 4),
      latitude: city.lat + random(-0.5, 0.5, 4),
      speed: random(0, 120),
      pressure: random(15, 25, 1),
      temperature: random(15, 35, 1),
      leakDetected,
      leakLevel,
      riskIndex,
      route: `${city.name} → ${cities[random(0, cities.length - 1)].name}`
    };
  });
}

export function generateRefuelingData(count = 10): RefuelingData[] {
  const statuses: Array<'normal' | 'warning' | 'fault'> = ['normal', 'normal', 'normal', 'warning', 'fault'];
  return Array.from({ length: count }, (_, i) => {
    const factory = factories[random(0, factories.length - 1)];
    const status = statuses[random(0, statuses.length - 1)];
    const utilization = status === 'fault' ? random(0, 10) : random(50, 95);

    return {
      id: generateId(),
      stationId: `station-${generateId()}`,
      stationName: stationNames[i % stationNames.length],
      factoryId: factory.id,
      timestamp: new Date(),
      dispenserStatus: status,
      totalDispensed: random(50000, 200000),
      dailyDispensed: random(300, 1500),
      pressure: random(35, 70, 1),
      temperature: random(10, 40, 1),
      utilizationRate: parseFloat(utilization.toFixed(1))
    };
  });
}

export function generateAlerts(count = 15): Alert[] {
  const types: Array<'storage_overpressure' | 'transport_leak' | 'equipment_failure' | 'other'> = 
    ['storage_overpressure', 'transport_leak', 'equipment_failure', 'other'];
  const statuses: Array<'pending' | 'processing' | 'approved' | 'resolved' | 'escalated' | 'rejected'> = 
    ['pending', 'processing', 'processing', 'resolved', 'escalated', 'escalated', 'escalated'];
  const locations = ['北京市朝阳区', '上海市浦东新区', '广州市天河区', '苏州市工业园区', '杭州市西湖区'];
  const messages = {
    storage_overpressure: '储氢罐压力连续超过设计阈值，存在安全隐患',
    transport_leak: '运输车辆检测到氢气泄漏，请立即处置',
    equipment_failure: '加氢站压缩机故障，需要紧急维修',
    other: '其他安全异常，请检查相关设备'
  };

  return Array.from({ length: count }, () => {
    const type = types[random(0, types.length - 1)];
    const level = random(1, 2) as 1 | 2;
    const status = statuses[random(0, statuses.length - 1)];
    const location = locations[random(0, locations.length - 1)];
    const provinceCity = location.split('市');
    const currentStep = status === 'escalated' ? random(1, 3) : undefined;

    const approvalFlow = status === 'escalated' ? [
      { step: 1, role: '现场安全员', action: currentStep && currentStep > 1 ? 'approved' as const : 'pending' as const, comment: currentStep && currentStep > 1 ? '已到达现场确认情况' : '' },
      { step: 2, role: '区域安全负责人', action: currentStep && currentStep > 2 ? 'approved' as const : 'pending' as const, comment: currentStep && currentStep > 2 ? '复核通过，同意放空' : '' },
      { step: 3, role: '总部安全总监', action: 'pending' as const, comment: '' }
    ] : undefined;

    return {
      id: generateId(),
      type,
      level,
      status,
      source: type === 'storage_overpressure' ? '储氢罐压力传感器' : type === 'transport_leak' ? '运输车辆泄漏传感器' : '设备监控系统',
      sourceId: generateId(),
      location,
      province: provinceCity[0] + '省',
      city: provinceCity[0] + '市',
      message: messages[type],
      triggeredAt: new Date(Date.now() - random(1, 3600) * 1000),
      escalationTime: status === 'escalated' ? new Date(Date.now() - random(1, 60) * 60 * 1000) : undefined,
      resolvedAt: status === 'resolved' ? new Date(Date.now() - random(1, 24) * 60 * 60 * 1000) : undefined,
      approvalFlow,
      currentStep
    };
  }).sort((a, b) => {
    if (a.level !== b.level) return b.level - a.level;
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });
}

export function generateForecastResult(): ForecastResult {
  const today = dayjs();
  const supplyForecast = Array.from({ length: 90 }, (_, i) => ({
    date: today.add(i, 'day').format('YYYY-MM-DD'),
    value: random(18000, 25000) + Math.sin(i / 10) * 1000
  }));

  const demandForecast = Array.from({ length: 90 }, (_, i) => ({
    date: today.add(i, 'day').format('YYYY-MM-DD'),
    value: random(20000, 26000) + Math.cos(i / 15) * 800
  }));

  const gaps = supplyForecast.map((s, i) => {
    const d = demandForecast[i];
    const gap = d.value - s.value;
    let severity: 'low' | 'medium' | 'high';
    if (gap < 500) severity = 'low';
    else if (gap < 2000) severity = 'medium';
    else severity = 'high';
    return {
      date: s.date,
      gap: Math.max(0, gap),
      severity,
      contractRisk: gap > 1500 && Math.random() < 0.3
    };
  }).filter(g => g.gap > 0);

  return {
    forecastDays: 90,
    supplyForecast,
    demandForecast,
    gaps,
    recommendations: [
      {
        type: 'production' as const,
        title: '增加3号电解槽运行负荷',
        description: '将3号电解槽运行负荷从75%提升至90%，预计日增产300kg，运行成本增加约12%',
        estimatedCost: 850000,
        priority: 'high' as const
      },
      {
        type: 'procurement' as const,
        title: '从周边城市补充采购',
        description: '从上海、苏州等地氢能企业采购缺口部分，预计采购成本35元/kg，运输成本5元/kg',
        estimatedCost: 2100000,
        priority: 'medium' as const
      },
      {
        type: 'optimization' as const,
        title: '优化生产排程',
        description: '调整夜间生产计划，利用谷电价格优势，增加夜间产量，降低整体生产成本',
        estimatedCost: 0,
        priority: 'high' as const
      },
      {
        type: 'optimization' as const,
        title: '维护保养计划调整',
        description: '延后2台储氢罐的定期维护时间至供需平衡期，释放当前储存能力',
        estimatedCost: 0,
        priority: 'medium' as const
      }
    ]
  };
}

export function generateWeeklyReports(count = 8): WeeklyReport[] {
  return Array.from({ length: count }, (_, i) => {
    const weekStart = dayjs().subtract(i * 7, 'day').startOf('week');
    const weekEnd = weekStart.add(6, 'day');
    
    return {
      id: generateId(),
      week: `${weekStart.format('YYYY年第')}${weekStart.week()}周`,
      startDate: weekStart.toDate(),
      endDate: weekEnd.toDate(),
      region: i === 0 ? '全国' : provinces[random(0, provinces.length - 1)].name,
      summary: {
        totalProduction: random(120000, 180000),
        productionYoY: random(5, 25, 1),
        productionMoM: random(-5, 15, 1),
        alertCount: random(8, 35),
        alertResolutionRate: random(85, 98, 1),
        equipmentFailureRate: random(0.5, 3, 2)
      },
      accidentDistribution: [
        { type: '储氢超压', count: random(2, 10), percentage: random(20, 40) },
        { type: '运输泄漏', count: random(1, 6), percentage: random(10, 25) },
        { type: '设备故障', count: random(3, 12), percentage: random(30, 45) },
        { type: '其他', count: random(0, 4), percentage: random(5, 15) }
      ],
      productionTrend: Array.from({ length: 7 }, (_, j) => ({
        date: weekStart.add(j, 'day').format('MM-DD'),
        value: random(15000, 28000)
      })),
      optimizationSuggestions: [
        { area: '生产排程', suggestion: '建议增加2号线夜班产能，填补夜间需求缺口', priority: 'high' as const },
        { area: '设备巡检', suggestion: '4号储氢罐已运行18个月，建议提前安排全面检测', priority: 'high' as const },
        { area: '运输调度', suggestion: '优化京津冀区域运输路线，预计可降低15%运输成本', priority: 'medium' as const },
        { area: '人员培训', suggestion: '建议开展新入职安全员专项培训，提升应急处置能力', priority: 'low' as const }
      ],
      createdAt: weekEnd.add(1, 'day').toDate()
    };
  });
}

export function generateMonitoringStats(): MonitoringStats {
  return {
    production: {
      total: random(18000, 25000),
      purity: random(99.5, 99.99, 2),
      trend: Array.from({ length: 24 }, () => random(700, 1200))
    },
    storage: {
      totalCapacity: random(85000, 120000),
      usedCapacity: random(50000, 80000),
      safetyScore: random(75, 95, 1)
    },
    transport: {
      activeVehicles: random(120, 180),
      riskIndex: random(15, 40, 1),
      leakCount: random(0, 5)
    },
    refueling: {
      activeStations: random(150, 250),
      dailyAmount: random(8500, 12000),
      utilizationRate: random(65, 85, 1)
    }
  };
}

export const mockUsers: User[] = [
  {
    id: 'u001',
    username: 'admin',
    realName: '系统管理员',
    role: 'national',
    permissions: ['all']
  },
  {
    id: 'u002',
    username: 'beijing_admin',
    realName: '张三',
    role: 'provincial',
    province: '北京市',
    permissions: ['dashboard:view', 'alerts:view', 'reports:view']
  },
  {
    id: 'u003',
    username: 'shanghai_safety',
    realName: '李四',
    role: 'municipal',
    province: '上海市',
    city: '上海市',
    permissions: ['dashboard:view', 'alerts:view', 'alerts:resolve']
  },
  {
    id: 'u004',
    username: 'factory_manager',
    realName: '王五',
    role: 'factory',
    province: '广东省',
    city: '广州市',
    permissions: ['dashboard:view', 'monitoring:view', 'alerts:view']
  },
  {
    id: 'u005',
    username: 'site_safety',
    realName: '赵六',
    role: 'safety',
    province: '江苏省',
    city: '苏州市',
    permissions: ['alerts:confirm', 'alerts:resolve']
  },
  {
    id: 'u006',
    username: 'hq_director',
    realName: '孙七',
    role: 'director',
    permissions: ['alerts:approve', 'reports:generate', 'all']
  }
];

export const mockFactories: Factory[] = factories;

export function generatePlanData(): PlanData {
  return {
    id: generateId(),
    year: dayjs().year(),
    targets: provinces.slice(0, 15).map(p => ({
      province: p.name,
      productionTarget: random(50000, 300000),
      transportCapacity: random(10000, 80000),
      refuelingTarget: random(30000, 200000)
    })),
    uploadedBy: 'admin',
    uploadedAt: new Date()
  };
}

export function getProvinces() {
  return provinces;
}
