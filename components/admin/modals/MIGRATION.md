# 迁移指南 - 从手写 Modal 到可复用组件

本文档帮助你将现有的 RBAC 页面迁移到新的可复用 Modal 组件。

## 迁移收益

- ✅ **代码减少 60-80%**：去除重复的 Modal 代码
- ✅ **维护性提升**：统一的组件，统一的行为
- ✅ **Bug 修复一次**：所有页面同时受益
- ✅ **功能增强容易**：在组件层面统一增强

---

## 迁移步骤

### Step 1: 安装依赖（已完成）

```bash
# 组件已创建在
components/admin/modals/
  ├── tree-selector-modal.jsx
  ├── reset-password-modal.jsx
  ├── create-user-modal.jsx
  └── index.js
```

### Step 2: 导入组件

**旧代码：**
```jsx
import { Modal, Tree, Form, Input } from 'antd';
```

**新代码：**
```jsx
import {
  TreeSelectorModal,
  ResetPasswordModal,
  CreateUserModal
} from '@/components/admin/modals';
```

### Step 3: 替换 Modal 实现

---

## 实例 1：用户管理页面

### 迁移前（950 行）

```jsx
export default function UsersManagementPage() {
  // ❌ 大量状态管理
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [roleTree, setRoleTree] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);

  // ❌ 手写创建用户逻辑（100+ 行）
  const handleCreateUser = async (values) => {
    setCreateLoading(true);
    try {
      const result = await createUserAction(values);
      if (result.success) {
        message.success('User created');
        setCreateModalVisible(false);
        createForm.resetFields();
        setRefreshTrigger(prev => prev + 1);
      } else {
        message.error(result.error);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // ❌ 手写重置密码逻辑（80+ 行）
  const handleResetPassword = async (values) => {
    // ...
  };

  // ❌ 手写分配角色逻辑（150+ 行）
  const handleAssignRoles = async (record) => {
    // ...
  };

  return (
    <>
      <SmartCrudPage ... />

      {/* ❌ 手写创建用户 Modal（100+ 行） */}
      <Modal
        title="Create User"
        open={createModalVisible}
        onOk={() => createForm.submit()}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        confirmLoading={createLoading}
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item name="email" label="Email" rules={[...]}>
            <Input />
          </Form.Item>
          {/* ... 10+ 个表单项 */}
        </Form>
      </Modal>

      {/* ❌ 手写重置密码 Modal（80+ 行） */}
      <Modal ... >
        <Form ... >
          {/* ... */}
        </Form>
      </Modal>

      {/* ❌ 手写分配角色 Modal（120+ 行） */}
      <Modal ... >
        <Tree ... />
      </Modal>
    </>
  );
}
```

### 迁移后（约 200 行）

```jsx
import {
  TreeSelectorModal,
  ResetPasswordModal,
  CreateUserModal
} from '@/components/admin/modals';

export default function UsersManagementPage() {
  // ✅ 简化的状态管理
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [roleTree, setRoleTree] = useState([]);

  // ✅ 简化的处理逻辑
  const handleCreateUser = async (userData) => {
    const result = await createUserAction(userData);
    if (result.success) {
      message.success('User created');
      setRefreshTrigger(prev => prev + 1);
    } else {
      message.error(result.error);
      throw new Error(result.error);
    }
  };

  const handleResetPassword = async (userId, password) => {
    const result = await resetUserPasswordAction(userId, password);
    if (!result.success) {
      message.error(result.error);
      throw new Error(result.error);
    }
  };

  const handleSaveRoles = async (checkedKeys) => {
    const result = await bindUserRolesAction(selectedUser.id, checkedKeys);
    if (result.success) {
      message.success('Roles assigned');
      setRefreshTrigger(prev => prev + 1);
    } else {
      throw new Error(result.error);
    }
  };

  return (
    <>
      <SmartCrudPage
        customRowActions={[
          {
            key: 'assign-roles',
            text: 'Assign Roles',
            onClick: (record) => {
              setSelectedUser(record);
              setRoleModalVisible(true);
            }
          },
          {
            key: 'reset-password',
            text: 'Reset Password',
            onClick: (record) => {
              setSelectedUser(record);
              setPasswordModalVisible(true);
            }
          }
        ]}
      />

      {/* ✅ 使用可复用组件（3 行） */}
      <CreateUserModal
        visible={createModalVisible}
        onSave={handleCreateUser}
        onCancel={() => setCreateModalVisible(false)}
      />

      <ResetPasswordModal
        visible={passwordModalVisible}
        user={selectedUser}
        onSave={handleResetPassword}
        onCancel={() => {
          setPasswordModalVisible(false);
          setSelectedUser(null);
        }}
      />

      <TreeSelectorModal
        visible={roleModalVisible}
        title={`Assign Roles: ${selectedUser?.name || 'User'}`}
        treeData={roleTree}
        checkedKeys={selectedUser?.roles || []}
        onSave={handleSaveRoles}
        onCancel={() => {
          setRoleModalVisible(false);
          setSelectedUser(null);
        }}
      />
    </>
  );
}
```

