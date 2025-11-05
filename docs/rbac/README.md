# RBAC 权限管理系统文档

> 完整的 RBAC (Role-Based Access Control) 权限管理系统实现

---

## 📚 文档导航

### 对于管理员

- **[RBAC 系统配置指南](../admin/RBAC_SYSTEM.md)**
  - 如何配置权限、角色、菜单
  - 如何为用户分配权限
  - 权限配置最佳实践
  - 常见场景配置示例

### 对于开发者

- **[RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)**
  - 技术架构说明
  - 核心文件和 API 说明
  - 完整代码示例
  - 开发最佳实践

- **[页面访问控制](./PAGE_ACCESS_CONTROL.md)** ⭐ 推荐
  - 基于菜单的自动页面保护
  - 完全由 RBAC 系统管理
  - 零代码实现

- **[404 vs 403 错误处理](./PAGE_404_VS_403.md)** 🚦 重要机制
  - 正确区分页面不存在和无权访问
  - 先检查页面存在性，再验证权限
  - 提升用户体验

- **[菜单树自动补全](./MENU_TREE_FIX.md)** 🔧 核心机制
  - 自动补全缺失的父级菜单
  - 保证菜单层级结构完整
  - 优化用户体验

- **[RBAC 快速参考](./RBAC_QUICK_REFERENCE.md)**
  - 常用代码片段
  - API 快速查询
  - 错误处理示例

### 对于测试人员

- **[RBAC 测试清单](./RBAC_TESTING_CHECKLIST.md)**
  - 完整测试场景
  - 测试步骤和预期结果
  - 测试报告模板

---

## 🎯 系统概述

RBAC 权限管理系统是一个完整的基于角色的访问控制解决方案，提供：

### 核心功能

1. **菜单权限控制** 
   - 根据用户角色自动过滤侧边栏菜单
   - 支持多层级菜单树
   - 支持外部链接菜单

2. **页面访问控制** ⭐ 自动化
   - **基于菜单**: 用户有菜单权限就能访问对应页面
   - **零代码**: 页面无需添加任何权限验证代码
   - **自动拦截**: 所有后台页面自动进行权限检查
   - **后台管理**: 完全通过 RBAC 系统配置，无需写配置文件

3. **操作权限控制**
   - Server Actions 权限验证
   - 支持通配符匹配
   - 灵活的权限组合

4. **前端权限控制**
   - React Hooks 支持
   - 按钮显示/隐藏
   - 动态权限检查

---

## 🚀 快速开始

### 第一次使用（管理员）

1. 访问 `/admin/permissions` 创建权限体系
2. 访问 `/admin/menus` 创建菜单
3. 访问 `/admin/roles` 创建角色并分配权限
4. 访问 `/admin/users` 为用户分配角色

详细步骤参考: [RBAC 系统配置指南](../admin/RBAC_SYSTEM.md)

### 第一次开发（开发者）

#### 创建新页面（完全自动化） ⭐

```javascript
// 1. 创建页面 - 无需任何权限验证代码！
// app/(admin)/admin/your-module/page.js
export default function YourModulePage() {
	return <div>Your Module Content</div>;
}

// 2. 在后台配置菜单
// 访问 /admin/rbac/menus 创建菜单：
// - 名称: Your Module
// - URL: /admin/your-module  ✅ 对应页面路径
// - 启用: 是

// 3. 为角色分配菜单
// 访问 /admin/rbac/roles 为角色分配菜单

// 4. 为用户分配角色
// 访问 /admin/rbac/users 为用户分配角色

// ✅ 完成！用户现在可以：
// - 在侧边栏看到菜单
// - 访问页面（自动权限检查）
// - 无需任何代码修改
```

#### Server Action 权限验证

```javascript
// 1. 在 Server Action 中验证权限
'use server';
import { checkActionPermission } from '@/lib/permission-auth';

export async function createUserAction(data) {
  const permCheck = await checkActionPermission('/admin/actions/user/create');
  if (!permCheck.hasPermission) {
    return { success: false, error: 'Permission denied' };
  }
  // 执行业务逻辑
}

// 2. 在前端根据权限显示按钮
'use client';
import { usePermission } from '@/hooks/use-permission';

export default function MyComponent() {
  const { hasPermission } = usePermission();
  
  return (
    <div>
      {hasPermission('user-create') && (
        <Button>Create User</Button>
      )}
    </div>
  );
}
```

