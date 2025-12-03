# 权限系统设计指南

> RBAC (Role-Based Access Control) 最佳实践

---

## 🎯 权限模型

### 核心概念

```
User (用户)
  └── roles: String[]           # 角色 ID 数组
        │
        ▼
Role (角色)
  ├── permission: String[]      # 权限 ID 数组
  ├── menu: String[]            # 菜单 ID 数组
  └── inheritMenuPermissions    # 是否继承菜单权限
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
Permission (权限)                    Menu (菜单)
  ├── actions: String[]            ├── url: String
  └── apis: String[]               └── permission: String[]
```

### 数据库模型

```prisma
// 用户
model User {
  id               String   @id @default(uuid())
  role             String   @default("user")      // 基础角色
  roles            String[] @default([])          // RBAC 角色数组
  isBackendAllowed Boolean  @default(false)       // 后台访问权限
  // ...
}

// 角色
model Role {
  id                     String   @id @default(uuid())
  name                   String   @unique
  permission             String[] @default([])    // 权限 ID 数组
  menu                   String[] @default([])    // 菜单 ID 数组
  inheritMenuPermissions Boolean  @default(false) // 继承菜单权限
  enable                 Boolean  @default(true)
  // ...
}

// 权限（树形结构）
model Permission {
  id       String   @id @default(uuid())
  name     String
  parentId String?  @map("parent_id")
  actions  String[] @default([])  // Server Action 名称
  apis     String[] @default([])  // API 路径
  enable   Boolean  @default(true)
  sort     Int      @default(0)
  // ...
}

// 菜单（树形结构）
model Menu {
  id         String   @id @default(uuid())
  name       String
  parentId   String?  @map("parent_id")
  url        String?
  icon       String?
  permission String[] @default([])  // 关联的权限 ID
  enable     Boolean  @default(true)
  hidden     Boolean  @default(false)
  sort       Int      @default(0)
  // ...
}
```

---

## 🔐 权限检查流程

### wrapAction 命名约定

| 前缀 | 权限级别 | 检查逻辑 |
|------|---------|---------|
| `pub` | public | 无需登录，直接执行 |
| `auth` | auth | 需要登录，验证 session |
| `sys` | system | 需要后台权限 + RBAC 检查 |
| `_` | private | 禁止前端调用 |

### 检查流程图

```
请求到达
    │
    ▼
解析 actionName 前缀
    │
    ├── pub → 直接执行
    │
    ├── auth → 检查 session
    │           │
    │           ├── 无 session → 返回 401
    │           └── 有 session → 执行
    │
    ├── sys → 检查 session
    │           │
    │           ├── 无 session → 返回 401
    │           │
    │           └── 有 session → 检查后台权限
    │                   │
    │                   ├── isAdmin → 执行
    │                   │
    │                   ├── isBackendAllowed → RBAC 检查
    │                   │       │
    │                   │       ├── 有权限 → 执行
    │                   │       └── 无权限 → 返回 403
    │                   │
    │                   └── 普通用户 → 返回 403
    │
    └── _ → 返回 403
```

### RBAC 检查逻辑

```javascript
async function checkUserHasActionPermission(userId, actionName) {
  // 1. 获取用户的所有角色
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });
  
  // 2. 获取角色的所有权限
  const roles = await prisma.role.findMany({
    where: { 
      id: { in: user.roles },
      enable: true,
    },
  });
  
  // 3. 收集所有权限 ID
  let permissionIds = new Set();
  for (const role of roles) {
    role.permission.forEach(id => permissionIds.add(id));
    
    // 如果继承菜单权限
    if (role.inheritMenuPermissions) {
      const menus = await prisma.menu.findMany({
        where: { id: { in: role.menu } },
      });
      menus.forEach(menu => {
        menu.permission.forEach(id => permissionIds.add(id));
      });
    }
  }
  
  // 4. 检查权限是否包含该 action
  const permissions = await prisma.permission.findMany({
    where: { 
      id: { in: [...permissionIds] },
      enable: true,
    },
  });
  
  return permissions.some(p => p.actions.includes(actionName));
}
```

---

## 📋 权限配置

### 权限结构设计

```
系统管理 (System)
├── 用户管理 (User Management)
│   ├── 查询用户 → actions: ['sysGetUserList', 'sysGetUserDetail']
│   ├── 创建用户 → actions: ['sysCreateUser']
│   ├── 更新用户 → actions: ['sysUpdateUser']
│   └── 删除用户 → actions: ['sysDeleteUser', 'sysBatchDeleteUser']
│
├── 角色管理 (Role Management)
│   ├── 查询角色 → actions: ['sysGetRoleList', 'sysGetRoleDetail']
│   ├── 创建角色 → actions: ['sysCreateRole']
│   ├── 更新角色 → actions: ['sysUpdateRole']
│   ├── 删除角色 → actions: ['sysDeleteRole']
│   ├── 分配权限 → actions: ['sysAssignPermissionsToRole']
│   └── 分配菜单 → actions: ['sysAssignMenusToRole']
│
└── 操作日志 (Action Logs)
    └── 查看日志 → actions: ['sysGetActionLogList']

内容管理 (CMS)
├── 文章管理 (Post Management)
│   ├── 查询文章 → actions: ['sysGetPostList', 'sysGetPostDetail']
│   ├── 创建文章 → actions: ['sysCreatePost']
│   ├── 更新文章 → actions: ['sysUpdatePost']
│   └── 删除文章 → actions: ['sysDeletePost']
│
└── 优惠券管理 (Coupon Management)
    ├── 查询优惠券 → actions: ['sysGetCouponList', 'sysGetCouponDetail']
    ├── 创建优惠券 → actions: ['sysCreateCoupon']
    ├── 更新优惠券 → actions: ['sysUpdateCoupon']
    └── 删除优惠券 → actions: ['sysDeleteCoupon']
```

