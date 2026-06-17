import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Factory, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Form, Input, Button, Card, message } from 'antd';
import type { AxiosError } from 'axios';
import { authApi } from '../api/client.js';
import { useAppStore } from '../store/index.js';
import type { LoginRequest } from '../../shared/types.js';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setToken, setUser } = useAppStore();

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login(values);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      message.success('登录成功');
      navigate('/dashboard');
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error || '登录失败，请稍后重试');
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl mb-4 shadow-lg">
              <Factory className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">氢能源安全监测平台</h1>
            <p className="text-gray-500">全国氢能全产业链安全监测分析系统</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <Form
            name="login"
            initialValues={{ username: 'admin', password: '123456' }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                placeholder="请输入用户名"
                prefix={<span className="text-gray-400">@</span>}
                className="h-12 rounded-xl"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                placeholder="请输入密码"
                iconRender={(visible) => (
                  visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                )}
                className="h-12 rounded-xl"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 rounded-xl font-medium text-base shadow-lg shadow-blue-500/30"
              >
                {loading ? '登录中...' : '登 录'}
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              演示账号：<span className="font-mono text-gray-700">admin</span> /{' '}
              <span className="font-mono text-gray-700">123456</span>
            </p>
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
            <Link to="#" className="hover:text-blue-500">关于平台</Link>
            <span className="text-gray-300">|</span>
            <Link to="#" className="hover:text-blue-500">使用帮助</Link>
            <span className="text-gray-300">|</span>
            <Link to="#" className="hover:text-blue-500">联系我们</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