详细文档参考: 
- [页面访问控制](./PAGE_ACCESS_CONTROL.md) ⭐ 推荐
- [RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)

---

## 📂 文件结构

```
jimeng-saas/
├── app/(admin)/
│   ├── actions/
│   │   ├── rbac/
│   │   │   ├── admin-menus.js          # 菜单管理 Actions
│   │   │   ├── admin-permissions.js    # 权限管理 Actions
│   │   │   ├── admin-roles.js          # 角色管理 Actions
│   │   │   ├── admin-users.js          # 用户管理 Actions
│   │   │   └── user-permissions.js     # 用户权限查询 Actions ✨新增
│   │   ├── dao/
│   │   │   └── sys.js                  # 系统数据访问层（权限、角色、菜单）
│   │   └── examples/
│   │       └── protected-action-example.js  # 权限验证示例 ✨新增
│   └── admin/
│       └── examples/
│           └── protected-page-example.jsx   # 前端权限示例 ✨新增
├── components/admin/
│   └── admin-layout.jsx                # 管理后台布局（RBAC 菜单过滤）✅更新
├── lib/
│   ├── permission-auth.js              # 权限验证核心库
│   ├── page-auth.js                    # 页面访问控制 ✨新增
│   └── admin-auth.js                   # 管理员验证
├── hooks/
│   └── use-permission.js               # 前端权限 Hooks ✨新增
└── docs/
    ├── rbac/
    │   ├── README.md                   # 本文件 ✨新增
    │   ├── RBAC_IMPLEMENTATION_GUIDE.md    # 实现指南 ✨新增
    │   ├── RBAC_QUICK_REFERENCE.md         # 快速参考 ✨新增
    │   └── RBAC_TESTING_CHECKLIST.md       # 测试清单 ✨新增
    └── admin/
        └── RBAC_SYSTEM.md              # 配置指南 ✅更新
```

---

## 🔑 核心 API

### Server-Side (服务端)

```javascript
// 权限验证
import { 
  checkActionPermission,    // 验证 Action 路径权限
  checkPermission,           // 验证权限 ID
  checkRole,                 // 验证角色
  checkAnyPermission,        // 验证多个权限之一
  checkAllPermissions        // 验证所有权限
} from '@/lib/permission-auth';

// 页面访问控制
import { 
  checkPageAccess,           // 验证页面访问（重定向版）
  canAccessPage              // 验证页面访问（返回结果版）
} from '@/lib/page-auth';
```

### Client-Side (客户端)

```javascript
// React Hooks
import { 
  usePermission,             // 权限检查
  usePageAccess,             // 页面访问检查
  useUserMenus               // 用户菜单
} from '@/hooks/use-permission';

// Server Actions（客户端调用）
import {
  getUserAccessibleMenusAction,    // 获取用户菜单
  getUserPermissionIdsAction,      // 获取用户权限列表
  checkPageAccessAction,           // 检查页面访问
  getUserRolesAction               // 获取用户角色
} from '@/app/(admin)/actions/rbac/user-permissions';
```

---

## 💡 使用示例

### 示例 1: 保护 Server Action

```javascript
'use server';
import { checkActionPermission } from '@/lib/permission-auth';

export async function deleteUserAction(userId) {
  // ✅ 验证权限
  const permCheck = await checkActionPermission('/admin/actions/user/delete');
  
  if (!permCheck.hasPermission) {
    return { success: false, error: 'Permission denied' };
  }

  // 执行删除
  await deleteUser(userId);
  return { success: true };
}
```

### 示例 2: 保护页面

```javascript
// app/(admin)/admin/users/page.js
import { checkPageAccess } from '@/lib/page-auth';

export default async function UsersPage() {
  // ✅ 验证页面访问权限
  await checkPageAccess('/admin/users');

  return <div>Users Management</div>;
}
```

