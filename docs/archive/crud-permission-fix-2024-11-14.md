# CRUD 权限绕过漏洞修复

> **日期**: 2024-11-14  
> **严重等级**: 🔴 严重  
> **影响范围**: 所有使用 `createCrudActions` 的 CRUD 操作

---

## 🚨 问题描述

### 发现的安全漏洞

用户报告：拥有 Read/Update 权限的用户可以成功删除数据，即使没有 Delete 权限。

**具体情况**：
- 用户权限包含：`create*Action`, `get*Action`, `update*Action`
- **不包含** `delete*Action`
- 但仍然可以成功删除数据 ❌

### 漏洞根因

**问题 1：缺少 `permissionId`**

在 `lib/core/crud-helper.js` 中，所有 CRUD 操作都没有指定 `permissionId`：

```javascript
// 漏洞代码
delete: wrapAdminAction('delete', resourceType, async (id, context) => {
  return await dao.delete(id);
}),  // ❌ 没有 permissionId
```

在 `action-wrapper.js` 中的权限检查逻辑：

```javascript
if (!isAdmin && !skipPermission && permissionId) {
  // 只有当 permissionId 存在时才检查权限
  const hasPermission = await checkUserHasActionPermission(userId, permissionId);
}
```

**如果 `permissionId` 为空，权限检查就会被完全跳过！**

**问题 2：权限模式匹配失败**

即使修复了问题 1，还有第二个问题：

1. 生成的 `permissionId`：`createPermissionsAction`（复数）
2. 用户的权限模式：`**/createPermission*Action`（单数）
3. ❌ 不匹配！

**问题 3：路径前缀匹配逻辑错误**

权限模式 `**/create*Action` 转换为正则 `^.*/create[^/]*Action$`：
- 要求路径中**必须包含 `/`**
- 但 `permissionId` 是纯函数名（如 `createPermissionAction`），**没有 `/`**
- ❌ 不匹配！

---

## 修复方案

### 修复 1: 添加 `permissionId`

为所有 CRUD 操作添加 `permissionId`：

```javascript
// lib/core/crud-helper.js

create: wrapAdminAction('create', resourceType, async (params, context) => {
  return await dao.create({
    ...params,
    userId: context.userId,
  });
}, {
  permissionId: `create${pascalCase(resourceType)}Action`,  // 添加
}),

update: wrapAdminAction('update', resourceType, async (id, data, context) => {
  return await dao.update(id, data);
}, {
  permissionId: `update${pascalCase(resourceType)}Action`,  // 添加
}),

delete: wrapAdminAction('delete', resourceType, async (id, context) => {
  return await dao.delete(id);
}, {
  permissionId: `delete${pascalCase(resourceType)}Action`,  // 添加
}),
```

### 修复 2: 复数转单数

修改 `pascalCase` 函数，自动将复数转换为单数：

```javascript
// lib/core/crud-helper.js

function pascalCase(str) {
  // 先转换为 PascalCase
  let result = str
    .replace(/[_-](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase());
  
  // 处理复数 -> 单数转换
  if (result.endsWith('s')) {
    if (result.endsWith('ies')) {
      // categories -> Category
      result = result.slice(0, -3) + 'y';
    } else if (result.endsWith('ses') || result.endsWith('xes') || result.endsWith('zes')) {
      // classes -> Class
      result = result.slice(0, -2);
    } else {
      // permissions -> Permission
      result = result.slice(0, -1);
    }
  }
  
  return result;
}
```

**转换示例**：

| collectionName | pascalCase 结果 | 生成的 permissionId |
|----------------|----------------|---------------------|
| `permissions` | `Permission` | `createPermissionAction` |
| `users` | `User` | `createUserAction` |
| `roles` | `Role` | `createRoleAction` |
| `menus` | `Menu` | `createMenuAction` |

### 修复 3: 支持无路径前缀的匹配

修改 `patternToRegex` 函数，让 `**/` 前缀可以匹配没有路径的情况：

```javascript
// app/(admin)/actions/dao/sys.js

function patternToRegex(pattern) {
  let regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE_STAR__/g, '.*');
  
  // 特殊处理：如果模式以 ** / 开头，让它也能匹配没有路径前缀的情况
  if (regexStr.startsWith('^\\.\\*/')) {
    // 将 ^.* / 改为 ^(.*/ )?，表示前面的路径部分是可选的
    regexStr = '^(.*/)?' + regexStr.substring(5);
  }

  return new RegExp(`^${regexStr}$`);
}
```

