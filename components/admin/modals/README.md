# Admin Modal Components

可复用的 Modal 组件集合，用于简化 RBAC 和其他管理功能的开发。

## 组件列表

### 1. TreeSelectorModal

树形选择器 Modal，支持单选/多选，用于角色、权限、菜单等的分配。

#### 基础用法

```jsx
import { TreeSelectorModal } from '@/components/admin/modals';

function UserManagement() {
  const [visible, setVisible] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleTree, setRoleTree] = useState([]);

  const handleSave = async (checkedKeys) => {
    console.log('Selected:', checkedKeys);
    await assignRolesToUser(userId, checkedKeys);
    setVisible(false);
  };

  return (
    <TreeSelectorModal
      visible={visible}
      title="Assign Roles"
      treeData={roleTree}
      checkedKeys={selectedRoles}
      onSave={handleSave}
      onCancel={() => setVisible(false)}
      multiple={true}
    />
  );
}
```

#### 高级用法（带额外选项）

```jsx
<TreeSelectorModal
  visible={visible}
  title="Assign Menus"
  treeData={menuTree}
  checkedKeys={selectedMenus}
  onSave={async (checkedKeys, extraOptions) => {
    console.log('Selected menus:', checkedKeys);
    console.log('Auto bind permissions:', extraOptions.autoBindPermissions);
    await assignMenusToRole(roleId, checkedKeys, extraOptions.autoBindPermissions);
  }}
  onCancel={() => setVisible(false)}
  searchable={true}
  defaultExpandAll={false}
  extraOptions={[
    {
      key: 'autoBindPermissions',
      label: 'Auto bind menu permissions',
      checked: true,
      tooltip: 'Automatically assign menu-related permissions'
    }
  ]}
/>
```

#### TreeData 格式

```javascript
const treeData = [
  {
    title: 'User Management',
    value: 'user-mgmt-role-id',
    key: 'user-mgmt-role-id',
    children: [
      {
        title: 'View Users',
        value: 'view-users-role-id',
        key: 'view-users-role-id',
      },
      {
        title: 'Edit Users',
        value: 'edit-users-role-id',
        key: 'edit-users-role-id',
        disabled: true, // 禁用此选项
      }
    ]
  }
];
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | 是否显示 Modal（必需） |
| `title` | `string` | `'Select Items'` | Modal 标题 |
| `treeData` | `array` | `[]` | 树形数据（Ant Design Tree 格式） |
| `checkedKeys` | `array \| string` | `[]` | 已选中的 keys（多选为数组，单选为字符串） |
| `onSave` | `function` | - | 保存回调 `(checkedKeys, extraOptions?) => Promise<void>` |
| `onCancel` | `function` | - | 取消回调 |
| `loading` | `boolean` | `false` | 加载状态 |
| `multiple` | `boolean` | `true` | 是否多选 |
| `checkable` | `boolean` | `true` | 是否显示复选框 |
| `searchable` | `boolean` | `true` | 是否支持搜索 |
| `defaultExpandAll` | `boolean` | `false` | 是否默认展开所有节点 |
| `width` | `number` | `600` | Modal 宽度 |
| `treeHeight` | `number` | `400` | Tree 最大高度 |
| `emptyText` | `string` | `'No data available'` | 空数据提示文本 |
| `okText` | `string` | `'Save'` | 确认按钮文本 |
| `cancelText` | `string` | `'Cancel'` | 取消按钮文本 |
| `description` | `string` | - | 说明文字 |
| `extraOptions` | `array` | `[]` | 额外的配置选项（Checkbox） |

---

### 2. ResetPasswordModal

重置用户密码 Modal，包含密码强度验证和自动生成功能。

#### 基础用法

```jsx
import { ResetPasswordModal } from '@/components/admin/modals';

