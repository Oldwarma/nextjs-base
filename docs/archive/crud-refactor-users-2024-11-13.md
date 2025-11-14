# CRUD 重构记录 - Users 页面 (2024-11-13)

## 重构目标

将 Users 管理页面重构为统一的 SmartCrudPage 模板结构，与 Permissions、Roles、Menus 页面保持一致。

---

## 重构前的结构

### 文件组织

```
app/(admin)/
├── admin/rbac/users/
│   └── page.js                          # 954 行（包含完整的 fieldsConfig）
└── actions/rbac/
    └── admin-users.js                   # 607 行（所有 Server Actions）
```

### 问题

1. **不一致性：** Users 页面使用 `admin-users.js`，而其他页面使用 `crud-action.{resource}.js`
2. **特殊性：** Users 页面集成了 Better Auth，有很多特殊的 actions（`resetPassword`、`banUser` 等）
3. **配置冗长：** `page.js` 包含了完整的 `fieldsConfig`（约 400 行）

---

## 重构后的结构

### 文件组织

```
app/(admin)/
├── admin/rbac/users/
│   └── page.js                          # 668 行（使用导入的 config + 自定义渲染）
└── actions/rbac/
    ├── crud-action.user.js              # 531 行（所有 Server Actions）
    ├── crud-config.user.js              # 352 行（fieldsConfig，客户端）
    └── admin-users.js                   # 607 行（保留，但不再使用）
```

### 关键改进

✅ **统一结构：** 与其他 RBAC 页面保持一致  
✅ **职责分离：** Server Actions 和 Client Config 分离  
✅ **代码复用：** `fieldsConfig` 可以被其他页面复用  
✅ **保持功能：** 所有 Better Auth 集成功能正常工作

---

## 详细改动

### 1. 创建 `crud-config.user.js` (客户端配置)

**文件路径：** `app/(admin)/actions/rbac/crud-config.user.js`

**作用：** 导出 `userFieldsConfig` 函数，供客户端使用

**关键点：**
- ❌ **不包含** `'use server'` 指令
- ✅ 可以导出普通函数和配置对象
- ✅ 包含所有字段的基础配置（table、form、search、detail）

**代码结构：**

```javascript
/**
 * User Fields Config (Client-side)
 */

export const userFieldsConfig = (roleOptions = [], rolesLoaded = false, searchExpanded = false) => [
  // Better Auth 主键 (id)
  { key: 'id', ... },
  
  // MongoDB _id
  { key: '_id', ... },
  
  // 头像
  { key: 'image', ... },
  
  // 姓名
  { key: 'name', ... },
  
  // 用户名
  { key: 'username', ... },
  
  // 邮箱
  { key: 'email', ... },
  
  // Better Auth 角色
  { key: 'role', ... },
  
  // 后台访问权限
  { key: 'isBackendAllowed', ... },
  
  // RBAC 角色（多选）
  { key: 'roles', options: roleOptions, ... },
  
  // 封禁状态
  { key: 'banned', ... },
  
  // 积分
  { key: 'credits', ... },
  
  // 邮箱验证状态
  { key: 'emailVerified', ... },
  
  // 创建时间
  { key: 'createdAt', ... },
  
  // 最后登录时间
  { key: 'lastLoginAt', ... },
  
  // 其他字段...
];
```

---

### 2. 创建 `crud-action.user.js` (服务端 Actions)

**文件路径：** `app/(admin)/actions/rbac/crud-action.user.js`

**作用：** 整合所有 User 相关的 Server Actions

**关键点：**
- ✅ 包含 `'use server'` 指令
- ✅ 从 `admin-users.js` 复制所有函数实现（不是重新导出）
- ✅ 保持所有 Better Auth 集成功能

**导出的 Actions：**

#### 标准 CRUD Actions
- `createUserAction(userData)`
- `getUserListAction(params)`
- `getUserDetailAction(userId)`
- `updateUserAction(userId, updateData)`
- `deleteUserAction(userId)`
- `batchUpdateUsersAction(userIds, updateData)`

#### 特殊 User Actions
- `resetUserPasswordAction(userId, newPassword)`
- `bindUserRolesAction(userId, roleIds, reset)`
- `getUserRolesAction(userId)`
- `banUserAction(userId, banReason, banExpiresIn)`
- `unbanUserAction(userId)`
- `getUserStatsAction()`

---

### 3. 更新 `users/page.js`

**文件路径：** `app/(admin)/admin/rbac/users/page.js`

**改动内容：**

#### 3.1 更新导入

```javascript
// ❌ 之前
import {
  createUserAction,
  getUserListAction as getList,
  updateUserInfoAction as update,
  deleteUserAction as deleteItem,
  // ... 更多导入
} from '@/app/(admin)/actions/rbac/admin-users';

// ✅ 现在
import * as userActions from '@/app/(admin)/actions/rbac/crud-action.user';
import { userFieldsConfig } from '@/app/(admin)/actions/rbac/crud-config.user';
```

#### 3.2 使用 `userFieldsConfig` 并添加自定义渲染

