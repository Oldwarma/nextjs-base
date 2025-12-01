# RBAC 权限系统文档索引

> **最后更新**: 2024-12-01  
> **版本**: v3.0

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

### 权限字段

```javascript
{
  "actions": [        // Server Actions（函数名匹配）
    "sysGetUserList",
    "sysDeleteUser"
  ],
  
  "apis": [          // API Routes（HTTP 路径匹配）
    "/api/v1/sys/users",
    "GET:/api/v1/sys/users/*"
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

## 📁 相关文件

| 文件 | 说明 |
|------|------|
| `proxy.js` | API 自动拦截（Next.js 16） |
| `lib/core/action-wrapper.js` | Action 包装器 |
| `lib/core/permission-naming.js` | 权限命名解析 |
| `lib/api/fetch-client.js` | 前端 API 调用封装 |
| `lib/api/action-client.js` | 前端 Action 调用封装 |
| `lib/api/api-context.js` | API 上下文获取 |
| `app/(admin)/actions/dao/sys.js` | RBAC 检查函数 |

---

## 🧪 测试

访问 `/zh/test` 测试所有权限级别：

- API Routes: pub / auth / sys
- Server Actions: pub / auth / sys

---

## 📝 更新日志

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

---

**维护团队**: 开发团队  
**最后更新**: 2024-12-01
