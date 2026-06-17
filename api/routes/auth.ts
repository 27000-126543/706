import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { mockUsers } from '../../shared/mockData.js';
import type { LoginRequest, LoginResponse } from '../../shared/types.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hydrogen-monitoring-secret-key';

router.post('/login', (req: Request<unknown, unknown, LoginRequest>, res: Response<LoginResponse | { error: string }>) => {
  const { username, password } = req.body;

  const user = mockUsers.find(u => u.username === username);
  
  if (!user || password !== '123456') {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      region: user.region,
      province: user.province,
      city: user.city,
      permissions: user.permissions
    }
  });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: '登出成功' });
});

router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    const user = mockUsers.find(u => u.username === decoded.username);
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    res.json({
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role,
      region: user.region,
      province: user.province,
      city: user.city,
      permissions: user.permissions
    });
  } catch {
    res.status(401).json({ error: 'Token无效' });
  }
});

export default router;