```javascript
const fieldsConfig = useMemo(() => {
  const baseConfig = userFieldsConfig(roleOptions, rolesLoaded, searchExpanded);
  
  // ✅ 在基础配置上添加自定义渲染逻辑
  return baseConfig.map(field => {
    // Avatar 字段：自定义渲染
    if (field.key === 'image') {
      return {
        ...field,
        table: {
          ...field.table,
          render: (image, record) => (
            <Avatar src={image} icon={<UserOutlined />} size={40}>
              {record.name?.[0]?.toUpperCase()}
            </Avatar>
          ),
        },
      };
    }
    
    // Name 字段：联合显示用户名
    if (field.key === 'name') {
      return {
        ...field,
        table: {
          ...field.table,
          render: (name, record) => (
            <div>
              <div style={{ fontWeight: 500 }}>{name || 'N/A'}</div>
              <div style={{ fontSize: 12, color: '#999' }}>
                @{record.username || 'N/A'}
              </div>
            </div>
          ),
        },
      };
    }
    
    // Roles 字段：自定义渲染（连表数据显示）
    if (field.key === 'roles') {
      return {
        ...field,
        table: {
          ...field.table,
          render: (value, record) => {
            const roles = record.roleList || value || [];
            // ...
          },
        },
      };
    }
    
    // Credits 字段：自定义颜色渲染
    if (field.key === 'credits') {
      return {
        ...field,
        table: {
          ...field.table,
          render: (credits) => (
            <span style={{ 
              fontWeight: 500, 
              color: credits > 0 ? '#52c41a' : '#999' 
            }}>
              {credits || 0}
            </span>
          ),
        },
      };
    }
    
    return field;
  });
}, [roleOptions, rolesLoaded, searchExpanded]);
```

#### 3.3 更新 Actions 配置

```javascript
// ❌ 之前
const actions = {
  getList,
  update,
  delete: deleteItem,
};

// ✅ 现在
const actions = {
  getList: userActions.getUserListAction,
  getDetail: userActions.getUserDetailAction,
  update: userActions.updateUserAction,
  delete: userActions.deleteUserAction,
};
```

#### 3.4 更新所有 Action 调用

```javascript
// ❌ 之前
const result = await createUserAction(values);
const result = await resetUserPasswordAction(userId, password);
const result = await bindUserRolesAction(userId, roleIds, true);

// ✅ 现在
const result = await userActions.createUserAction(values);
const result = await userActions.resetUserPasswordAction(userId, password);
const result = await userActions.bindUserRolesAction(userId, roleIds, true);
```

---

## 技术要点

### 1. 为什么不能重新导出 `admin-users.js`？

**问题：** 在 `'use server'` 文件中使用 `export { ... } from './admin-users'` 会报错

**原因：** Next.js 要求 `'use server'` 文件中只能导出 async 函数，不能重新导出其他模块的函数

**错误信息：**
```
Only async functions are allowed to be exported in a "use server" file.
```

**解决方案：** 直接在 `crud-action.user.js` 中复制所有函数实现，而不是重新导出

---

### 2. 为什么需要单独的 `crud-config.user.js`？

**问题：** `'use server'` 文件不能导出非 async 函数

**原因：** `userFieldsConfig` 是一个普通函数（返回配置对象数组），不是 async 函数

**解决方案：** 
- `crud-config.user.js` - 客户端文件，不包含 `'use server'`，导出 `userFieldsConfig`
- `crud-action.user.js` - 服务端文件，包含 `'use server'`，导出所有 Server Actions

---

### 3. 与其他 RBAC 页面的对比

| 特性 | Permissions | Roles | Menus | Users |
|------|-------------|-------|-------|-------|
| **Config 文件** | 无（直接在 page.js） | 无（直接在 page.js） | 无（直接在 page.js） | ✅ `crud-config.user.js` |
| **Action 文件** | `crud-action.permission.js` | `crud-action.role.js` | `crud-action.menu.js` | `crud-action.user.js` |
| **特殊 Actions** | `getPermissionTree` | `assignPermissions`<br>`assignMenus` | `getMenuTree` | `resetPassword`<br>`banUser`<br>`bindUserRoles`<br>`getUserRoles`<br>... |
| **Better Auth 集成** | ❌ | ❌ | ❌ | ✅ |

**为什么 Users 需要单独的 Config 文件？**

1. **字段更多：** Users 有 20+ 个字段，而其他资源只有 10 个左右
2. **动态配置：** `roles` 字段需要动态 `options`（`roleOptions`）
3. **可复用性：** 其他页面（如用户统计、用户报告）可能也需要用户字段配置

---

## 文件结构对比

### Permissions 页面（标准模板）

```
permissions/
├── page.js (311 行)
│   ├── fieldsConfig 内联定义
│   ├── 使用 permissionActions.*
│   └── SmartCrudPage
└── crud-action.permission.js (361 行)
    ├── permissionConfig (服务端)
    ├── 标准 CRUD Actions
    └── 自定义 Actions (getPermissionTree, etc.)
```

### Users 页面（扩展模板）