### 添加新权限

1. **在数据库中创建权限记录**

```javascript
// scripts/add-permission.js
const permissions = [
  {
    id: nb.pubfn.uuid(),
    name: 'Coupon Management',
    parentId: null,
    actions: [],
    apis: [],
    enable: true,
    sort: 100,
  },
  {
    id: nb.pubfn.uuid(),
    name: 'Query Coupons',
    parentId: '<parent-id>',  // 上面创建的 ID
    actions: ['sysGetCouponList', 'sysGetCouponDetail'],
    apis: [],
    enable: true,
    sort: 1,
  },
  {
    id: nb.pubfn.uuid(),
    name: 'Create Coupon',
    parentId: '<parent-id>',
    actions: ['sysCreateCoupon'],
    apis: [],
    enable: true,
    sort: 2,
  },
  {
    id: nb.pubfn.uuid(),
    name: 'Update Coupon',
    parentId: '<parent-id>',
    actions: ['sysUpdateCoupon'],
    apis: [],
    enable: true,
    sort: 3,
  },
  {
    id: nb.pubfn.uuid(),
    name: 'Delete Coupon',
    parentId: '<parent-id>',
    actions: ['sysDeleteCoupon', 'sysBatchDeleteCoupon'],
    apis: [],
    enable: true,
    sort: 4,
  },
];

await prisma.permission.createMany({ data: permissions });
```

2. **或通过管理后台添加**

访问 `/admin/rbac/permissions` 页面，手动添加权限。

---

## 🍽️ 菜单配置

### 菜单结构

```
后台管理
├── Dashboard
│   └── url: /admin/dashboard
│
├── 系统管理
│   ├── 用户管理
│   │   └── url: /admin/system/users
│   │   └── permission: ['user-query-id']
│   │
│   └── 操作日志
│       └── url: /admin/system/action_logs
│       └── permission: ['log-query-id']
│
├── RBAC
│   ├── 角色管理
│   │   └── url: /admin/rbac/roles
│   │   └── permission: ['role-query-id']
│   │
│   ├── 权限管理
│   │   └── url: /admin/rbac/permissions
│   │   └── permission: ['permission-query-id']
│   │
│   └── 菜单管理
│       └── url: /admin/rbac/menus
│       └── permission: ['menu-query-id']
│
└── 内容管理
    ├── 文章管理
    │   └── url: /admin/cms/posts
    │   └── permission: ['post-query-id']
    │
    └── 优惠券管理
        └── url: /admin/cms/coupons
        └── permission: ['coupon-query-id']
```

### 菜单权限继承

当 `Role.inheritMenuPermissions = true` 时：

```
角色 A
├── menu: ['menu-1', 'menu-2']
├── permission: ['perm-1']
└── inheritMenuPermissions: true

菜单 1 (menu-1)
└── permission: ['perm-2', 'perm-3']

菜单 2 (menu-2)
└── permission: ['perm-4']

用户最终权限 = perm-1 + perm-2 + perm-3 + perm-4
```

**使用场景：**
- 简化权限分配：只需分配菜单，自动获得菜单关联的权限
- 菜单即权限：适合按功能模块划分权限的场景

---

## 🔧 Action 命名规范

### 命名格式

```
{prefix}{Action}{Resource}
```

| 部分 | 说明 | 示例 |
|------|------|------|
| prefix | 权限级别 | `sys`, `auth`, `pub` |
| Action | 操作类型 | `Get`, `Create`, `Update`, `Delete`, `Batch` |
| Resource | 资源名称 | `User`, `Role`, `Coupon` |

### 示例

```javascript
// 系统级别（后台管理）
sysGetUserList        // 获取用户列表
sysGetUserDetail      // 获取用户详情
sysCreateUser         // 创建用户
sysUpdateUser         // 更新用户
sysDeleteUser         // 删除用户
sysBatchDeleteUser    // 批量删除用户
sysAssignRolesToUser  // 分配角色给用户

// 认证级别（前台登录用户）
authGetProfile        // 获取个人信息
authUpdateProfile     // 更新个人信息
authGetMyOrders       // 获取我的订单

// 公开级别（无需登录）
pubGetConfig          // 获取配置
pubGetProductList     // 获取商品列表
pubGetCouponList      // 获取优惠券列表
```

### createCrudActions 自动生成

