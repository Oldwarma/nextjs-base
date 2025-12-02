# RBAC 权限系统文档索引

> **最后更新**: 2024-12-01  
> **版本**: v3.1

本目录包含完整的 RBAC 权限系统设计与实施文档。

---

## 📚 文档导航

### 🎯 核心文档（必读）

1. **[权限命名约定指南](./PERMISSION_NAMING_CONVENTION.md)** ⭐️ **推荐首先阅读**
   - 像 vk-unicloud 一样的自动权限拦截
   - API 路由自动拦截（proxy.js）
   - Server Actions 命名约定（wrapAction）
   - 前端调用封装（fetchApi / callAction）
   - 多层级路径支持

2. **[权限系统最终设计总结](./PERMISSION_SYSTEM_FINAL_DESIGN.md)**
   - 最终定案的设计方案
   - 设计决策过程
   - 最佳实践和安全建议

3. **[Actions 路径配置指南](./ACTIONS_PATH_GUIDE.md)**
   - 如何配置 `actions` 字段
   - 通配符规则详解
   - 实际案例和最佳实践

### 🔧 实施文档

4. **[权限系统扩展方案](./PERMISSION_SYSTEM_EXTENSION.md)**
   - 技术实现细节
   - 代码示例和使用方法
   - API 中间件实现
   - 性能优化建议

5. **[数据库迁移指南](./DATABASE_MIGRATION_GUIDE.md)**
   - 添加 `apis` 字段的迁移步骤
   - 迁移脚本和验证方法
   - 回滚方案

### 📖 参考文档

6. **[Server Actions vs Client Actions](./SERVER_VS_CLIENT_ACTIONS.md)**
   - 概念对比和区别说明
   - 使用场景划分
   - 权限验证流程对比

---

## 🚀 快速开始

### 新手入门

```
1. PERMISSION_NAMING_CONVENTION.md (了解自动权限拦截)
   ↓
2. 创建 API: app/api/v1/pub|auth|sys/xxx/route.js
   ↓
3. 创建 Action: pubXxx / authXxx / sysXxx
   ↓
4. 前端调用: fetchApi() / callAction()
```

### 快速示例

#### 1. 创建 API（自动拦截）

```javascript
// app/api/v1/pub/config/route.js - 公开
// app/api/v1/auth/user/route.js  - 需要登录
// app/api/v1/sys/admin/route.js  - 需要后台权限
```

#### 2. 创建 Action（命名约定）

```javascript
import { wrapAction } from '@/lib/core/action-wrapper';

export const pubGetConfig = wrapAction('pubGetConfig', handler);   // 公开
export const authGetProfile = wrapAction('authGetProfile', handler); // 登录
export const sysGetUsers = wrapAction('sysGetUsers', handler);       // 后台
```

#### 3. 前端调用（自动 Toast）

```javascript
import { fetchApi } from '@/lib/api/fetch-client';
import { callAction } from '@/lib/api/action-client';

// API 调用 - 401 自动跳转登录，403 自动 toast
const { data, error } = await fetchApi('/api/v1/auth/user/profile');

// Action 调用 - 同样自动处理
const { data, success } = await callAction(authGetProfile);
```

---

## 🎯 核心设计

### 权限级别

| 前缀/路径 | 级别 | 说明 |
|----------|------|------|
| `pub` / `/api/pub/*` | public | 公开，无需登录 |
| `auth` / `/api/auth/*` | auth | 需要登录 |
| `sys` / `/api/sys/*` | system | 需要后台权限 + RBAC |
| `_` | private | 私有，不能被前端调用 |

### 权限来源（v3.1 新增）

用户的权限来自两个渠道：

1. **角色权限**：角色(roles) → 权限(permissions) *（始终生效）*
2. **菜单权限**：菜单(menus) → 权限(permissions) *（可选，需开启继承）*

```
用户 → 角色 → 权限（始终）
        ↓
      菜单 → 权限（可选继承）
```

### 权限字段

```javascript
{
  "actions": [        // Server Actions（函数名匹配）
    "sysGetUserList",
    "sysDeleteUser",
    "sysCreate*",      // 支持通配符
    "**/get*Action"
  ],
  
  "apis": [          // API Routes（HTTP 路径匹配）
    "/api/v1/sys/users",
    "GET:/api/v1/sys/users/*",
    "POST:/api/upload"
  ]
}
```

### 检查流程

```
请求 → 解析权限级别 → 登录检查 → admin 检查 → RBAC 检查 → 执行
```

- **admin** 直接通过所有检查
- **非 admin** 需要 `isBackendAllowed` + RBAC 权限

---

## 🔑 菜单权限继承（v3.1 新增）

### 功能说明

菜单可以关联权限，当角色分配菜单时，可以选择是否同时继承菜单的权限。

### 使用方式

1. **在菜单管理页面**：为菜单分配权限（Assign Permissions）
2. **在角色管理页面**：分配菜单时，开启 "Inherit Menu Permissions" 开关

### 开关行为

| 开关状态 | 行为 |
|---------|------|
| **关闭**（默认） | 菜单仅控制页面访问权限，不授予额外 API/Action 权限 |
| **开启** | 菜单同时授予页面访问权限和菜单关联的所有权限 |

### 数据库字段

