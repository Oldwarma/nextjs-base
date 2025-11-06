# 命名规范修复总结

## 背景

在模板化架构重构过程中，为了统一命名规范和提高代码可维护性，我们对 Server Actions 中的方法名进行了标准化。这导致一些页面中的旧方法名失效。

## 修复的方法名映射

### 角色管理相关

| 旧方法名 | 新方法名 | 说明 |
|---------|---------|------|
| `roleBindPermissionsAction` | `assignPermissionsToRoleAction` | 分配权限给角色 |
| `roleBindMenusAction` | `assignMenusToRoleAction` | 分配菜单给角色 |
| `getRolePermissionsAction` | `getRoleDetailAction` | 获取角色详情（包含权限） |
| `getRoleMenusAction` | `getRoleDetailAction` | 获取角色详情（包含菜单） |

### 权限管理相关

| 旧方法名 | 新方法名 | 说明 |
|---------|---------|------|
| `getPermissionTreeForSelectAction` | `getPermissionListForSelectAction` | 获取权限列表（用于选择器） |

### 菜单管理相关

| 旧方法名 | 新方法名 | 说明 |
|---------|---------|------|
| `getMenuTreeForSelectAction` | `getMenuListForParentSelectAction` | 获取菜单列表（用于父级选择） |

## 方法签名变化

### `assignPermissionsToRoleAction`

**旧签名：**
```javascript
roleBindPermissionsAction(roleId, permissionIds, reset, ...)
```

**新签名：**
```javascript
assignPermissionsToRoleAction({ roleId, permissionIds })
```

### `assignMenusToRoleAction`

**旧签名：**
```javascript
roleBindMenusAction(roleId, menuIds, reset, autoBindMenuPermissions)
```

**新签名：**
```javascript
assignMenusToRoleAction({ roleId, menuIds })
```

### `getRoleDetailAction`

**旧签名：**
```javascript
getRolePermissionsAction(roleId)
getRoleMenusAction(roleId)
```

**新签名（统一）：**
```javascript
getRoleDetailAction({ id: roleId })
// 返回完整角色信息：{ id, name, permission, menu, ... }
```

## 影响的文件

### 修复的页面文件

1. **`app/(admin)/admin/rbac/roles/page.js`**
   - 更新了所有方法导入
   - 更新了方法调用签名
   - 修复了参数传递方式

2. **`app/(admin)/admin/rbac/permissions/page.js`**
   - 更新了选择器方法导入

3. **`app/(admin)/layout.js`**
   - 修复了 `admin-auth` 的导入路径

## 命名规范说明

### 标准 CRUD Actions 命名

```javascript
// 基础 CRUD
export const get<Entity>ListAction = crudActions.getList;
export const get<Entity>DetailAction = crudActions.getDetail;
export const create<Entity>Action = crudActions.create;
export const update<Entity>Action = crudActions.update;
export const delete<Entity>Action = crudActions.delete;
export const batchUpdate<Entity>sAction = crudActions.batchUpdate;
export const batchDelete<Entity>sAction = crudActions.batchDelete;
```

### 自定义 Actions 命名

```javascript
// 获取列表（用于选择器）
export const get<Entity>ListForSelectAction = wrapQueryAction(...);

// 业务操作（使用动词 + 对象 + 目标）
export const assign<Resource>To<Target>Action = wrapAdminAction(...);
export const toggle<Entity>StatusAction = wrapAdminAction(...);
```

## 最佳实践

1. **统一使用对象参数**
   - 所有自定义 Action 使用对象参数 `{ param1, param2 }`
   - 便于扩展和可读性

2. **方法名清晰表达意图**
   - 使用完整的动词：`assign`, `toggle`, `bind`, `update`
   - 明确指出操作对象：`PermissionsToRole`, `MenusToRole`

3. **返回值统一格式**
   - 成功：`{ success: true, data: ... }`
   - 失败：`{ success: false, error: '...' }`

4. **使用 `getRoleDetailAction` 替代多个独立方法**
   - 减少网络请求
   - 简化代码逻辑
   - 数据一致性更好

## 迁移指南

### 1. 更新导入

```javascript
// 旧
import {
  roleBindPermissionsAction,
  getRolePermissionsAction,
} from '@/app/(admin)/actions/rbac/admin-roles';

// 新
import {
  assignPermissionsToRoleAction,
  getRoleDetailAction,
} from '@/app/(admin)/actions/rbac/admin-roles';
```

### 2. 更新方法调用

```javascript
// 旧
const permissions = await getRolePermissionsAction(roleId);
await roleBindPermissionsAction(roleId, permissionIds, true);

// 新
const role = await getRoleDetailAction({ id: roleId });
const permissions = role.data?.permission || [];
await assignPermissionsToRoleAction({ roleId, permissionIds });
```

## 验证

所有修复已完成并通过测试：

✅ 角色管理页面
✅ 权限管理页面
✅ 菜单管理页面
✅ 用户管理页面
✅ 套餐管理页面
✅ 积分管理页面

## 相关文档

- [模板化架构实现总结](./TEMPLATE_ARCHITECTURE_IMPLEMENTATION_SUMMARY.md)
- [Lib 目录重构总结](./LIB_REFACTORING_SUMMARY.md)
- [核心库文档](../../lib/core/README.md)
- [模板使用指南](../../templates/crud/README.md)
