# RBAC 页面访问控制

> 基于菜单的自动页面访问控制 - 零配置，完全由 RBAC 系统管理

---

## 🎯 核心原理

**一句话总结**：用户能访问的页面 = 用户有权限的菜单对应的 URL

```
用户有菜单权限 → 可以访问该菜单的 URL
用户无菜单权限 → 显示 403 页面
```

---

## 🏗️ 工作原理

### 系统架构

```
用户访问页面 (例如 /admin/users)
    ↓
PageAccessGuard 自动拦截
    ↓
检查是否 Dashboard? ──Yes→ 允许访问
    ↓ No
检查是否 Admin 角色? ──Yes→ 允许访问
    ↓ No
获取用户的菜单列表
    ↓
检查页面 URL 是否在菜单中?
    ↓
Yes → 允许访问
No  → 显示 403 错误
```

### 核心组件

1. **PageAccessGuard** (`components/admin/page-access-guard.jsx`)
   - 自动拦截所有页面访问
   - 调用 `checkPageAccessAction` 验证权限
   - 显示加载状态和 403 页面

2. **checkPageAccessAction** (`app/(admin)/actions/rbac/user-permissions.js`)
   - 获取用户的菜单权限
   - 检查页面 URL 是否在菜单中
   - 返回访问结果

3. **AdminLayout** (`components/admin/admin-layout.jsx`)
   - 集成 PageAccessGuard
   - 自动应用到所有子页面

---

## 📝 使用方法

### 步骤 1: 创建菜单

在 `/admin/rbac/menus` 创建菜单：

```
菜单名称: User Management
URL: /admin/users
启用: 是
```

### 步骤 2: 创建角色并分配菜单

在 `/admin/rbac/roles` 创建角色并分配菜单：

```
角色名称: User Manager
分配菜单: [User Management]
```

### 步骤 3: 为用户分配角色

在 `/admin/rbac/users` 为用户分配角色：

```
用户: zhangsan@example.com
角色: [User Manager]
```

### 完成！

- 用户可以访问 `/admin/users` 页面
- 菜单会自动显示在侧边栏
- 无需编写任何权限验证代码

---

## 🎨 特性说明

### 1. 自动菜单过滤

侧边栏菜单会根据用户权限自动过滤：

- **Admin 用户**: 看到所有已启用的菜单
- **普通用户**: 只看到被分配的菜单
- **未分配角色**: 不显示任何菜单（除了 Dashboard）

### 2. 自动页面保护

所有页面会自动进行权限检查：

- **Dashboard (`/admin`)**: 所有登录用户都可以访问
- **有菜单权限的页面**: 可以正常访问
- **无菜单权限的页面**: 显示 403 错误

### 3. Admin 特权

`role: 'admin'` 的用户（Better Auth 的基础角色）：

- 可以访问所有页面
- 看到所有菜单
- 无需配置任何权限

---

## 📖 完整示例

### 场景：创建"财务管理"功能

#### 1. 创建页面

```javascript
// app/(admin)/admin/finance/page.js
export default function FinancePage() {
  return (
    <div>
      <h1>Finance Management</h1>
      {/* 页面内容 */}
    </div>
  );
}
// 无需添加任何权限验证代码
```

#### 2. 在后台配置菜单

访问 `/admin/rbac/menus`，创建菜单：

```
名称: Finance Management
URL: /admin/finance
图标: DollarOutlined
排序: 20
启用: 是
```

#### 3. 创建角色并分配菜单

访问 `/admin/rbac/roles`：

```
角色名称: Finance Manager
分配菜单: [Finance Management]
```

#### 4. 为用户分配角色

访问 `/admin/rbac/users`：

```
用户: finance@example.com
分配角色: [Finance Manager]
```

#### 5. 测试

- `finance@example.com` 可以看到"Finance Management"菜单
- 可以访问 `/admin/finance` 页面
- 其他用户看不到菜单，访问页面会显示 403

---

## 🔍 调试技巧

### 检查用户菜单权限

在浏览器控制台执行：

```javascript
// 检查用户的菜单
const result = await fetch('/api/user-menus').then(r => r.json());
console.log('User menus:', result.data);
```

### 常见问题

#### 问题 1: 菜单不显示

**可能原因**：
1. 菜单未启用（`enable: false`）
2. 菜单被隐藏（`hidden: true`）
3. 用户角色未分配该菜单
4. 用户没有分配任何角色

**解决方法**：
1. 检查菜单配置，确保 `enable: true`
2. 检查角色配置，确保菜单已分配
3. 检查用户配置，确保角色已分配

#### 问题 2: 有菜单但访问页面显示 403