```javascript
// roles 表
{
  "id": "role-uuid",
  "name": "Editor",
  "menu": ["menu-uuid-1", "menu-uuid-2"],
  "permission": ["perm-uuid-1", "perm-uuid-2"],
  "inheritMenuPermissions": true  // v3.1 新增
}

// menus 表
{
  "id": "menu-uuid-1",
  "name": "User Management",
  "url": "/admin/rbac/users",
  "permission": ["perm-uuid-3", "perm-uuid-4"]  // 菜单关联的权限
}
```

---

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `proxy.js` | API 自动拦截（Next.js 16） |
| `lib/core/action-wrapper.js` | Action 包装器（wrapAction） |
| `lib/core/crud-helper.js` | CRUD Actions 生成器 |
| `lib/core/permission-naming.js` | 权限命名解析 |
| `lib/api/fetch-client.js` | 前端 API 调用封装 |
| `lib/api/action-client.js` | 前端 Action 调用封装 |
| `lib/api/api-context.js` | API 上下文获取 |
| `app/(admin)/actions/dao/sys.js` | RBAC 检查函数 |
| `app/(admin)/actions/dao/base.js` | BaseDAO 基类 |

---

## 🧪 测试

访问 `/zh/test` 测试所有权限级别：

- API Routes: pub / auth / sys
- Server Actions: pub / auth / sys

---

## 📝 更新日志

### v3.1 (2024-12-01)

**新功能**：菜单权限继承

- 菜单可以关联权限（`permission` 字段）
- 角色分配菜单时可选择是否继承权限（`inheritMenuPermissions` 字段）
- 权限来源：角色权限 + 菜单权限（可选）

**Bug 修复**：

- 修复 `crud-helper.js` 中 update/delete/getDetail 参数传递错误
- 修复 `SmartCrudPage` 调用 update 时参数格式不正确
- 统一 handler 签名为 `handler(params, ctx)`

**改进**：

- `getMenuTreeForSelectAction` 支持 `includeRootOption` 参数
- Assign Menus 弹窗不再显示 "Root Menu" 选项
- Assign Menus 弹窗添加 "Inherit Menu Permissions" 开关

### v3.0 (2024-12-01)

**重大更新**：自动权限拦截

- 新增 `proxy.js` 自动拦截 API 请求
- 新增 `wrapAction` 统一 Action 包装器
- 新增 `fetchApi` / `callAction` 前端封装
- 支持多层级路径权限识别
- 自动 Toast 提示（使用 shadcn/sonner）
- 401 自动跳转登录

**新增文件**：
- `lib/api/fetch-client.js` - 前端 API 调用封装
- `lib/api/action-client.js` - 前端 Action 调用封装
- `app/(client)/actions/test-actions.js` - 测试 Actions
- `app/(client)/[locale]/test/page.js` - 测试页面

**更新文档**：
- [权限命名约定指南](./PERMISSION_NAMING_CONVENTION.md) - 完整重写

### v2.0 (2024-11-14)

**重大更新**：简化权限字段设计

- 移除 `client_actions` 字段（与 `actions` 合并）
- 移除 `resources` 字段（YAGNI 原则）
- 改名 `api_routes` → `apis`（更简洁）
- 最终定案：只需要 2 个字段（`actions` 和 `apis`）

### v1.0 (2024-11-05)

- 初始 RBAC 系统实现
- 基础文档创建

---

## 🎓 常见问题

### Q1: API 和 Action 有什么区别？

| | API Routes | Server Actions |
|---|------------|----------------|
| 调用方式 | HTTP 请求 | 函数调用 |
| 权限配置 | 路径匹配 | 函数名匹配 |
| 前端封装 | `fetchApi()` | `callAction()` |

### Q2: admin 角色和 RBAC 的关系？

- `admin` 角色自动拥有所有权限（跳过 RBAC 检查）
- `user` 角色需要通过 RBAC 检查
- `user` + `isBackendAllowed = true` 可以访问后台，但受 RBAC 限制

### Q3: 如何禁用自动 Toast？

```javascript
// API
await fetchApi('/api/xxx', {}, { showErrorToast: false });

// Action
await callAction(action, params, { showErrorToast: false });
```

### Q4: 如何禁用 401 自动跳转？

```javascript
// API
await fetchApi('/api/xxx', {}, { redirectOnUnauth: false });

// Action
await callAction(action, params, { redirectOnUnauth: false });
```

### Q5: 菜单权限继承和角色权限有什么区别？

| | 角色权限 | 菜单权限 |
|---|---------|---------|
| 来源 | 角色 → 权限 | 菜单 → 权限 |
| 生效条件 | 始终生效 | 需要开启 `inheritMenuPermissions` |
| 用途 | 功能权限 | 页面相关权限 |

### Q6: wrapAction 的 handler 签名是什么？

```javascript
handler(params, ctx)
```

- **params** - 前端传入的参数对象
- **ctx** - 上下文 `{ userId, isAdmin, user }`

### Q7: CRUD Actions 如何传参？

```javascript
// 创建
await actions.create({ name: 'xxx', ... });

// 更新 - 必须包含 id
await actions.update({ id: 'xxx', name: 'new name', ... });

// 删除 - 直接传 id 或 { id }
await actions.delete('xxx');
await actions.delete({ id: 'xxx' });

// 获取详情 - 直接传 id 或 { id }
await actions.getDetail('xxx');
await actions.getDetail({ id: 'xxx' });
```

---

**维护团队**: 开发团队  
**最后更新**: 2024-12-01
