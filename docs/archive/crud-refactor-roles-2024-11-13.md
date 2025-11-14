# Roles 页面重构记录

**日期：** 2024-11-13  
**目标：** 将 Roles 页面按照 Permissions 页面的统一标准进行重构

---

## 🎯 重构目标

将 Roles 页面从旧的三文件结构（page.js + admin-roles.js + role-crud.config.js）重构为新的两文件结构（page.js + crud-action.role.js），与 Permissions 页面保持一致。

---

## 📋 重构前后对比

### 重构前（旧结构）

```
app/(admin)/admin/rbac/roles/
  └── page.js (465 行)
      - fieldsConfig
      - 自定义行操作
      - 权限/菜单分配 Modal

app/(admin)/actions/rbac/
  ├── admin-roles.js (167 行)
  │   - 导入 roleCrudConfig
  │   - 创建 crudActions
  │   - 导出标准 Actions
  │   - 导出自定义 Actions
  │
  └── configs/
      └── role-crud.config.js (209 行)
          - collectionName
          - fields
          - validation
          - hooks
          - transforms
```

**问题：**
- ❌ 三个文件分散，难以维护
- ❌ 配置和 Actions 分离
- ❌ 与 Permissions 页面结构不一致

### 重构后（新结构）

```
app/(admin)/admin/rbac/roles/
  └── page.js (454 行)
      - fieldsConfig (客户端配置)
      - 自定义行操作
      - 权限/菜单分配 Modal

app/(admin)/actions/rbac/
  └── crud-action.role.js (335 行)
      - roleConfig (服务端配置)
      - 创建 crudActions
      - 导出标准 Actions
      - 导出自定义 Actions
```

**优点：**
- ✅ 两个文件，结构清晰
- ✅ 配置和 Actions 统一在一个文件
- ✅ 与 Permissions 页面结构一致
- ✅ 符合 CRUD 标准模板

---

## 🔧 重构步骤

### 步骤 1：创建新的 crud-action.role.js

将 `role-crud.config.js` 的配置和 `admin-roles.js` 的逻辑合并到一个文件：

```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction, wrapAdminAction } from '@/lib/core/action-wrapper';

/**
 * Role CRUD 配置
 * ✅ 所有服务端配置集中在这里
 */
const roleConfig = {
  collectionName: 'roles',
  primaryKey: 'id',
  softDelete: false,
  
  fields: {
    creatable: ['name', 'remark', 'enable'],
    updatable: ['name', 'remark', 'enable', 'permission', 'menu'],
    searchable: ['name', 'remark'],
  },
  
  query: {
    defaultSort: { name: 1 },
    defaultPageSize: 20,
    // 连表配置
    foreignDB: [
      {
        dbName: 'permissions',
        localKey: 'permission',
        foreignKey: 'id',
        as: 'permissionList',
        fieldJson: { id: 1, name: 1 },
      },
      {
        dbName: 'menus',
        localKey: 'menu',
        foreignKey: 'id',
        as: 'menuList',
        fieldJson: { id: 1, name: 1 },
      },
    ],
  },
  
  validation: { /* ... */ },
  hooks: { /* ... */ },
  transforms: { /* ... */ },
};

// 创建标准 CRUD Actions
const crudActions = createCrudActions(roleConfig);

// 导出标准 Actions
export const getRoleListAction = crudActions.getList;
export const getRoleDetailAction = crudActions.getDetail;
export const createRoleAction = crudActions.create;
export const updateRoleAction = crudActions.update;
export const deleteRoleAction = crudActions.delete;

// 导出自定义 Actions
export const assignPermissionsToRoleAction = /* ... */;
export const assignMenusToRoleAction = /* ... */;
export const toggleRoleStatusAction = /* ... */;
```

### 步骤 2：更新 page.js

简化 imports 和 SmartCrudPage 配置：

```javascript
// 重构前
import {
  getRoleListAction as getList,
  getRoleDetailAction,
  createRoleAction as create,
  updateRoleAction as update,
  deleteRoleAction as deleteItem,
  assignPermissionsToRoleAction,
  assignMenusToRoleAction,
} from '@/app/(admin)/actions/rbac/admin-roles';

<SmartCrudPage
  actions={{
    getList,
    create,
    update,
    delete: deleteItem,
  }}
  tableOptions={{ scroll: { x: 1200 } }}
  formOptions={{ modalWidth: 600 }}
/>

// 重构后
import * as roleActions from '@/app/(admin)/actions/rbac/crud-action.role';

<SmartCrudPage
  actions={{
    getList: roleActions.getRoleListAction,
    getDetail: roleActions.getRoleDetailAction,
    create: roleActions.createRoleAction,
    update: roleActions.updateRoleAction,
    delete: roleActions.deleteRoleAction,
  }}
  tableProps={{ scroll: { x: 1200 } }}
  formProps={{ width: 600 }}
/>
```

### 步骤 3：更新自定义 Actions 调用