**可能原因**：
1. 菜单的 URL 与页面路径不一致
2. 浏览器缓存问题

**解决方法**：
1. 检查菜单配置的 URL 字段
2. 刷新页面（Ctrl+Shift+R）

#### 问题 3: Admin 用户看不到所有菜单

**可能原因**：
1. 用户的 `role` 字段不是 `'admin'`
2. 菜单未启用

**解决方法**：
1. 检查用户的 Better Auth `role` 字段
2. 检查菜单的 `enable` 字段

---

## 📊 权限检查流程

### Admin 用户

```
访问任何页面
    ↓
检查 role === 'admin'? ──Yes→ 允许访问
```

### 普通用户

```
访问页面 (例如 /admin/users)
    ↓
获取用户角色 (roles 数组)
    ↓
获取角色的菜单权限 (menu 数组)
    ↓
检查 /admin/users 是否在菜单的 URL 中?
    ↓
Yes → 允许访问
No  → ❌ 显示 403
```

---

## 🎯 最佳实践

### 1. 菜单 URL 与页面路径一致

确保菜单配置的 URL 与实际页面路径完全一致：

```javascript
// 正确
菜单 URL: /admin/users
页面路径: app/(admin)/admin/users/page.js → /admin/users

// ❌ 错误
菜单 URL: /admin/user
页面路径: app/(admin)/admin/users/page.js → /admin/users
```

### 2. 使用有意义的菜单名称

```javascript
// 好的命名
User Management
Finance Dashboard
Analytics Reports

// ❌ 不好的命名
Page1
功能A
test
```

### 3. 合理的菜单层级

```javascript
// 推荐：2-3 层
系统管理
├── 用户管理
├── 角色管理
└── 权限管理

// ❌ 不推荐：太多层级
系统
└── 管理
    └── 用户
        └── 列表
            └── 查看
```

### 4. Dashboard 始终可访问

不需要为 Dashboard (`/admin`) 创建菜单，所有登录用户都可以访问。

---

## 🚀 迁移指南

### 从手动验证迁移

如果你之前在页面中手动添加了权限检查：

#### 之前的代码

```javascript
// ❌ 不再需要
import { checkPageAccess } from '@/lib/page-auth';

export default async function UsersPage() {
  await checkPageAccess('/admin/users');
  return <div>Content</div>;
}
```

#### 迁移后

```javascript
// 直接返回内容
export default async function UsersPage() {
  return <div>Content</div>;
}
```

只需要：
1. 删除页面中的权限验证代码
2. 在后台配置对应的菜单
3. 为角色分配菜单
4. 完成！

---

## 💡 常见场景

### 场景 1: 创建新功能模块

1. 开发页面组件（无需添加权限代码）
2. 在后台创建菜单
3. 为角色分配菜单
4. 测试

### 场景 2: 临时禁用某个功能

1. 访问 `/admin/rbac/menus`
2. 找到对应菜单
3. 设置 `enable: false`
4. 保存

现在所有用户都无法访问该功能（包括侧边栏菜单也会隐藏）。

### 场景 3: 给特定角色添加新权限

1. 访问 `/admin/rbac/roles`
2. 找到对应角色
3. 点击"Assign Menus"
4. 勾选新菜单
5. 保存

该角色的所有用户立即获得新功能的访问权限。

---

## 📚 相关文档

- [RBAC 系统配置指南](../admin/RBAC_SYSTEM.md) - 如何配置权限
- [RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md) - 技术实现细节
- [RBAC 快速参考](./RBAC_QUICK_REFERENCE.md) - 代码示例

---

## ⚡ 快速参考

### 创建新页面的完整流程

```bash
# 1. 创建页面文件
app/(admin)/admin/your-module/page.js

# 2. 后台配置（3 步）
/admin/rbac/menus → 创建菜单（URL: /admin/your-module）
/admin/rbac/roles → 为角色分配菜单
/admin/rbac/users → 为用户分配角色

# 3. 完成！
```

### 权限检查逻辑

```javascript
有菜单权限? ──Yes→ 可以访问页面
            ──No→  显示 403
```

### Admin 特权

```javascript
role === 'admin' → 可以访问所有页面，看到所有菜单
```

---

## 🎉 总结

这个系统的优势：

1. **零代码**: 页面不需要添加任何权限验证代码
2. **统一管理**: 所有权限在后台 RBAC 系统中配置
3. **自动同步**: 菜单显示和页面访问自动关联
4. **安全**: 自动拦截所有未授权访问
5. **灵活**: 通过后台配置即可调整权限

**现在就开始使用吧！** 🚀

---

MIT License