### 示例 3: 前端权限控制

```javascript
'use client';
import { usePermission } from '@/hooks/use-permission';
import { Button } from 'antd';

export default function MyComponent() {
  const { hasPermission } = usePermission();

  return (
    <div>
      {/* ✅ 根据权限显示按钮 */}
      {hasPermission('user-delete') && (
        <Button danger>Delete</Button>
      )}
    </div>
  );
}
```

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     RBAC 权限系统                        │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  菜单权限控制   │  │ 页面访问控制 │  │ 操作权限控制     │
│                │  │              │  │                 │
│ AdminLayout    │  │ checkPage    │  │ checkAction     │
│ getUserMenus   │  │ Access       │  │ Permission      │
└────────────────┘  └──────────────┘  └─────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼───────────┐
                │    权限验证核心层      │
                │                       │
                │  permission-auth.js  │
                │  page-auth.js        │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │    数据访问层 (DAO)   │
                │                       │
                │  sys.js              │
                │  getUserRoleIds      │
                │  getUserPermissions  │
                │  getUserMenus        │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │      MongoDB 数据库    │
                │                       │
                │  users                │
                │  roles                │
                │  permissions          │
                │  menus                │
                └───────────────────────┘
```

---

## ✨ 主要特性

### 1. 灵活的权限模型

- **用户-角色多对多**: 一个用户可以有多个角色
- **角色-权限多对多**: 一个角色可以有多个权限
- **角色-菜单多对多**: 一个角色可以访问多个菜单
- **权限树形结构**: 支持多层级权限组织

### 2. 强大的通配符支持

```javascript
// 单层通配符
actions: ["/admin/actions/user/*"]  // 匹配 /admin/actions/user/create

// 多层通配符
actions: ["/admin/actions/**"]      // 匹配所有 /admin/actions 下的路径
```

### 3. 完整的前后端支持

- **后端**: Server Actions 权限验证
- **前端**: React Hooks + 组件权限控制
- **页面**: 服务端和客户端双重保护

### 4. 优秀的开发体验

- TypeScript 类型支持
- 清晰的错误提示
- 完整的代码示例
- 详细的文档说明

---

## 📖 相关文档

### 系统文档
- [字段命名规范](../NAMING_STANDARDS.md)
- [数据库 API 文档](../database/DB_API_GUIDE.md)
- [BaseDAO 文档](../admin/BASE_DAO.md)

### 开发指南
- [Smart CRUD 开发指南](../admin/SMART_CRUD_GUIDE.md)
- [Server Actions 开发规范](../SERVER_ACTIONS.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📝 更新日志

### v1.0.0 (2025-11-04)

#### ✨ 新增功能
- ✅ 完整的 RBAC 权限管理系统
- ✅ 菜单权限自动过滤
- ✅ 页面访问控制（服务端+客户端）
- ✅ Server Actions 权限验证
- ✅ 前端权限控制 Hooks
- ✅ 完整的文档和示例

#### 📝 文档
- ✅ RBAC 实现指南
- ✅ RBAC 快速参考
- ✅ RBAC 测试清单
- ✅ RBAC 配置指南（更新）

#### 🔧 核心文件
- ✅ `lib/permission-auth.js` - 权限验证核心
- ✅ `lib/page-auth.js` - 页面访问控制
- ✅ `hooks/use-permission.js` - 前端 Hooks
- ✅ `app/(admin)/actions/rbac/user-permissions.js` - 用户权限查询
- ✅ `components/admin/admin-layout.jsx` - 菜单过滤（更新）

---

## 📞 获取帮助

如有问题，请参考：

1. **配置问题** → [RBAC 系统配置指南](../admin/RBAC_SYSTEM.md)
2. **开发问题** → [RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)
3. **代码示例** → [RBAC 快速参考](./RBAC_QUICK_REFERENCE.md)
4. **测试问题** → [RBAC 测试清单](./RBAC_TESTING_CHECKLIST.md)

---

## 📄 许可证

MIT License

---

**Happy Coding! 🎉**

