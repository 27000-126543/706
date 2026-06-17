import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  MapPin,
  Building2
} from 'lucide-react';
import {
  Card,
  Button,
  Spin,
  message,
  Tree,
  Checkbox,
  Space,
  Tag,
  Row,
  Col,
  Divider
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { adminApi } from '../../api/client.js';
import type { UserRole } from '../../../shared/types.js';

const roleLabels: Record<UserRole, { label: string; color: string; icon: LucideIcon }> = {
  national: { label: '国家级', color: 'red', icon: Globe },
  provincial: { label: '省级', color: 'orange', icon: MapPin },
  municipal: { label: '市级', color: 'blue', icon: MapPin },
  factory: { label: '工厂', color: 'green', icon: Building2 },
  safety: { label: '安全员', color: 'purple', icon: Shield },
  director: { label: '安全总监', color: 'cyan', icon: Shield }
};

const regionTreeData: DataNode[] = [
  {
    title: '全国',
    key: 'national',
    icon: <Globe className="w-4 h-4" />,
    children: [
      {
        title: '北京市',
        key: 'beijing',
        icon: <MapPin className="w-4 h-4" />,
        children: [
          { title: '朝阳区', key: 'beijing-chaoyang', icon: <Building2 className="w-4 h-4" /> },
          { title: '海淀区', key: 'beijing-haidian', icon: <Building2 className="w-4 h-4" /> },
          { title: '丰台区', key: 'beijing-fengtai', icon: <Building2 className="w-4 h-4" /> }
        ]
      },
      {
        title: '上海市',
        key: 'shanghai',
        icon: <MapPin className="w-4 h-4" />,
        children: [
          { title: '浦东新区', key: 'shanghai-pudong', icon: <Building2 className="w-4 h-4" /> },
          { title: '徐汇区', key: 'shanghai-xuhui', icon: <Building2 className="w-4 h-4" /> }
        ]
      },
      {
        title: '广东省',
        key: 'guangdong',
        icon: <MapPin className="w-4 h-4" />,
        children: [
          { title: '广州市', key: 'guangzhou', icon: <Building2 className="w-4 h-4" /> },
          { title: '深圳市', key: 'shenzhen', icon: <Building2 className="w-4 h-4" /> },
          { title: '佛山市', key: 'foshan', icon: <Building2 className="w-4 h-4" /> }
        ]
      },
      {
        title: '江苏省',
        key: 'jiangsu',
        icon: <MapPin className="w-4 h-4" />,
        children: [
          { title: '南京市', key: 'nanjing', icon: <Building2 className="w-4 h-4" /> },
          { title: '苏州市', key: 'suzhou', icon: <Building2 className="w-4 h-4" /> },
          { title: '无锡市', key: 'wuxi', icon: <Building2 className="w-4 h-4" /> }
        ]
      },
      {
        title: '浙江省',
        key: 'zhejiang',
        icon: <MapPin className="w-4 h-4" />,
        children: [
          { title: '杭州市', key: 'hangzhou', icon: <Building2 className="w-4 h-4" /> },
          { title: '宁波市', key: 'ningbo', icon: <Building2 className="w-4 h-4" /> }
        ]
      }
    ]
  }
];

const permissionGroups = [
  { key: 'dashboard', label: '数据看板', permissions: ['dashboard:view', 'dashboard:export'] },
  { key: 'monitoring', label: '实时监控', permissions: ['monitoring:view', 'monitoring:control'] },
  { key: 'alerts', label: '预警管理', permissions: ['alerts:view', 'alerts:confirm', 'alerts:resolve', 'alerts:approve'] },
  { key: 'reports', label: '报告管理', permissions: ['reports:view', 'reports:generate', 'reports:download'] },
  { key: 'forecast', label: '预测分析', permissions: ['forecast:view', 'forecast:plan'] },
  { key: 'admin', label: '系统管理', permissions: ['admin:users', 'admin:permissions'] }
];

const permissionLabels: Record<string, string> = {
  'dashboard:view': '查看看板',
  'dashboard:export': '导出数据',
  'monitoring:view': '查看监控',
  'monitoring:control': '远程控制',
  'alerts:view': '查看预警',
  'alerts:confirm': '确认预警',
  'alerts:resolve': '处置预警',
  'alerts:approve': '审批预警',
  'reports:view': '查看报告',
  'reports:generate': '生成报告',
  'reports:download': '下载报告',
  'forecast:view': '查看预测',
  'forecast:plan': '调整计划',
  'admin:users': '用户管理',
  'admin:permissions': '权限配置'
};

export default function PermissionConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string[]>(['national']);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>({} as Record<UserRole, string[]>);
  const [editedPermissions, setEditedPermissions] = useState<Record<UserRole, string[]>>({} as Record<UserRole, string[]>);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const changed = Object.keys(rolePermissions).some(role => {
      const original = rolePermissions[role as UserRole] || [];
      const edited = editedPermissions[role as UserRole] || [];
      return original.sort().join(',') !== edited.sort().join(',');
    });
    setHasChanges(changed);
  }, [rolePermissions, editedPermissions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRolePermissions();
      setRolePermissions(data);
      setEditedPermissions(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      message.error('获取权限配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (role: UserRole, permission: string, checked: boolean) => {
    setEditedPermissions(prev => {
      const current = prev[role] || [];
      let updated: string[];
      if (permission === 'all') {
        updated = checked ? ['all'] : [];
      } else {
        updated = checked
          ? [...current.filter(p => p !== 'all'), permission]
          : current.filter(p => p !== permission);
      }
      return { ...prev, [role]: updated };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      for (const role of Object.keys(editedPermissions) as UserRole[]) {
        await adminApi.saveRolePermissions(role, editedPermissions[role]);
      }
      setRolePermissions(JSON.parse(JSON.stringify(editedPermissions)));
      message.success('权限配置保存成功');
    } catch (error) {
      console.error('Failed to save permissions:', error);
      message.error('保存权限配置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedPermissions(JSON.parse(JSON.stringify(rolePermissions)));
    message.info('已重置为原始配置');
  };

  const handleSelectAll = (role: UserRole, checked: boolean) => {
    setEditedPermissions(prev => ({
      ...prev,
      [role]: checked ? ['all'] : []
    }));
  };

  const getPermissionsForRole = (role: UserRole): string[] => {
    return editedPermissions[role] || [];
  };

  const hasPermission = (role: UserRole, permission: string): boolean => {
    const perms = getPermissionsForRole(role);
    return perms.includes('all') || perms.includes(permission);
  };

  const isAllSelected = (role: UserRole): boolean => {
    return getPermissionsForRole(role).includes('all');
  };

  const roles: UserRole[] = ['national', 'provincial', 'municipal', 'factory', 'safety', 'director'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">权限配置</h1>
          <p className="text-gray-500 mt-1">配置系统角色权限和数据访问范围</p>
        </div>
        <Space>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchData}
          >
            刷新
          </Button>
          <Button
            onClick={handleReset}
            disabled={!hasChanges}
          >
            重置
          </Button>
          <Button
            type="primary"
            icon={<Save className="w-4 h-4" />}
            loading={saving}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            保存配置
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col span={8}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">数据访问范围</span>
              </div>
            }
            className="h-full"
          >
            <p className="text-sm text-gray-500 mb-4">选择角色可访问的区域范围（国家/省/市三级）</p>
            <Tree
              checkable
              defaultExpandAll
              checkedKeys={selectedRegion}
              onCheck={(checkedKeys) => setSelectedRegion(checkedKeys as string[])}
              treeData={regionTreeData}
              showIcon
            />
          </Card>
        </Col>

        <Col span={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="font-semibold">角色权限配置矩阵</span>
              </div>
            }
            extra={
              hasChanges && (
                <Tag color="orange" className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  有未保存的更改
                </Tag>
              )
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left border-b border-gray-200 min-w-[120px]">
                      <div className="font-semibold text-gray-700">权限模块</div>
                    </th>
                    {roles.map(role => {
                      const info = roleLabels[role];
                      const Icon = info.icon;
                      return (
                        <th key={role} className="p-3 text-center border-b border-gray-200 min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <Tag color={info.color} className="flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              {info.label}
                            </Tag>
                            <Checkbox
                              checked={isAllSelected(role)}
                              onChange={(e) => handleSelectAll(role, e.target.checked)}
                            >
                              全部
                            </Checkbox>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {permissionGroups.map((group, groupIndex) => (
                    <>
                      <tr key={group.key} className={`${groupIndex > 0 ? 'border-t border-gray-100' : ''}`}>
                        <td colSpan={roles.length + 1} className="p-3 bg-gray-50/50">
                          <div className="font-medium text-gray-800">{group.label}</div>
                        </td>
                      </tr>
                      {group.permissions.map(perm => (
                        <tr key={perm} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 border-b border-gray-100">
                            <span className="text-sm text-gray-600 ml-4">
                              {permissionLabels[perm]}
                            </span>
                          </td>
                          {roles.map(role => (
                            <td key={`${role}-${perm}`} className="p-3 text-center border-b border-gray-100">
                              <Checkbox
                                checked={hasPermission(role, perm)}
                                disabled={isAllSelected(role)}
                                onChange={(e) => handlePermissionChange(role, perm, e.target.checked)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            <Divider className="my-6" />

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                权限说明
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">数据看板</span>
                    <p className="text-gray-500">查看生产、存储、运输、加注等全产业链数据概览</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">实时监控</span>
                    <p className="text-gray-500">监控各节点实时运行状态，支持远程控制操作</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">预警管理</span>
                    <p className="text-gray-500">查看、确认、处置和审批安全预警事件</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">报告管理</span>
                    <p className="text-gray-500">生成、查看和下载安全诊断周报</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">预测分析</span>
                    <p className="text-gray-500">查看供需预测、调整生产计划</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">系统管理</span>
                    <p className="text-gray-500">用户管理、权限配置等系统级操作</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