function UserManagement() {
  const [visible, setVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleResetPassword = async (userId, newPassword) => {
    const result = await resetUserPasswordAction(userId, newPassword);
    if (result.success) {
      message.success('Password reset successfully');
      setVisible(false);
    } else {
      message.error(result.error || 'Failed to reset password');
    }
  };

  return (
    <>
      <Button onClick={() => {
        setSelectedUser(userRecord);
        setVisible(true);
      }}>
        Reset Password
      </Button>

      <ResetPasswordModal
        visible={visible}
        user={selectedUser}
        onSave={handleResetPassword}
        onCancel={() => setVisible(false)}
      />
    </>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | 是否显示 Modal（必需） |
| `user` | `object` | - | 用户对象 `{ id, name, email }` |
| `onSave` | `function` | - | 保存回调 `(userId, password) => Promise<void>` |
| `onCancel` | `function` | - | 取消回调 |
| `minLength` | `number` | `8` | 最小密码长度 |
| `requireConfirm` | `boolean` | `true` | 是否需要确认密码 |
| `showGenerator` | `boolean` | `true` | 是否显示密码生成器 |
| `okText` | `string` | `'Reset Password'` | 确认按钮文本 |
| `cancelText` | `string` | `'Cancel'` | 取消按钮文本 |

---

### 3. CreateUserModal

创建用户 Modal，包含完整的用户信息表单。

#### 基础用法

```jsx
import { CreateUserModal } from '@/components/admin/modals';

function UserManagement() {
  const [visible, setVisible] = useState(false);

  const handleCreateUser = async (userData) => {
    const result = await createUserAction(userData);
    if (result.success) {
      message.success('User created successfully');
      setVisible(false);
      // 刷新列表
      actionRef.current?.reload();
    } else {
      message.error(result.error || 'Failed to create user');
      throw new Error(result.error); // 阻止 Modal 关闭
    }
  };

  return (
    <>
      <Button type="primary" onClick={() => setVisible(true)}>
        Create User
      </Button>

      <CreateUserModal
        visible={visible}
        onSave={handleCreateUser}
        onCancel={() => setVisible(false)}
      />
    </>
  );
}
```

#### 带默认值

```jsx
<CreateUserModal
  visible={visible}
  onSave={handleCreateUser}
  onCancel={() => setVisible(false)}
  defaultValues={{
    role: 'admin',
    isBackendAllowed: true,
    emailVerified: true,
    credits: 100,
  }}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | 是否显示 Modal（必需） |
| `onSave` | `function` | - | 保存回调 `(userData) => Promise<void>` |
| `onCancel` | `function` | - | 取消回调 |
| `width` | `number` | `600` | Modal 宽度 |
| `okText` | `string` | `'Create User'` | 确认按钮文本 |
| `cancelText` | `string` | `'Cancel'` | 取消按钮文本 |
| `defaultValues` | `object` | `{}` | 默认值 |
| `showCredits` | `boolean` | `true` | 是否显示积分设置 |
| `showBackendAccess` | `boolean` | `true` | 是否显示后台访问设置 |

#### userData 格式

```javascript
{
  email: 'user@example.com',
  password: 'SecureP@ssw0rd',
  name: 'John Doe',
  username: 'johndoe',
  role: 'user', // 'user' | 'admin'
  isBackendAllowed: false,
  emailVerified: false,
  credits: 0
}
```

---

## 完整示例：用户管理页面

```jsx
'use client';

import { useState } from 'react';
import { Button, message } from 'antd';
import SmartCrudPage from '@/components/admin/smart-crud-page';
import { TreeSelectorModal, ResetPasswordModal, CreateUserModal } from '@/components/admin/modals';
import { userCrudConfig } from '@/app/(admin)/actions/rbac/configs/user-crud.config';
import * as actions from '@/app/(admin)/actions/rbac/admin-users';

export default function UsersManagementPage() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [roleTree, setRoleTree] = useState([]);

  return (
    <>
      <SmartCrudPage
        title="User Management"
        fieldsConfig={userCrudConfig.fieldsConfig}
        actions={{
          getList: actions.getUserListAction,
          update: actions.updateUserInfoAction,
          delete: actions.deleteUserAction,
        }}
        
        enableCreate={false}
        customToolbarButtons={[
          <Button
            key="create"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            Create User
          </Button>
        ]}
        
        customRowActions={[
          {
            key: 'assign-roles',
            text: 'Assign Roles',
            inMore: true,
            onClick: (record) => {
              setSelectedUser(record);
              setRoleModalVisible(true);
            }
          },
          {
            key: 'reset-password',
            text: 'Reset Password',
            inMore: true,
            onClick: (record) => {
              setSelectedUser(record);
              setPasswordModalVisible(true);
            }
          }
        ]}
        
        refreshTrigger={refreshTrigger}
      />

      {/* 创建用户 */}
      <CreateUserModal
        visible={createModalVisible}
        onSave={async (userData) => {
          const result = await actions.createUserAction(userData);
          if (result.success) {
            message.success('User created successfully');
            setRefreshTrigger(prev => prev + 1);
          } else {
            message.error(result.error);
            throw new Error(result.error);
          }
        }}
        onCancel={() => setCreateModalVisible(false)}
      />

      {/* 重置密码 */}
      <ResetPasswordModal
        visible={passwordModalVisible}
        user={selectedUser}
        onSave={async (userId, password) => {
          const result = await actions.resetUserPasswordAction(userId, password);
          if (result.success) {
            message.success('Password reset successfully');
          } else {
            message.error(result.error);
            throw new Error(result.error);
          }
        }}
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
        checkedKeys={selectedUser?.roles || []}
        onSave={async (checkedKeys) => {
          const result = await actions.bindUserRolesAction(
            selectedUser.id,
            checkedKeys,
            true
          );
          if (result.success) {
            message.success('Roles assigned successfully');
            setRefreshTrigger(prev => prev + 1);
          } else {
            message.error(result.error);
            throw new Error(result.error);
          }
        }}
        onCancel={() => {
          setRoleModalVisible(false);
          setSelectedUser(null);
        }}
        searchable={true}
        defaultExpandAll={false}
      />
    </>
  );
}
```

---

## 注意事项

### 1. 错误处理

组件内部已处理表单验证错误，但保存失败时需要抛出错误以阻止 Modal 关闭：

```javascript
const handleSave = async (data) => {
  const result = await saveAction(data);
  if (!result.success) {
    message.error(result.error);
    throw new Error(result.error); // 阻止 Modal 关闭
  }
};
```

### 2. 状态管理

使用 `refreshTrigger` 来触发列表刷新：

```javascript
const [refreshTrigger, setRefreshTrigger] = useState(0);

// 操作成功后
setRefreshTrigger(prev => prev + 1);

// 传递给 SmartCrudPage
<SmartCrudPage refreshTrigger={refreshTrigger} />
```

### 3. 数据加载

TreeSelectorModal 支持异步加载数据：

```javascript
const handleAssignRoles = async (record) => {
  setSelectedUser(record);
  setRoleModalVisible(true);
  setRoleLoading(true);

  try {
    // 加载角色树
    const result = await getRoleListForSelectAction();
    if (result.success) {
      setRoleTree(convertToTreeData(result.data));
    }
    
    // 加载用户已有角色
    const userRolesResult = await getUserRolesAction(record.id);
    if (userRolesResult.success) {
      setSelectedUser({
        ...record,
        roles: userRolesResult.data.map(r => r.id)
      });
    }
  } finally {
    setRoleLoading(false);
  }
};
```

### 4. TypeScript 支持

如果使用 TypeScript，可以定义类型：

```typescript
import type { TreeSelectorModalProps } from '@/components/admin/modals/tree-selector-modal';
import type { ResetPasswordModalProps } from '@/components/admin/modals/reset-password-modal';
import type { CreateUserModalProps } from '@/components/admin/modals/create-user-modal';
```

---

## 贡献

如果需要添加新的 Modal 组件，请遵循以下规范：

1. 在 `components/admin/modals/` 目录创建新文件
2. 使用 JSDoc 注释说明组件用途和 Props
3. 提供完整的使用示例
4. 在 `index.js` 中导出
5. 更新此 README 文档

---

## 更新日志

### 2024-11-13
- ✨ 初始版本
- ✅ TreeSelectorModal（树形选择器）
- ✅ ResetPasswordModal（重置密码）
- ✅ CreateUserModal（创建用户）

