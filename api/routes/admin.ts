import { Router, Request, Response } from 'express';
import { mockUsers } from '../../shared/mockData.js';
import type { User, UserRole } from '../../shared/types.js';

const router = Router();

let usersCache: User[] | null = null;

function getUsers(): User[] {
  if (!usersCache) {
    usersCache = [...mockUsers];
  }
  return usersCache;
}

const permissionTree = [
  {
    key: 'dashboard',
    title: '数据看板',
    children: [
      { key: 'dashboard:view', title: '查看看板' },
      { key: 'dashboard:export', title: '导出数据' }
    ]
  },
  {
    key: 'monitoring',
    title: '实时监控',
    children: [
      { key: 'monitoring:view', title: '查看监控' },
      { key: 'monitoring:control', title: '远程控制' }
    ]
  },
  {
    key: 'alerts',
    title: '预警管理',
    children: [
      { key: 'alerts:view', title: '查看预警' },
      { key: 'alerts:confirm', title: '确认预警' },
      { key: 'alerts:resolve', title: '处置预警' },
      { key: 'alerts:approve', title: '审批预警' }
    ]
  },
  {
    key: 'reports',
    title: '报告管理',
    children: [
      { key: 'reports:view', title: '查看报告' },
      { key: 'reports:generate', title: '生成报告' },
      { key: 'reports:download', title: '下载报告' }
    ]
  },
  {
    key: 'forecast',
    title: '预测分析',
    children: [
      { key: 'forecast:view', title: '查看预测' },
      { key: 'forecast:plan', title: '调整计划' }
    ]
  },
  {
    key: 'admin',
    title: '系统管理',
    children: [
      { key: 'admin:users', title: '用户管理' },
      { key: 'admin:permissions', title: '权限配置' }
    ]
  }
];

const rolePermissions: Record<UserRole, string[]> = {
  national: ['all'],
  provincial: ['dashboard:view', 'dashboard:export', 'alerts:view', 'alerts:approve', 'reports:view', 'reports:generate', 'reports:download', 'forecast:view'],
  municipal: ['dashboard:view', 'alerts:view', 'alerts:confirm', 'alerts:resolve', 'reports:view', 'monitoring:view'],
  factory: ['dashboard:view', 'monitoring:view', 'alerts:view', 'reports:view'],
  safety: ['alerts:confirm', 'alerts:resolve', 'monitoring:view'],
  director: ['alerts:approve', 'reports:generate', 'reports:view', 'reports:download', 'forecast:view', 'forecast:plan', 'dashboard:view', 'dashboard:export']
};

router.get('/users', (req: Request, res: Response<{ data: User[]; total: number }>) => {
  const { role, search } = req.query;
  let users = getUsers();

  if (role) {
    users = users.filter(u => u.role === role);
  }
  if (search) {
    const searchStr = String(search).toLowerCase();
    users = users.filter(u =>
      u.username.toLowerCase().includes(searchStr) ||
      u.realName.toLowerCase().includes(searchStr)
    );
  }

  res.json({ data: users, total: users.length });
});

router.post('/users', (req: Request<object, User, Partial<User>>, res: Response<User | { error: string }>) => {
  const users = getUsers();
  const newUser: User = {
    id: Math.random().toString(36).substring(2, 10),
    username: req.body.username || '',
    realName: req.body.realName || '',
    role: req.body.role || 'factory',
    province: req.body.province,
    city: req.body.city,
    permissions: req.body.permissions || rolePermissions[req.body.role || 'factory']
  };

  if (!newUser.username || !newUser.realName) {
    return res.status(400).json({ error: '用户名和真实姓名不能为空' });
  }

  users.unshift(newUser);
  res.status(201).json(newUser);
});

router.put('/users/:id', (req: Request<{ id: string }, User | { error: string }, Partial<User>>, res: Response) => {
  const { id } = req.params;
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }

  users[index] = { ...users[index], ...req.body };
  res.json(users[index]);
});

router.delete('/users/:id', (req: Request<{ id: string }>, res: Response<{ success: boolean } | { error: string }>) => {
  const { id } = req.params;
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }

  users.splice(index, 1);
  res.json({ success: true });
});

router.get('/permissions/tree', (_req: Request, res: Response) => {
  res.json(permissionTree);
});

router.get('/permissions/roles', (_req: Request, res: Response) => {
  res.json(rolePermissions);
});

router.post('/permissions/roles', (req: Request<object, { success: boolean }, { role: UserRole; permissions: string[] }>, res: Response) => {
  const { role, permissions } = req.body;
  if (!role || !permissions) {
    return res.status(400).json({ error: '角色和权限不能为空' });
  }
  rolePermissions[role] = permissions;
  res.json({ success: true });
});

export default router;
