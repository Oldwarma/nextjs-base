# Modal Components Usage Examples

完整的使用示例，包含常见场景和最佳实践。

## 目录

- [场景 1：用户管理 - 完整实现](#场景-1用户管理---完整实现)
- [场景 2：角色管理 - 分配权限和菜单](#场景-2角色管理---分配权限和菜单)
- [场景 3：菜单管理 - 父级选择](#场景-3菜单管理---父级选择)
- [最佳实践](#最佳实践)

---

## 场景 1：用户管理 - 完整实现

展示如何使用所有三个组件实现完整的用户管理功能。

### 完整代码

```jsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button, message, App } from 'antd';
import { PlusOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons';
import SmartCrudPage from '@/components/admin/smart-crud-page';
import {
  TreeSelectorModal,
  ResetPasswordModal,
  CreateUserModal
} from '@/components/admin/modals';

// Server Actions
import * as actions from '@/app/(admin)/actions/rbac/admin-users';
import { getRoleListForSelectAction } from '@/app/(admin)/actions/rbac/admin-roles';

// Config
import { userCrudConfig } from '@/app/(admin)/actions/rbac/configs/user-crud.config';

export default function UsersManagementPage() {
  const { message: messageApi } = App.useApp();

  // ========== 状态管理 ==========
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 角色数据
  const [roleTree, setRoleTree] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  // ========== 数据加载 ==========
  // 加载角色树
  const loadRoleTree = useCallback(async () => {
    try {
      const result = await getRoleListForSelectAction({ withLabel: true });
      if (result.success) {
        const roles = result.data || [];
        
        // 转换为 Tree 格式
        const treeData = roles
          .filter(role => role && role.id && role.enable)
          .map(role => ({
            title: String(role.label || role.name || 'Unknown'),
            value: String(role.id),
            key: String(role.id),
            disabled: !role.enable,
          }));
        
        setRoleTree(treeData);
        setRolesLoaded(true);
      } else {
        messageApi.error(result.error || 'Failed to load roles');
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      messageApi.error('Failed to load roles');
    }
  }, [messageApi]);

  // 页面加载时获取角色数据
  useEffect(() => {
    loadRoleTree();
  }, [loadRoleTree]);

  // ========== 创建用户 ==========
  const handleCreateUser = async (userData) => {
    const result = await actions.createUserAction(userData);
    
    if (result.success) {
      messageApi.success('User created successfully');
      setRefreshTrigger(prev => prev + 1);
      // Modal 会自动关闭
    } else {
      messageApi.error(result.error || 'Failed to create user');
      throw new Error(result.error); // 阻止 Modal 关闭
    }
  };

  // ========== 重置密码 ==========
  const handleResetPassword = async (userId, newPassword) => {
    const result = await actions.resetUserPasswordAction(userId, newPassword);
    
    if (result.success) {
      messageApi.success('Password reset successfully');
      // Modal 会自动关闭
    } else {
      messageApi.error(result.error || 'Failed to reset password');
      throw new Error(result.error);
    }
  };

  // ========== 分配角色 ==========
  const handleAssignRoles = async (record) => {
    setSelectedUser(record);
    setRoleModalVisible(true);
    setRoleLoading(true);

    try {
      // 获取用户当前角色
      const result = await actions.getUserRolesAction(record.id || record._id);
      
      if (result.success) {
        const userRoles = result.data || [];
        const roleIds = userRoles.map(role => {
          if (typeof role === 'string') return role;
          return String(role.id || role._id || '');
        }).filter(id => id);
        
        // 更新选中状态
        setSelectedUser(prev => ({
          ...prev,
          currentRoles: roleIds
        }));
      } else {
        messageApi.error(result.error || 'Failed to load user roles');
      }
    } catch (error) {
      console.error('Failed to load user roles:', error);
      messageApi.error('Failed to load user roles');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleSaveRoles = async (checkedKeys) => {
    if (!selectedUser) return;

    const userId = selectedUser.id || selectedUser._id;
    if (!userId) {
      messageApi.error('User ID is missing');
      throw new Error('User ID is missing');
    }

    const result = await actions.bindUserRolesAction(userId, checkedKeys, true);

    if (result.success) {
      messageApi.success('Roles assigned successfully');
      setRefreshTrigger(prev => prev + 1);
      // Modal 会自动关闭
    } else {
      messageApi.error(result.error || 'Failed to assign roles');
      throw new Error(result.error);
    }
  };

  // ========== 渲染 ==========
  return (
    <>
      <SmartCrudPage
        title="User Management"
        fieldsConfig={userCrudConfig.fieldsConfig}
        rowKey={(record) => record.id || record._id}
        
        actions={{
          getList: actions.getUserListAction,
          update: actions.updateUserInfoAction,
          delete: actions.deleteUserAction,
        }}
        
        // 禁用默认创建按钮
        enableCreate={false}
        enableEdit={true}
        enableDelete={true}
        enableDetail={true}
        
        // 自定义工具栏按钮
        customToolbarButtons={[
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create User
          </Button>
        ]}
        
        // 自定义行操作
        customRowActions={[
          {
            key: 'assign-roles',
            text: 'Assign Roles',
            icon: <TeamOutlined />,
            inMore: true,
            onClick: handleAssignRoles,
          },
          {
            key: 'reset-password',
            text: 'Reset Password',
            icon: <KeyOutlined />,
            inMore: true,
            onClick: (record) => {
              setSelectedUser(record);
              setPasswordModalVisible(true);
            },
          },
        ]}
        
        // 表格配置
        tableProps={{
          scroll: { x: 1400 },
          pagination: {
            showTotal: (total) => `Total ${total} users`,
          },
        }}
        
        // 刷新触发器
        refreshTrigger={refreshTrigger}
      />

      {/* ========== Modals ========== */}

      {/* 创建用户 */}
      <CreateUserModal
        visible={createModalVisible}
        onSave={handleCreateUser}
        onCancel={() => setCreateModalVisible(false)}
      />

      {/* 重置密码 */}
      <ResetPasswordModal
        visible={passwordModalVisible}
        user={selectedUser}
        onSave={handleResetPassword}
        onCancel={() => {
          setPasswordModalVisible(false);
          setSelectedUser(null);
        }}
      />

      {/* 分配角色 */}
      <TreeSelectorModal
        visible={roleModalVisible}
        title={`Assign Roles: ${selectedUser?.name || 'User'}`}
        treeData={roleTree}
        checkedKeys={selectedUser?.currentRoles || []}
        onSave={handleSaveRoles}
        onCancel={() => {
          setRoleModalVisible(false);
          setSelectedUser(null);
        }}
        loading={roleLoading}
        searchable={true}
        defaultExpandAll={false}
      />
    </>
  );
}
```

---

## 场景 2：角色管理 - 分配权限和菜单

展示如何使用 TreeSelectorModal 实现角色的权限和菜单分配。

### 核心代码

```jsx
'use client';

import { useState, useEffect } from 'react';
import { message, Checkbox } from 'antd';
import { KeyOutlined, MenuOutlined } from '@ant-design/icons';
import { TreeSelectorModal } from '@/components/admin/modals';

export default function RolesManagementPage() {
  // 权限分配
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionTree, setPermissionTree] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  
  // 菜单分配
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [menuTree, setMenuTree] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState([]);
  
  const [selectedRole, setSelectedRole] = useState(null);

  // 加载权限树
  useEffect(() => {
    const loadPermissionTree = async () => {
      const result = await getPermissionListForSelectAction({ withLabel: true });
      if (result.success) {
        setPermissionTree(convertToTreeData(result.data));
      }
    };
    loadPermissionTree();
  }, []);

  // 加载菜单树
  useEffect(() => {
    const loadMenuTree = async () => {
      const result = await getMenuListForParentSelectAction();
      if (result.success) {
        setMenuTree(convertToTreeData(result.data));
      }
    };
    loadMenuTree();
  }, []);

  // 分配权限
  const handleAssignPermissions = async (record) => {
    setSelectedRole(record);
    setPermissionModalVisible(true);

    // 获取角色当前权限
    const result = await getRoleDetailAction({ id: record.id });
    if (result.success) {
      setSelectedPermissions(result.data?.permission || []);
    }
  };

  const handleSavePermissions = async (checkedKeys) => {
    const result = await assignPermissionsToRoleAction({
      roleId: selectedRole.id,
      permissionIds: checkedKeys
    });

    if (result.success) {
      message.success('Permissions assigned successfully');
    } else {
      message.error(result.error);
      throw new Error(result.error);
    }
  };

  // 分配菜单（带额外选项）
  const handleAssignMenus = async (record) => {
    setSelectedRole(record);
    setMenuModalVisible(true);

    const result = await getRoleDetailAction({ id: record.id });
    if (result.success) {
      setSelectedMenus(result.data?.menu || []);
    }
  };

  const handleSaveMenus = async (checkedKeys, extraOptions) => {
    const result = await assignMenusToRoleAction({
      roleId: selectedRole.id,
      menuIds: checkedKeys,
      autoBindMenuPermissions: extraOptions.autoBindMenuPermissions
    });

    if (result.success) {
      message.success('Menus assigned successfully');
    } else {
      message.error(result.error);
      throw new Error(result.error);
    }
  };

  return (
    <>
      <SmartCrudPage
        // ... 其他配置
        customRowActions={[
          {
            key: 'assign-permissions',
            text: 'Assign Permissions',
            icon: <KeyOutlined />,
            onClick: handleAssignPermissions,
          },
          {
            key: 'assign-menus',
            text: 'Assign Menus',
            icon: <MenuOutlined />,
            onClick: handleAssignMenus,
          },
        ]}
      />

      {/* 分配权限 */}
      <TreeSelectorModal
        visible={permissionModalVisible}
        title={`Assign Permissions: ${selectedRole?.name || ''}`}
        treeData={permissionTree}
        checkedKeys={selectedPermissions}
        onSave={handleSavePermissions}
        onCancel={() => setPermissionModalVisible(false)}
        searchable={true}
      />

      {/* 分配菜单（带自动绑定权限选项） */}
      <TreeSelectorModal
        visible={menuModalVisible}
        title={`Assign Menus: ${selectedRole?.name || ''}`}
        treeData={menuTree}
        checkedKeys={selectedMenus}
        onSave={handleSaveMenus}
        onCancel={() => setMenuModalVisible(false)}
        searchable={true}
        extraOptions={[
          {
            key: 'autoBindMenuPermissions',
            label: 'Auto bind menu permissions',
            checked: true,
            tooltip: 'Automatically assign menu-related permissions to this role'
          }
        ]}
      />
    </>
  );
}
```

---

## 场景 3：菜单管理 - 父级选择

使用 TreeSelectorModal 的单选模式实现父级菜单选择。

### 核心代码

```jsx
'use client';

import { useState } from 'react';
import { Form, TreeSelect } from 'antd';

export default function MenuForm() {
  const [menuTree, setMenuTree] = useState([]);

  // 方式 1: 直接使用 TreeSelect（推荐）
  return (
    <Form.Item
      name="parent_id"
      label="Parent Menu"
    >
      <TreeSelect
        treeData={[
          {
            title: '--- Root Menu ---',
            value: null,
            key: 'root'
          },
          ...menuTree
        ]}
        placeholder="Select parent menu (leave empty for root)"
        allowClear
        showSearch
        treeDefaultExpandAll={false}
      />
    </Form.Item>
  );

  // 方式 2: 使用 TreeSelectorModal（适合复杂场景）
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  return (
    <>
      <Form.Item label="Parent Menu">
        <Input
          readOnly
          value={selectedParent?.title || 'Root Menu'}
          onClick={() => setParentModalVisible(true)}
          placeholder="Click to select parent menu"
        />
      </Form.Item>

      <TreeSelectorModal
        visible={parentModalVisible}
        title="Select Parent Menu"
        treeData={[
          { title: '--- Root Menu ---', value: null, key: 'root' },
          ...menuTree
        ]}
        checkedKeys={selectedParent?.value}
        onSave={(selectedKey) => {
          const parent = menuTree.find(m => m.value === selectedKey);
          setSelectedParent(parent || { title: 'Root Menu', value: null });
        }}
        onCancel={() => setParentModalVisible(false)}
        multiple={false} // 单选模式
        checkable={false} // 不显示复选框
      />
    </>
  );
}
```

---

## 最佳实践

### 1. 错误处理模式

```jsx
const handleSave = async (data) => {
  try {
    const result = await saveAction(data);
    
    if (result.success) {
      message.success('Operation successful');
      // Modal 会自动关闭
    } else {
      message.error(result.error || 'Operation failed');
      throw new Error(result.error); // 重要：阻止 Modal 关闭
    }
  } catch (error) {
    // 捕获其他异常
    console.error('Unexpected error:', error);
    message.error('An unexpected error occurred');
    throw error; // 继续抛出，阻止 Modal 关闭
  }
};
```

### 2. 加载状态管理

```jsx
const [loading, setLoading] = useState(false);
const [dataLoaded, setDataLoaded] = useState(false);

// 打开 Modal 时加载数据
const handleOpen = async (record) => {
  setSelectedRecord(record);
  setModalVisible(true);
  
  if (!dataLoaded) {
    setLoading(true);
    try {
      const result = await loadData();
      if (result.success) {
        setTreeData(result.data);
        setDataLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  }
};

// 传递 loading 状态
<TreeSelectorModal
  visible={modalVisible}
  loading={loading}
  treeData={treeData}
  // ...
/>
```

### 3. 表单重置

```jsx
// 关闭 Modal 时重置状态
const handleCancel = () => {
  setModalVisible(false);
  setSelectedRecord(null);
  // 注意：不要立即清空 treeData，保持缓存
};

// Modal 关闭后的清理
useEffect(() => {
  if (!modalVisible) {
    // Modal 关闭后 300ms 清理状态（给动画时间）
    const timer = setTimeout(() => {
      setSelectedRecord(null);
    }, 300);
    return () => clearTimeout(timer);
  }
}, [modalVisible]);
```

### 4. 数据转换工具函数

```jsx
/**
 * 转换为 Ant Design Tree 格式
 */
const convertToTreeData = (data, keyField = 'id') => {
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    title: item.label || item.name || item[keyField],
    value: item[keyField],
    key: item[keyField],
    disabled: item.enable === false,
    children: item.children?.length > 0
      ? convertToTreeData(item.children, keyField)
      : undefined,
  }));
};

/**
 * 从树中提取所有叶子节点的 keys
 */
const getLeafKeys = (treeData) => {
  const keys = [];
  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (!node.children || node.children.length === 0) {
        keys.push(node.key);
      } else {
        traverse(node.children);
      }
    });
  };
  traverse(treeData);
  return keys;
};
```

### 5. 性能优化

```jsx
// 使用 useMemo 缓存树形数据
const treeData = useMemo(() => {
  return convertToTreeData(rawData);
}, [rawData]);

// 使用 useCallback 缓存回调函数
const handleSave = useCallback(async (checkedKeys) => {
  const result = await saveAction(selectedRecord.id, checkedKeys);
  if (result.success) {
    message.success('Saved');
    onRefresh();
  } else {
    throw new Error(result.error);
  }
}, [selectedRecord, onRefresh]);

// 延迟加载数据
const [searchExpanded, setSearchExpanded] = useState(false);

<SmartCrudPage
  onSearchExpandChange={setSearchExpanded}
/>

useEffect(() => {
  if (searchExpanded && !dataLoaded) {
    loadRoleOptions();
  }
}, [searchExpanded, dataLoaded]);
```

### 6. 表单验证集成

```jsx
// CreateUserModal 内部集成
<CreateUserModal
  visible={visible}
  onSave={async (userData) => {
    // 前端验证已通过，执行后端验证
    const result = await createUserAction(userData);
    
    if (result.success) {
      message.success('User created');
    } else {
      // 显示后端验证错误
      if (result.validationErrors) {
        Object.keys(result.validationErrors).forEach(field => {
          message.error(`${field}: ${result.validationErrors[field]}`);
        });
      } else {
        message.error(result.error);
      }
      throw new Error(result.error);
    }
  }}
/>
```

---

## 常见问题

### Q1: Modal 不会自动关闭？

**A:** 确保在 `onSave` 回调中不抛出异常。只有在需要阻止关闭时才 `throw new Error()`。

### Q2: 树形数据不显示？

**A:** 检查数据格式是否符合 Ant Design Tree 规范：
```javascript
{
  title: '显示文本',
  value: '值（用于选中）',
  key: '唯一标识',
  children: [...]  // 可选
}
```

### Q3: 搜索不生效？

**A:** 确保设置了 `searchable={true}` 并且 tree 数据的 `title` 字段包含可搜索的文本。

### Q4: 如何禁用某些选项？

**A:** 在 tree 数据中添加 `disabled: true`：
```javascript
{
  title: 'Disabled Item',
  value: 'item-id',
  key: 'item-id',
  disabled: true
}
```

### Q5: 如何获取选中节点的完整数据？

**A:** 保存时只返回 keys，完整数据需要从原始数据中查找：
```javascript
const handleSave = async (checkedKeys) => {
  const selectedItems = treeData
    .filter(item => checkedKeys.includes(item.key));
  console.log('Selected items:', selectedItems);
  // ...
};
```

---

## 下一步

- [ ] 添加 TypeScript 类型定义
- [ ] 添加单元测试
- [ ] 添加 Storybook 文档
- [ ] 支持更多自定义渲染
- [ ] 添加拖拽排序功能（TreeSelectorModal）