```javascript
// 重构前
const result = await getRoleDetailAction({ id: record.id });
const result = await assignPermissionsToRoleAction({ 
  roleId, 
  permissionIds 
});

// 重构后
const result = await roleActions.getRoleDetailAction(record.id);
const result = await roleActions.assignPermissionsToRoleAction({ 
  roleId, 
  permissionIds 
});
```

### 步骤 4：删除旧文件

```bash
# 删除旧的配置文件
app/(admin)/actions/rbac/configs/role-crud.config.js

# 删除旧的 Actions 文件
app/(admin)/actions/rbac/admin-roles.js
```

---

## 📊 代码统计

### 文件数量

| 结构 | 文件数 | 总行数 |
|------|--------|--------|
| **重构前** | 3 个文件 | 841 行 |
| **重构后** | 2 个文件 | 789 行 |
| **减少** | -1 个文件 | -52 行 |

### 详细对比

**重构前：**
- `page.js`: 465 行
- `admin-roles.js`: 167 行
- `role-crud.config.js`: 209 行
- **总计：** 841 行

**重构后：**
- `page.js`: 454 行 (-11 行)
- `crud-action.role.js`: 335 行
- **总计：** 789 行 (-52 行)

---

## ✅ 功能保留检查清单

### 标准 CRUD 操作

- [x] **列表查询** - `getRoleListAction`
  - 支持分页
  - 支持搜索（name, remark）
  - 支持排序
  - 自动连表（permissions, menus）

- [x] **详情查看** - `getRoleDetailAction`
  - 返回完整角色信息
  - 包含权限和菜单信息

- [x] **创建角色** - `createRoleAction`
  - 字段验证
  - 设置默认值（enable: true, permission: [], menu: []）
  - 输入数据转换

- [x] **更新角色** - `updateRoleAction`
  - 防止修改 admin 角色
  - 支持更新 permission 和 menu 字段
  - 字段验证

- [x] **删除角色** - `deleteRoleAction`
  - 防止删除 admin 角色
  - 自动清理用户表中的引用（afterDelete hook）

### 自定义操作

- [x] **分配权限** - `assignPermissionsToRoleAction`
  - 更新 permission 字段
  - 参数验证

- [x] **分配菜单** - `assignMenusToRoleAction`
  - 更新 menu 字段
  - 参数验证

- [x] **切换状态** - `toggleRoleStatusAction`
  - 更新 enable 字段

- [x] **获取角色列表（选择器）** - `getRoleListForSelectAction`
  - 只返回启用的角色
  - 可选添加标签（权限/菜单数量）

### 生命周期钩子

- [x] **beforeCreate** - 设置默认值
- [x] **beforeUpdate** - 防止修改 admin 角色
- [x] **beforeDelete** - 防止删除 admin 角色
- [x] **afterDelete** - 清理用户表引用
- [x] **beforeBatchDelete** - 防止批量删除 admin 角色

### 数据转换

- [x] **input transform** - 清理空格、类型转换
- [x] **output transform** - 确保数组类型、默认值

---

## 🎨 页面功能

### 表格显示

| 字段 | 类型 | 宽度 | 说明 |
|------|------|------|------|
| Name | text | 150px | 可搜索 |
| Permissions | custom | 120px | 显示数量 Tag |
| Menus | custom | 100px | 显示数量 Tag |
| Status | switch | 100px | 启用/禁用 Tag |
| Remark | textarea | 200px | 可搜索 |

### 操作按钮

**标准操作：**
- ✅ View (Detail)
- ✅ Edit
- ✅ Delete

**自定义操作：**
- ✅ Assign Permissions（在 More 菜单中）
- ✅ Assign Menus（在 More 菜单中）
- ✅ admin 角色不显示这两个操作

### Modal 弹窗

**1. 权限分配 Modal**
- Tree 组件展示权限树
- 支持多选
- 自动加载当前角色的权限
- 保存时更新 permission 字段

**2. 菜单分配 Modal**
- Tree 组件展示菜单树
- 支持多选
- 自动加载当前角色的菜单
- 可选：Auto bind menu permissions
- 保存时更新 menu 字段

---

## 🔍 关键改进点

### 1. 统一的文件结构

**重构前：**
```javascript
// admin-roles.js
import { roleCrudConfig } from './configs/role-crud.config';
const crudActions = createCrudActions(roleCrudConfig);
```

**重构后：**
```javascript
// crud-action.role.js
const roleConfig = { /* 配置直接在这里 */ };
const crudActions = createCrudActions(roleConfig);
```

**优点：**
- 配置和 Actions 在同一个文件，更容易维护
- 不需要跨文件查找配置

### 2. 一致的导入方式

**重构前：**
```javascript
import {
  getRoleListAction as getList,
  createRoleAction as create,
  // ...
} from '@/app/(admin)/actions/rbac/admin-roles';
```

**重构后：**
```javascript
import * as roleActions from '@/app/(admin)/actions/rbac/crud-action.role';

// 使用
roleActions.getRoleListAction
roleActions.createRoleAction
```

**优点：**
- 命名空间清晰
- 避免命名冲突
- 统一的调用方式

