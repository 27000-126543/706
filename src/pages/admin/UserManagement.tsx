import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Shield,
  MapPin,
  User as UserIcon,
  Key
} from 'lucide-react';
import {
  Table,
  Card,
  Button,
  message,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Checkbox,
  Popconfirm
} from 'antd';
import { adminApi } from '../../api/client.js';
import type { User, UserRole } from '../../../shared/types.js';

interface UserFormValues {
  username: string;
  realName: string;
  role: UserRole;
  province?: string;
  city?: string;
  permissions: string[];
}

const roleOptions: { value: UserRole; label: string; color: string }[] = [
  { value: 'national', label: '国家级管理员', color: 'red' },
  { value: 'provincial', label: '省级管理员', color: 'orange' },
  { value: 'municipal', label: '市级管理员', color: 'blue' },
  { value: 'factory', label: '工厂管理员', color: 'green' },
  { value: 'safety', label: '安全员', color: 'purple' },
  { value: 'director', label: '安全总监', color: 'cyan' }
];

const allPermissions = [
  { key: 'dashboard:view', label: '查看看板', group: '数据看板' },
  { key: 'dashboard:export', label: '导出数据', group: '数据看板' },
  { key: 'monitoring:view', label: '查看监控', group: '实时监控' },
  { key: 'monitoring:control', label: '远程控制', group: '实时监控' },
  { key: 'alerts:view', label: '查看预警', group: '预警管理' },
  { key: 'alerts:confirm', label: '确认预警', group: '预警管理' },
  { key: 'alerts:resolve', label: '处置预警', group: '预警管理' },
  { key: 'alerts:approve', label: '审批预警', group: '预警管理' },
  { key: 'reports:view', label: '查看报告', group: '报告管理' },
  { key: 'reports:generate', label: '生成报告', group: '报告管理' },
  { key: 'reports:download', label: '下载报告', group: '报告管理' },
  { key: 'forecast:view', label: '查看预测', group: '预测分析' },
  { key: 'forecast:plan', label: '调整计划', group: '预测分析' },
  { key: 'admin:users', label: '用户管理', group: '系统管理' },
  { key: 'admin:permissions', label: '权限配置', group: '系统管理' }
];

const roleDefaultPermissions: Record<UserRole, string[]> = {
  national: ['all'],
  provincial: ['dashboard:view', 'dashboard:export', 'alerts:view', 'alerts:approve', 'reports:view', 'reports:generate', 'reports:download', 'forecast:view'],
  municipal: ['dashboard:view', 'alerts:view', 'alerts:confirm', 'alerts:resolve', 'reports:view', 'monitoring:view'],
  factory: ['dashboard:view', 'monitoring:view', 'alerts:view', 'reports:view'],
  safety: ['alerts:confirm', 'alerts:resolve', 'monitoring:view'],
  director: ['alerts:approve', 'reports:generate', 'reports:view', 'reports:download', 'forecast:view', 'forecast:plan', 'dashboard:view', 'dashboard:export']
};

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await adminApi.getUsers({
        role: roleFilter,
        search: searchText || undefined
      });
      setUsers(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchText]);

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, fetchUsers]);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'factory',
      permissions: roleDefaultPermissions['factory']
    });
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      permissions: user.permissions.includes('all') ? allPermissions.map(p => p.key) : user.permissions
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      message.success('删除成功');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: UserFormValues) => {
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createUser(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      message.error('保存失败');
    }
  };

  const handleRoleChange = (role: UserRole) => {
    form.setFieldsValue({
      permissions: roleDefaultPermissions[role]
    });
  };

  const getRoleInfo = (role: UserRole) => {
    return roleOptions.find(r => r.value === role) || roleOptions[0];
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{text}</span>
        </div>
      )
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => {
        const info = getRoleInfo(role);
        return (
          <Tag color={info.color}>
            <Shield className="w-3 h-3 inline mr-1" />
            {info.label}
          </Tag>
        );
      }
    },
    {
      title: '区域',
      key: 'region',
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{record.province || record.city || '全国'}</span>
        </div>
      )
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <div className="flex flex-wrap gap-1">
          {permissions.includes('all') ? (
            <Tag color="red" icon={<Key className="w-3 h-3" />}>全部权限</Tag>
          ) : (
            permissions.slice(0, 3).map(p => (
              <Tag key={p} color="blue" className="text-xs">
                {allPermissions.find(ap => ap.key === p)?.label || p}
              </Tag>
            ))
          )}
          {permissions.length > 3 && !permissions.includes('all') && (
            <Tag color="default">+{permissions.length - 3}</Tag>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<Trash2 className="w-4 h-4" />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const permissionGroups = [...new Set(allPermissions.map(p => p.group))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500 mt-1">管理系统用户账号和权限</p>
        </div>
        <Space>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchUsers}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAdd}
          >
            新增用户
          </Button>
        </Space>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Space size="middle">
            <Input
              placeholder="搜索用户名或姓名"
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="选择角色"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: 180 }}
              allowClear
              options={roleOptions.map(r => ({ value: r.value, label: r.label }))}
            />
          </Space>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            共 {total} 个用户
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>{editingUser ? '编辑用户' : '新增用户'}</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              name="realName"
              label="真实姓名"
              rules={[{ required: true, message: '请输入真实姓名' }]}
            >
              <Input placeholder="请输入真实姓名" />
            </Form.Item>
          </div>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              placeholder="请选择角色"
              options={roleOptions.map(r => ({ value: r.value, label: r.label }))}
              onChange={handleRoleChange}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="province"
              label="省份"
            >
              <Input placeholder="请输入省份" />
            </Form.Item>
            <Form.Item
              name="city"
              label="城市"
            >
              <Input placeholder="请输入城市" />
            </Form.Item>
          </div>

          <Form.Item
            name="permissions"
            label="权限分配"
          >
            <div className="space-y-4 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              {permissionGroups.map(group => (
                <div key={group}>
                  <div className="font-medium text-gray-700 mb-2">{group}</div>
                  <Checkbox.Group className="flex flex-wrap gap-4">
                    {allPermissions
                      .filter(p => p.group === group)
                      .map(p => (
                        <Checkbox key={p.key} value={p.key}>
                          {p.label}
                        </Checkbox>
                      ))}
                  </Checkbox.Group>
                </div>
              ))}
            </div>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              {editingUser ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