```javascript
const crudActions = createCrudActions({
  modelName: 'coupon',
  // ...
});

// 自动生成的 action 名称：
// sysGetCouponList
// sysGetCouponDetail
// sysCreateCoupon
// sysUpdateCoupon
// sysDeleteCoupon
// sysBatchUpdateCoupon
// sysBatchDeleteCoupon
```

---

## 🛡️ 前端权限控制

### 菜单过滤

```javascript
// 获取用户可访问的菜单
export async function getUserMenusAction() {
  const user = await getCurrentUser();
  
  // Admin 返回所有菜单
  if (user.role === 'admin') {
    return await getAllMenus();
  }
  
  // 获取用户角色
  const roles = await prisma.role.findMany({
    where: { id: { in: user.roles }, enable: true },
  });
  
  // 收集所有菜单 ID
  const menuIds = new Set();
  roles.forEach(role => {
    role.menu.forEach(id => menuIds.add(id));
  });
  
  // 获取菜单
  const menus = await prisma.menu.findMany({
    where: { 
      id: { in: [...menuIds] },
      enable: true,
      hidden: false,
    },
    orderBy: { sort: 'asc' },
  });
  
  // 转换为树形结构
  return nb.pubfn.tree.arrayToTree(menus);
}
```

### 按钮权限

```javascript
// hooks/use-permission.js
export function usePermission() {
  const [permissions, setPermissions] = useState([]);
  
  useEffect(() => {
    loadUserPermissions().then(setPermissions);
  }, []);
  
  const hasPermission = useCallback((actionName) => {
    return permissions.includes(actionName);
  }, [permissions]);
  
  return { hasPermission };
}

// 使用
function CouponPage() {
  const { hasPermission } = usePermission();
  
  return (
    <div>
      {hasPermission('sysCreateCoupon') && (
        <Button onClick={handleCreate}>Create</Button>
      )}
      
      {hasPermission('sysDeleteCoupon') && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </div>
  );
}
```

### 页面访问控制

```javascript
// components/admin/page-access-guard.jsx
export default function PageAccessGuard({ children, requiredPermission }) {
  const { hasPermission, loading } = usePermission();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!hasPermission(requiredPermission)) {
    return <AccessDenied />;
  }
  
  return children;
}

// 使用
export default function CouponPage() {
  return (
    <PageAccessGuard requiredPermission="sysGetCouponList">
      <CouponManagement />
    </PageAccessGuard>
  );
}
```

---

## 📝 常见场景

### 1. 添加新功能模块

1. 创建 Prisma 模型
2. 创建 Server Actions（使用 `createCrudActions`）
3. 创建管理页面（使用 `SmartCrudPage`）
4. 添加权限记录
5. 添加菜单记录
6. 分配权限给角色

### 2. 自定义权限检查

```javascript
export const sysSpecialAction = wrapAction('sysSpecialAction', async (params, ctx) => {
  const { userId, isAdmin, user } = ctx;
  
  // 额外的业务权限检查
  if (!isAdmin && !user.isVip) {
    return { success: false, error: 'VIP only' };
  }
  
  // 业务逻辑
  return { success: true };
});
```

### 3. 跳过权限检查

```javascript
// 内部调用，不走权限检查
const result = await crudActions._dao.getList({
  pageIndex: 1,
  pageSize: 100,
});

// 或使用 pub 前缀
export const pubGetOptions = wrapAction('pubGetOptions', async () => {
  // 公开接口，无需权限
});
```

### 4. 数据权限（行级权限）

```javascript
export const authGetMyOrders = wrapAction('authGetMyOrders', async (params, ctx) => {
  const { userId } = ctx;
  
  // 只能查询自己的订单
  const result = await prisma.order.findMany({
    where: { 
      userId,  // 限制只能查自己的
      deletedAt: null,
    },
  });
  
  return { success: true, data: result };
});
```

---

## ✅ 检查清单

添加新功能时，确保：

- [ ] Server Actions 使用正确的命名前缀
- [ ] 创建对应的权限记录
- [ ] 权限记录包含所有相关的 action 名称
- [ ] 创建菜单记录（如果需要）
- [ ] 菜单关联正确的权限
- [ ] 分配权限给相应角色
- [ ] 前端按钮根据权限显示/隐藏
- [ ] 测试不同角色的访问权限

---

## 🔍 调试技巧

### 查看权限检查日志

```javascript
// lib/core/action-wrapper.js
console.log(`[RBAC] User ${userId} checking permission for ${actionName}`);
console.log(`[RBAC] User roles:`, user.roles);
console.log(`[RBAC] Has permission:`, hasPermission);
```

### 查看用户权限

```javascript
// 在控制台查看当前用户的所有权限
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { roles: true },
});

const roles = await prisma.role.findMany({
  where: { id: { in: user.roles } },
  include: { permission: true },
});

console.log('User permissions:', roles.flatMap(r => r.permission));
```

### 操作日志

所有 `sys` 前缀的 action 都会记录到 `action_logs` 表：

```sql
SELECT * FROM action_logs 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC 
LIMIT 20;
```