```
users/
├── page.js (668 行)
│   ├── 导入 userFieldsConfig
│   ├── 添加自定义渲染
│   ├── 使用 userActions.*
│   └── SmartCrudPage
├── crud-config.user.js (352 行)
│   └── userFieldsConfig (客户端)
└── crud-action.user.js (531 行)
    ├── 标准 CRUD Actions
    ├── Better Auth 集成 Actions
    └── 特殊 User Actions
```

**关键区别：**
- Users 页面多了一个 `crud-config.user.js` 文件（客户端配置）
- Users 页面的 `page.js` 更长，因为有更多自定义渲染逻辑
- Users 页面的 actions 更多，因为集成了 Better Auth

---

## 重构收益

### 1. 代码组织

✅ **统一结构：** 与其他 RBAC 页面保持一致的命名和组织方式  
✅ **职责分离：** 客户端配置和服务端逻辑分离  
✅ **易于维护：** 字段配置集中管理，修改更方便

### 2. 代码复用

✅ **Config 可复用：** `userFieldsConfig` 可以在其他页面使用  
✅ **Actions 统一入口：** 所有 User Actions 从 `crud-action.user.js` 导入  
✅ **减少重复：** 避免在多个地方定义相同的字段配置

### 3. 开发体验

✅ **导入简单：** `import * as userActions from 'crud-action.user'`  
✅ **类型安全：** 函数名统一，减少拼写错误  
✅ **易于扩展：** 新增字段只需修改 `crud-config.user.js`

---

## 保留的功能

所有 Users 页面的功能都保持不变：

✅ **Better Auth 集成**
- 用户创建（通过 Better Auth Admin API）
- 用户更新（通过 Better Auth Admin API）
- 用户删除（通过 Better Auth Admin API）
- 密码重置（通过 Better Auth API + DAO 后备）
- 用户封禁/解封（通过 Better Auth Admin API）

✅ **RBAC 集成**
- 角色绑定（通过 DAO）
- 角色查询（通过 DAO）
- 多角色支持（数组字段）

✅ **自定义功能**
- 头像显示
- 用户名和姓名联合显示
- 角色 Tags 显示（连表数据）
- 积分颜色显示
- 自定义行操作（分配角色、重置密码、封禁用户）
- 自定义详情头部
- 自定义创建模态框

---

## 测试检查点

### 1. 基础 CRUD

- [ ] 列表查询（分页、排序、搜索）
- [ ] 详情查看
- [ ] 用户编辑（姓名、邮箱、角色、权限等）
- [ ] 用户删除
- [ ] 批量操作（批量验证邮箱）

### 2. Better Auth 集成

- [ ] 用户创建（通过自定义模态框）
- [ ] 密码重置
- [ ] 用户封禁
- [ ] 用户解封

### 3. RBAC 集成

- [ ] 分配角色（模态框选择）
- [ ] 角色显示（Table 和 Detail）
- [ ] 角色搜索（多选下拉）

### 4. UI 交互

- [ ] 头像显示正确
- [ ] 用户名显示在姓名下方
- [ ] 角色以 Tags 形式显示
- [ ] 积分颜色根据值变化
- [ ] 封禁状态正确显示
- [ ] 自定义行操作可用

---

## 后续优化建议

### 1. 考虑将其他页面也提取 Config

如果其他页面的字段配置也变得复杂，可以考虑：

```
├── crud-config.permission.js
├── crud-config.role.js
├── crud-config.menu.js
└── crud-config.user.js
```

### 2. 统一 Better Auth 集成

如果其他资源也需要 Better Auth 集成，可以考虑：

```
lib/crud/
└── with-better-auth.js  // Better Auth 集成的通用逻辑
```

### 3. 抽象自定义渲染

如果自定义渲染逻辑经常重复，可以考虑：

```
components/admin/field-renderers/
├── avatar-renderer.jsx
├── roles-renderer.jsx
└── credits-renderer.jsx
```

---

## 提交信息建议

```
refactor: 重构 Users 页面为统一的 SmartCrudPage 模板

1. 创建 crud-config.user.js
   - 导出 userFieldsConfig 函数（客户端配置）
   - 包含所有字段的基础配置

2. 创建 crud-action.user.js
   - 整合所有 User 相关的 Server Actions
   - 保持所有 Better Auth 集成功能
   - 从 admin-users.js 复制实现（不重新导出）

3. 更新 users/page.js
   - 导入 userFieldsConfig 并添加自定义渲染
   - 使用 userActions 命名空间
   - 保持所有现有功能

4. 统一文件结构
   - 与 Permissions、Roles、Menus 页面保持一致
   - 职责分离：客户端配置和服务端逻辑分离
   - 代码复用：Config 可以在其他页面使用

影响范围：Users 页面
功能完整性：所有功能保持不变
```

---

## 相关文档

- [SmartCrudPage 使用文档](./smart-crud-page-usage.md)
- [CRUD 配置模板](./crud-config-template.md)
- [Permissions 页面重构记录](./crud-refactor-permissions-2024-11-13.md)
- [Roles 页面重构记录](./crud-refactor-roles-2024-11-13.md)
- [Menus 页面重构记录](./crud-refactor-menus-2024-11-13.md)