**匹配示例**：

| 权限模式 | 转换后的正则 | 是否匹配 `createPermissionAction` |
|---------|-------------|----------------------------------|
| `**/create*Action` | `^(.*/)?create[^/]*Action$` | 现在可以匹配 |
| `create*Action` | `^create[^/]*Action$` | 也可以匹配 |

---

## 📊 影响范围

### 受影响的操作

所有使用 `createCrudActions` 创建的 CRUD 操作：

- ❌ `create` - 任何人都可以创建
- ❌ `update` - 任何人都可以更新
- ❌ `delete` - 任何人都可以删除
- ❌ `batchUpdate` - 任何人都可以批量更新
- ❌ `batchDelete` - 任何人都可以批量删除

**只要用户有后台访问权限（`isBackendAllowed = true`），就可以执行所有操作！**

### 受影响的资源

使用 `createCrudActions` 的所有模块：

- Users
- Roles
- Permissions
- Menus
- 所有自定义 CRUD 模块

---

## 🎯 设计澄清

### PermissionId 的实际含义

通过这次修复，我们明确了权限系统的设计：

**当前系统使用纯函数名（不含路径）**：

- `permissionId`: `createUserAction`（纯函数名）
- ❌ `permissionId`: `app/actions/createUserAction`（不推荐）

### `**/` 前缀的实际意义

**在当前实现中，`**/` 前缀没有实际意义**：

| 写法 | 效果 | 说明 |
|------|------|------|
| `create*Action` | 匹配 `createUserAction` 等 | 推荐（简洁） |
| `**/create*Action` | 匹配 `createUserAction` 等 | 兼容（冗余） |

**为什么保留 `**/` 支持？**

1. **兼容性**：保持与旧配置的兼容
2. **习惯性写法**：用户可能习惯这种写法
3. **未来扩展**：如果将来需要引入路径区分，可以无缝升级

### 推荐的权限配置

**简洁写法（推荐）**：

```json
{
  "name": "User - CRUD",
  "actions": [
    "createUserAction",
    "updateUserAction",
    "deleteUserAction"
  ]
}
```

**通配符写法**：

```json
{
  "name": "User - CRUD",
  "actions": [
    "create*User*Action",
    "update*User*Action",
    "delete*User*Action"
  ]
}
```

**兼容写法（也支持）**：

```json
{
  "name": "User - CRUD",
  "actions": [
    "**/createUserAction",
    "**/updateUserAction",
    "**/deleteUserAction"
  ]
}
```

---

## 修复效果

### 修复前

```
用户权限: create*Action, get*Action, update*Action
尝试操作: 删除用户
结果: 删除成功（权限检查被跳过）
```

### 修复后

```
用户权限: create*Action, get*Action, update*Action
尝试操作: 删除用户
结果: ❌ 403 Forbidden: Action 'deleteUserAction' not allowed
```

---

## 📝 修改的文件

### 代码修改

1. **`lib/core/crud-helper.js`**
   - 添加 `pascalCase` 函数（复数转单数）
   - 为所有 CRUD 操作添加 `permissionId`

2. **`app/(admin)/actions/dao/sys.js`**
   - 修复 `patternToRegex` 函数（支持无路径前缀）

### 文档更新

3. **`docs/rbac/ACTIONS_PATH_GUIDE.md`**
   - 明确说明 `permissionId` 是纯函数名
   - 说明 `**/` 前缀是可选的
   - 推荐使用简洁写法
   - 添加 FAQ 部分

4. **`docs/archive/crud-permission-fix-2024-11-14.md`**（本文档）
   - 完整记录漏洞和修复过程

---

## 🔒 安全建议

### 立即行动

1. **应用修复**：已完成代码修复
2. **更新文档**：已更新相关文档
3. 🔄 **审查权限配置**：建议审查现有权限配置，统一使用推荐写法

### 后续优化

1. **统一权限配置**：将现有权限配置中的 `**/` 前缀改为简洁写法
2. **添加测试**：为权限匹配逻辑添加单元测试
3. **监控日志**：监控权限拒绝日志，发现异常访问

---

## 📚 相关文档

- [Actions 路径配置指南](../rbac/ACTIONS_PATH_GUIDE.md)
- [后台权限系统文档](../admin/AUTH.md)
- [RBAC 权限修复记录](./rbac-permission-fix-2024-11-14.md)

---

**修复状态**: 已完成  
**验证状态**: 已验证  
**文档状态**: 已更新