### 3. 标准的 Props 命名

**重构前：**
```javascript
<SmartCrudPage
  tableOptions={{ scroll: { x: 1200 } }}
  formOptions={{ modalWidth: 600 }}
/>
```

**重构后：**
```javascript
<SmartCrudPage
  tableProps={{ scroll: { x: 1200 } }}
  formProps={{ width: 600 }}
/>
```

**优点：**
- 与 Ant Design 命名风格一致（tableProps, formProps）
- 更符合 React 组件的命名习惯

### 4. 简化的 API 调用

**重构前：**
```javascript
const result = await getRoleDetailAction({ id: record.id });
```

**重构后：**
```javascript
const result = await roleActions.getRoleDetailAction(record.id);
```

**优点：**
- API 更简洁
- 与 `crudActions.getDetail` 的标准签名一致

---

## 📝 与 Permissions 页面的一致性

### 文件结构

| 页面 | page.js | actions.js | 配置文件 |
|------|---------|-----------|---------|
| **Permissions** | ✅ 311 行 | ✅ crud-action.permission.js (361 行) | ❌ 无 |
| **Roles** | ✅ 454 行 | ✅ crud-action.role.js (335 行) | ❌ 无 |

### Actions 命名

| 功能 | Permissions | Roles |
|------|-------------|-------|
| 列表 | `getPermissionListAction` | `getRoleListAction` |
| 详情 | `getPermissionDetailAction` | `getRoleDetailAction` |
| 创建 | `createPermissionAction` | `createRoleAction` |
| 更新 | `updatePermissionAction` | `updateRoleAction` |
| 删除 | `deletePermissionAction` | `deleteRoleAction` |

### 配置结构

两者都使用相同的配置结构：

```javascript
const config = {
  collectionName: 'xxx',
  primaryKey: 'id',
  softDelete: false,
  fields: { /* ... */ },
  query: { /* ... */ },
  validation: { /* ... */ },
  hooks: { /* ... */ },
  transforms: { /* ... */ },
};
```

---

## 🧪 测试清单

### 基本 CRUD 操作

- [ ] **列表展示**
  - [ ] 正确显示所有角色
  - [ ] 权限和菜单数量显示正确
  - [ ] 状态 Tag 显示正确
  - [ ] 连表数据（permissionList, menuList）正确

- [ ] **创建角色**
  - [ ] 必填字段验证
  - [ ] 默认值设置正确（enable: true）
  - [ ] 创建后刷新列表

- [ ] **编辑角色**
  - [ ] 加载当前数据
  - [ ] 保存后更新列表
  - [ ] admin 角色不可编辑

- [ ] **删除角色**
  - [ ] 确认提示
  - [ ] 删除后刷新列表
  - [ ] 用户表中的引用被清理
  - [ ] admin 角色不可删除

- [ ] **查看详情**
  - [ ] 显示所有字段
  - [ ] 权限列表以 Tag 显示
  - [ ] 菜单列表以 Tag 显示

### 搜索功能

- [ ] **按名称搜索**
  - [ ] 模糊搜索生效
  - [ ] 清除搜索恢复列表

- [ ] **按备注搜索**
  - [ ] 模糊搜索生效
  - [ ] 清除搜索恢复列表

### 自定义操作

- [ ] **分配权限**
  - [ ] 弹窗显示权限树
  - [ ] 当前权限已选中
  - [ ] 保存后更新成功
  - [ ] admin 角色不显示此按钮

- [ ] **分配菜单**
  - [ ] 弹窗显示菜单树
  - [ ] 当前菜单已选中
  - [ ] 保存后更新成功
  - [ ] admin 角色不显示此按钮

### 连表查询

- [ ] **列表查询**
  - [ ] permissionList 字段包含权限名称
  - [ ] menuList 字段包含菜单名称

- [ ] **详情查询**
  - [ ] 权限以名称显示（不是 ID）
  - [ ] 菜单以名称显示（不是 ID）

---

## ✨ 下一步

1. **测试所有功能**
   - 基本 CRUD 操作
   - 搜索功能
   - 权限和菜单分配
   - 连表查询

2. **应用到其他 RBAC 页面**
   - Users 页面
   - Menus 页面

3. **更新文档**
   - 更新 CRUD 标准文档
   - 添加 Roles 页面使用示例
   - 创建重构指南

---

## 📊 总结

### 重构成果

- ✅ 简化了文件结构（3 个文件 → 2 个文件）
- ✅ 减少了代码行数（841 行 → 789 行）
- ✅ 提高了代码可维护性
- ✅ 与 Permissions 页面保持一致
- ✅ 符合 CRUD 标准模板

### 关键特性保留

- ✅ 所有标准 CRUD 操作
- ✅ 所有自定义操作（分配权限/菜单）
- ✅ 所有生命周期钩子
- ✅ 所有数据验证和转换
- ✅ 连表查询功能

---

**重构完成！** 🎉

Roles 页面现在与 Permissions 页面采用相同的结构，更易维护和扩展！