**代码对比：**
- 创建用户 Modal：100 行 → 3 行（减少 97%）
- 重置密码 Modal：80 行 → 3 行（减少 96%）
- 分配角色 Modal：120 行 → 3 行（减少 97%）
- 总计：950 行 → 200 行（减少 79%）

---

## 实例 2：角色管理页面

### 迁移前

```jsx
export default function RolesManagementPage() {
  // ❌ 权限分配 Modal（150+ 行）
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionTree, setPermissionTree] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  
  const handleAssignPermissions = async (record) => {
    // ... 加载逻辑
    setPermissionModalVisible(true);
    const result = await getRoleDetailAction({ id: record.id });
    setSelectedPermissions(result.data?.permission || []);
  };

  const handleSavePermissions = async () => {
    // ... 保存逻辑
  };

  return (
    <>
      <SmartCrudPage ... />
      
      {/* ❌ 手写权限分配 Modal */}
      <Modal
        title={`Assign Permissions: ${selectedRole?.name || ''}`}
        open={permissionModalVisible}
        onOk={handleSavePermissions}
        onCancel={() => setPermissionModalVisible(false)}
        confirmLoading={permissionLoading}
      >
        <Tree
          checkable
          treeData={permissionTree}
          checkedKeys={selectedPermissions}
          onCheck={setSelectedPermissions}
        />
      </Modal>

      {/* ❌ 手写菜单分配 Modal（带 Checkbox） */}
      <Modal ... >
        <Checkbox>Auto bind menu permissions</Checkbox>
        <Tree ... />
      </Modal>
    </>
  );
}
```

### 迁移后

```jsx
import { TreeSelectorModal } from '@/components/admin/modals';

export default function RolesManagementPage() {
  // ✅ 简化状态
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <>
      <SmartCrudPage
        customRowActions={[
          {
            key: 'assign-permissions',
            text: 'Assign Permissions',
            onClick: async (record) => {
              setSelectedRole(record);
              setPermissionModalVisible(true);
            }
          }
        ]}
      />

      {/* ✅ 权限分配 */}
      <TreeSelectorModal
        visible={permissionModalVisible}
        title={`Assign Permissions: ${selectedRole?.name || ''}`}
        treeData={permissionTree}
        checkedKeys={selectedRole?.permission || []}
        onSave={async (checkedKeys) => {
          const result = await assignPermissionsToRoleAction({
            roleId: selectedRole.id,
            permissionIds: checkedKeys
          });
          if (!result.success) throw new Error(result.error);
        }}
        onCancel={() => setPermissionModalVisible(false)}
      />

      {/* ✅ 菜单分配（带额外选项） */}
      <TreeSelectorModal
        visible={menuModalVisible}
        title={`Assign Menus: ${selectedRole?.name || ''}`}
        treeData={menuTree}
        checkedKeys={selectedRole?.menu || []}
        onSave={async (checkedKeys, extraOptions) => {
          await assignMenusToRoleAction({
            roleId: selectedRole.id,
            menuIds: checkedKeys,
            autoBindMenuPermissions: extraOptions.autoBindMenuPermissions
          });
        }}
        onCancel={() => setMenuModalVisible(false)}
        extraOptions={[
          {
            key: 'autoBindMenuPermissions',
            label: 'Auto bind menu permissions',
            checked: true
          }
        ]}
      />
    </>
  );
}
```

---

## 迁移检查清单

### ✅ 迁移前检查

- [ ] 已阅读 `README.md` 了解组件功能
- [ ] 已阅读 `EXAMPLES.md` 查看使用示例
- [ ] 已识别页面中可复用的 Modal
- [ ] 已备份原始代码（git commit）

### ✅ 迁移过程

- [ ] 导入新组件
- [ ] 替换 Modal 实现
- [ ] 简化状态管理
- [ ] 简化处理逻辑
- [ ] 删除旧的 Modal 代码
- [ ] 删除不再需要的 Form 实例

### ✅ 迁移后测试

- [ ] 创建功能正常
- [ ] 编辑功能正常
- [ ] 删除功能正常
- [ ] Modal 打开/关闭正常
- [ ] 表单验证正常
- [ ] 错误提示正常
- [ ] 数据刷新正常

---

## 常见问题

### Q1: 我的 Modal 有特殊的验证逻辑怎么办？

**A:** 在 `onSave` 回调中实现自定义验证：

```jsx
<CreateUserModal
  onSave={async (userData) => {
    // 自定义验证
    if (userData.email.endsWith('@competitor.com')) {
      message.error('Cannot use competitor email');
      throw new Error('Invalid email');
    }
    
    // 继续保存
    await createUserAction(userData);
  }}
/>
```

### Q2: 我需要在 Modal 打开时加载数据怎么办？

**A:** 在打开 Modal 的回调中加载：

```jsx
const handleOpen = async (record) => {
  setSelectedRecord(record);
  setModalVisible(true);
  setLoading(true);
  
  try {
    const result = await loadData(record.id);
    if (result.success) {
      setTreeData(result.data);
      setSelectedKeys(result.currentKeys);
    }
  } finally {
    setLoading(false);
  }
};

<TreeSelectorModal
  loading={loading}
  // ...
/>
```

### Q3: 我的表单有很多自定义字段怎么办？

**A:** 对于非常特殊的表单，可以继续使用手写 Modal，但考虑：
1. 是否可以通过 `defaultValues` 满足需求？
2. 是否可以扩展现有组件？
3. 是否可以创建新的专用组件？

```jsx
// 扩展 CreateUserModal
<CreateUserModal
  defaultValues={{ department: 'Engineering' }}
  showCredits={false}
  showBackendAccess={false}
/>
```

### Q4: 迁移后发现 Bug 怎么办？

**A:** 
1. 在组件层面修复 → 所有使用页面同时受益
2. 提交 Issue 或 PR
3. 临时可以回退到旧实现

---

## 下一步计划

### Phase 1: 验证（当前）
- [x] 创建可复用组件
- [x] 编写文档和示例
- [ ] 在 Users 页面中试用
- [ ] 收集反馈和改进

### Phase 2: 推广
- [ ] 迁移 Roles 页面
- [ ] 迁移 Permissions 页面
- [ ] 迁移 Menus 页面
- [ ] 迁移其他管理页面

### Phase 3: 增强
- [ ] 添加 TypeScript 类型
- [ ] 添加单元测试
- [ ] 添加更多可配置选项
- [ ] 性能优化

---

## 需要帮助？

- 📖 查看 [README.md](./README.md) - 完整 API 文档
- 📚 查看 [EXAMPLES.md](./EXAMPLES.md) - 详细使用示例
- 🐛 遇到问题？提交 Issue
- 💡 有建议？欢迎 PR

